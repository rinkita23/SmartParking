export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

export interface ParkingSlot {
  id: string;
  number: string;
  level: number;
  status: "available" | "occupied" | "reserved";
  rate: number;
  vehicleNumber?: string;
}

export interface Booking {
  id: string;
  userId: string;
  slotId: string;
  slotNumber: string;
  vehicleNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: "reserved" | "booked" | "completed" | "cancelled" | "expired";
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: "pending" | "paid" | "due_on_exit" | "settled";
  pendingExitAmount?: number;
  receiptNumber?: string;
}

export interface VehicleLog {
  id: string;
  vehicleNumber: string;
  slotId: string;
  entryTime?: string;
  exitTime?: string;
  type: "entry" | "exit";
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "booking_confirmed" | "expiry_warning" | "expired" | "payment_success";
  createdAt: string;
  read: boolean;
  bookingId?: string;
}
