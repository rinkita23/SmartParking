/**
 * API client for the Flask + SQLite backend.
 *
 * - Adds JWT to Authorization header when present.
 * - Falls back to localStorage when the backend is unreachable.
 * - Card / CVV / UPI / bank credentials are NEVER sent to the backend —
 *   only the high-level method label (`Card` / `UPI` / `Net Banking`).
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "parking_jwt";

let backendAvailable: boolean | null = null;

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET", signal: AbortSignal.timeout(2000) });
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  setTimeout(() => { backendAvailable = null; }, 30000);
  return backendAvailable;
}

export async function isBackendAvailable(): Promise<boolean> {
  return checkBackend();
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────
export interface AuthResponse { id: string; name: string; email: string; role: string; token: string; }

export async function apiLogin(email: string, password: string) {
  const data = await apiPost<AuthResponse>("/login", { email, password });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiSignup(name: string, email: string, password: string) {
  const data = await apiPost<AuthResponse>("/signup", { name, email, password });
  if (data.token) setToken(data.token);
  return data;
}

export function apiLogout() { setToken(null); }

// ─── Slots ────────────────────────────────────────────────────────
export async function apiGetSlots() {
  return apiGet<Array<{ id: string; number: string; level: number; status: string; rate: number; vehicleNumber?: string }>>("/slots");
}

export async function apiUpdateSlot(slotId: string, status: string, vehicleNumber?: string) {
  return apiPost("/update-slot", { slotId, status, vehicleNumber });
}

// ─── Bookings ─────────────────────────────────────────────────────
export async function apiBookSlot(data: {
  id?: string;
  userId: string; slotId: string; slotNumber: string; vehicleNumber: string;
  date: string; startTime: string; endTime: string; amount: number;
  status?: string; paymentMethod?: string; paymentStatus?: string;
  pendingExitAmount?: number; receiptNumber?: string;
}) {
  return apiPost<any>("/book-slot", data);
}

export async function apiGetActiveBookings(userId: string) {
  return apiGet<any[]>(`/active-booking?userId=${userId}`);
}

export async function apiGetBookings(userId?: string) {
  return apiGet<any[]>(`/bookings${userId ? `?userId=${userId}` : ""}`);
}

export async function apiExtendBooking(bookingId: string, newEndTime: string, additionalAmount: number, paymentMethod?: string) {
  return apiPost("/extend-booking", { bookingId, newEndTime, additionalAmount, paymentMethod });
}

// ─── Notifications ────────────────────────────────────────────────
export async function apiGetNotifications(userId: string) {
  return apiGet<any[]>(`/notifications?userId=${userId}`);
}

export async function apiMarkNotificationRead(notifId: string) {
  return apiPost("/notifications/read", { notifId });
}

// ─── Vehicle Logs ─────────────────────────────────────────────────
export async function apiVehicleLog(vehicleNumber: string, slotId: string, type: "entry" | "exit") {
  return apiPost("/vehicle-log", { vehicleNumber, slotId, type });
}

// ─── Users ────────────────────────────────────────────────────────
export async function apiGetUsers() {
  return apiGet<any[]>("/users");
}

// ─── Feedback ─────────────────────────────────────────────────────
export async function apiSubmitFeedback(name: string, email: string, message: string) {
  return apiPost<{ ok: boolean; id: string }>("/feedback", { name, email, message });
}
