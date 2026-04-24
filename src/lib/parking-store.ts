import { ParkingSlot, User, Booking, VehicleLog, Notification } from "@/types/parking";
import {
  isBackendAvailable,
  apiLogin, apiSignup, apiLogout,
  apiGetSlots, apiUpdateSlot,
  apiBookSlot, apiGetBookings, apiExtendBooking,
  apiGetNotifications, apiMarkNotificationRead,
  apiVehicleLog, apiGetUsers, apiSubmitFeedback,
} from "@/lib/api";
import { INR_PER_HOUR, RESERVATION_GRACE_MINUTES, formatCurrency } from "@/lib/currency";

// Fire-and-forget backend sync helper. Logs but never throws.
function syncToBackend(label: string, fn: () => Promise<unknown>) {
  isBackendAvailable().then((ok) => {
    if (!ok) return;
    fn().catch((e) => console.warn(`[backend sync:${label}]`, e));
  });
}

// Default parking slots
const DEFAULT_SLOTS: ParkingSlot[] = Array.from({ length: 30 }, (_, i) => ({
  id: `slot-${i + 1}`,
  number: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`,
  level: Math.floor(i / 10) + 1,
  status: i < 20 ? "available" : i < 25 ? "occupied" : "reserved",
  rate: INR_PER_HOUR,
  vehicleNumber: i >= 20 && i < 25 ? `VH-${1000 + i}` : undefined,
}));

const STORAGE_KEYS = {
  users: "parking_users",
  currentUser: "parking_current_user",
  slots: "parking_slots",
  bookings: "parking_bookings",
  vehicleLogs: "parking_vehicle_logs",
  notifications: "parking_notifications",
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAdminUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.users, []).filter((user) => user.role === "admin");
}

// Initialize default data
export function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.slots)) {
    setItem(STORAGE_KEYS.slots, DEFAULT_SLOTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    setItem(STORAGE_KEYS.users, [
      { id: "admin-1", name: "Admin", email: "admin@parking.com", password: "admin123", role: "admin" },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.bookings)) {
    setItem(STORAGE_KEYS.bookings, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.vehicleLogs)) {
    setItem(STORAGE_KEYS.vehicleLogs, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
    setItem(STORAGE_KEYS.notifications, []);
  }
}

// Auth
export function login(email: string, password: string): User | null {
  const users = getItem<User[]>(STORAGE_KEYS.users, []);
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    setItem(STORAGE_KEYS.currentUser, user);
    syncToBackend("login", () => apiLogin(email, password));
    return user;
  }
  // Backend-only fallback: try remote login asynchronously (best-effort)
  return null;
}

export function signup(name: string, email: string, password: string): User | null {
  const users = getItem<User[]>(STORAGE_KEYS.users, []);
  if (users.find((u) => u.email === email)) return null;
  const user: User = { id: `user-${Date.now()}`, name, email, password, role: "user" };
  users.push(user);
  setItem(STORAGE_KEYS.users, users);
  setItem(STORAGE_KEYS.currentUser, user);
  syncToBackend("signup", () => apiSignup(name, email, password));
  return user;
}

export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.currentUser, null);
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  apiLogout();
}

// Slots
export function getSlots(): ParkingSlot[] {
  return getItem<ParkingSlot[]>(STORAGE_KEYS.slots, DEFAULT_SLOTS);
}

export function updateSlotStatus(slotId: string, status: ParkingSlot["status"], vehicleNumber?: string) {
  const slots = getSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx !== -1) {
    slots[idx].status = status;
    slots[idx].vehicleNumber = vehicleNumber;
    setItem(STORAGE_KEYS.slots, slots);
    syncToBackend("update-slot", () => apiUpdateSlot(slotId, status, vehicleNumber));
  }
}

// Hydrate slots from backend (best effort) — call from app init
export async function hydrateSlotsFromBackend() {
  try {
    if (!(await isBackendAvailable())) return;
    const remote = await apiGetSlots();
    if (Array.isArray(remote) && remote.length > 0) {
      setItem(STORAGE_KEYS.slots, remote as ParkingSlot[]);
    }
  } catch (e) {
    console.warn("[backend sync:hydrate-slots]", e);
  }
}

// Bookings
export function getBookings(): Booking[] {
  return getItem<Booking[]>(STORAGE_KEYS.bookings, []);
}

export function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RC-${ts}-${rand}`;
}

export function createBooking(booking: Omit<Booking, "id" | "createdAt" | "receiptNumber">): Booking {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: `booking-${Date.now()}`,
    createdAt: new Date().toISOString(),
    receiptNumber: generateReceiptNumber(),
    paymentStatus: booking.paymentStatus || "pending",
    pendingExitAmount: booking.pendingExitAmount || 0,
  };
  bookings.push(newBooking);
  setItem(STORAGE_KEYS.bookings, bookings);
  updateSlotStatus(booking.slotId, "reserved", booking.vehicleNumber);

  addNotification(booking.userId, `Slot ${booking.slotNumber} reserved for ${booking.date} (${booking.startTime} - ${booking.endTime}). Show receipt ${newBooking.receiptNumber} on arrival.`, "booking_confirmed", newBooking.id);

  syncToBackend("book-slot", () => apiBookSlot({
    id: newBooking.id,
    userId: newBooking.userId,
    slotId: newBooking.slotId,
    slotNumber: newBooking.slotNumber,
    vehicleNumber: newBooking.vehicleNumber,
    date: newBooking.date,
    startTime: newBooking.startTime,
    endTime: newBooking.endTime,
    amount: newBooking.amount,
    status: newBooking.status,
    paymentMethod: newBooking.paymentMethod,
    paymentStatus: newBooking.paymentStatus,
    pendingExitAmount: newBooking.pendingExitAmount,
    receiptNumber: newBooking.receiptNumber,
  }));

  return newBooking;
}

export function updateBooking(bookingId: string, updates: Partial<Booking>) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx !== -1) {
    bookings[idx] = { ...bookings[idx], ...updates };
    setItem(STORAGE_KEYS.bookings, bookings);
  }
}

export function extendBooking(bookingId: string, newEndTime: string, additionalAmount: number, paymentMethod?: string) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx !== -1) {
    const b = bookings[idx];
    b.endTime = newEndTime;
    b.amount += additionalAmount;
    b.paymentStatus = "due_on_exit";
    b.pendingExitAmount = (b.pendingExitAmount || 0) + additionalAmount;
    if (paymentMethod) b.paymentMethod = paymentMethod;
    setItem(STORAGE_KEYS.bookings, bookings);

    addNotification(b.userId, `Slot ${b.slotNumber} extended until ${newEndTime}. Extra ${formatCurrency(additionalAmount)} will be collected at exit.`, "payment_success", bookingId);
    getAdminUsers().forEach((admin) => {
      addNotification(
        admin.id,
        `Extension request: Vehicle ${b.vehicleNumber}, Slot ${b.slotNumber}, Date ${b.date}, new end time ${newEndTime}, extra amount ${formatCurrency(additionalAmount)}, payment method ${paymentMethod || b.paymentMethod || "UPI"}.`,
        "payment_success",
        bookingId,
      );
    });

    syncToBackend("extend-booking", () => apiExtendBooking(bookingId, newEndTime, additionalAmount, paymentMethod));
  }
}

export function markArrivalPayment(bookingId: string) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) return;

  const booking = bookings[idx];
  booking.status = "booked";
  booking.paymentStatus = booking.pendingExitAmount ? "due_on_exit" : "paid";
  setItem(STORAGE_KEYS.bookings, bookings);

  const logs = getVehicleLogs();
  logs.push({
    id: `log-${Date.now()}`,
    vehicleNumber: booking.vehicleNumber,
    slotId: booking.slotId,
    entryTime: new Date().toISOString(),
    type: "entry",
  });
  setItem(STORAGE_KEYS.vehicleLogs, logs);

  updateSlotStatus(booking.slotId, "occupied", booking.vehicleNumber);
  addNotification(booking.userId, `Payment received for Slot ${booking.slotNumber}. You may park now.`, "payment_success", booking.id);
  syncToBackend("vehicle-entry", () => apiVehicleLog(booking.vehicleNumber, booking.slotId, "entry"));
}

// Admin-triggered exit: free a slot and complete the active booking
export function freeSlotByAdmin(slotId: string) {
  const slots = getSlots();
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return;
  const vehicleNumber = slot.vehicleNumber;

  // Find active booking on this slot and mark completed
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.slotId === slotId && (b.status === "booked" || b.status === "reserved"));
  if (idx !== -1) {
    const due = bookings[idx].pendingExitAmount || 0;
    bookings[idx].status = "completed";
    bookings[idx].paymentStatus = due > 0 ? "settled" : (bookings[idx].paymentStatus === "pending" ? "settled" : bookings[idx].paymentStatus);
    bookings[idx].pendingExitAmount = 0;
    setItem(STORAGE_KEYS.bookings, bookings);
    addNotification(
      bookings[idx].userId,
      due > 0
        ? `Your vehicle exited Slot ${bookings[idx].slotNumber}. Extra exit payment of ${formatCurrency(due)} has been collected.`
        : `Your vehicle has exited Slot ${bookings[idx].slotNumber}. Thank you!`,
      "expired",
      bookings[idx].id,
    );
  }

  // Log exit
  if (vehicleNumber) {
    const logs = getVehicleLogs();
    logs.push({
      id: `log-${Date.now()}`,
      vehicleNumber,
      slotId,
      exitTime: new Date().toISOString(),
      type: "exit",
    });
    setItem(STORAGE_KEYS.vehicleLogs, logs);
    syncToBackend("vehicle-exit", () => apiVehicleLog(vehicleNumber, slotId, "exit"));
  }

  updateSlotStatus(slotId, "available", undefined);
}

// Check and cancel missed arrivals / expire active bookings
export function checkAndExpireBookings(): Booking[] {
  const bookings = getBookings();
  const now = new Date();
  const expiredBookings: Booking[] = [];

  bookings.forEach((b) => {
    if (b.status !== "reserved" && b.status !== "booked") return;
    const startDateTime = new Date(`${b.date}T${b.startTime}`);
    const endDateTime = new Date(`${b.date}T${b.endTime}`);
    const arrivalCutoff = new Date(startDateTime.getTime() + RESERVATION_GRACE_MINUTES * 60 * 1000);

    if (b.status === "reserved" && now >= arrivalCutoff) {
      b.status = "cancelled";
      updateSlotStatus(b.slotId, "available", undefined);
      addNotification(
        b.userId,
        `Slot ${b.slotNumber} was cancelled because arrival was not completed within ${RESERVATION_GRACE_MINUTES} minutes of ${b.startTime}.`,
        "expired",
        b.id,
      );
      expiredBookings.push(b);
      return;
    }

    if (b.status === "booked" && now >= endDateTime) {
      b.status = "expired";
      updateSlotStatus(b.slotId, "available", undefined);
      addNotification(b.userId, `Your parking time has expired for Slot ${b.slotNumber}. Please vacate or extend your booking.`, "expired", b.id);
      expiredBookings.push(b);
    }
  });

  if (expiredBookings.length > 0) {
    setItem(STORAGE_KEYS.bookings, bookings);
  }

  return expiredBookings;
}

// Feedback storage
export interface Feedback { id: string; name: string; email: string; message: string; createdAt: string; }
export function getFeedback(): Feedback[] {
  return getItem<Feedback[]>("parking_feedback", []);
}
export function addFeedback(name: string, email: string, message: string): Feedback {
  const list = getFeedback();
  const item: Feedback = { id: `fb-${Date.now()}`, name, email, message, createdAt: new Date().toISOString() };
  list.unshift(item);
  setItem("parking_feedback", list);
  syncToBackend("feedback", () => apiSubmitFeedback(name, email, message));
  return item;
}

// Check for near-expiry bookings (within 10 minutes)
export function checkNearExpiryBookings(userId: string): Booking[] {
  const bookings = getBookings().filter((b) => b.userId === userId && b.status === "booked");
  const now = new Date();
  const nearExpiry: Booking[] = [];

  bookings.forEach((b) => {
    const endDateTime = new Date(`${b.date}T${b.endTime}`);
    const diff = endDateTime.getTime() - now.getTime();
    if (diff > 0 && diff <= 10 * 60 * 1000) {
      nearExpiry.push(b);
    }
  });

  return nearExpiry;
}

// Get remaining time for a booking in ms
export function getBookingRemainingTime(booking: Booking): number {
  const endDateTime = new Date(`${booking.date}T${booking.endTime}`);
  return Math.max(0, endDateTime.getTime() - Date.now());
}

// Vehicle Logs
export function getVehicleLogs(): VehicleLog[] {
  return getItem<VehicleLog[]>(STORAGE_KEYS.vehicleLogs, []);
}

export function logVehicleEntry(vehicleNumber: string, slotId: string) {
  const logs = getVehicleLogs();
  logs.push({
    id: `log-${Date.now()}`,
    vehicleNumber,
    slotId,
    entryTime: new Date().toISOString(),
    type: "entry",
  });
  setItem(STORAGE_KEYS.vehicleLogs, logs);
  updateSlotStatus(slotId, "occupied", vehicleNumber);
  syncToBackend("vehicle-entry", () => apiVehicleLog(vehicleNumber, slotId, "entry"));
}

export function logVehicleExit(vehicleNumber: string, slotId: string) {
  const logs = getVehicleLogs();
  logs.push({
    id: `log-${Date.now()}`,
    vehicleNumber,
    slotId,
    exitTime: new Date().toISOString(),
    type: "exit",
  });
  setItem(STORAGE_KEYS.vehicleLogs, logs);
  updateSlotStatus(slotId, "available", undefined);
  syncToBackend("vehicle-exit", () => apiVehicleLog(vehicleNumber, slotId, "exit"));
}

export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.users, []);
}

// Notifications
export function getNotifications(userId: string): Notification[] {
  return getItem<Notification[]>(STORAGE_KEYS.notifications, []).filter((n) => n.userId === userId);
}

export function addNotification(userId: string, message: string, type: Notification["type"], bookingId?: string) {
  const notifications = getItem<Notification[]>(STORAGE_KEYS.notifications, []);
  // Prevent duplicate notifications for same booking+type
  const exists = notifications.some((n) => n.bookingId === bookingId && n.type === type && n.userId === userId);
  if (exists) return;
  notifications.unshift({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false,
    bookingId,
  });
  setItem(STORAGE_KEYS.notifications, notifications);
}

export function markNotificationRead(notifId: string) {
  const notifications = getItem<Notification[]>(STORAGE_KEYS.notifications, []);
  const idx = notifications.findIndex((n) => n.id === notifId);
  if (idx !== -1) {
    notifications[idx].read = true;
    setItem(STORAGE_KEYS.notifications, notifications);
    syncToBackend("notif-read", () => apiMarkNotificationRead(notifId));
  }
}
