// Indian vehicle number format: XX00XX0000 (e.g., GJ01AB1234)
const INDIAN_VEHICLE_REGEX = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;

export function validateVehicleNumber(value: string): string | null {
  const cleaned = value.toUpperCase().replace(/[\s-]/g, "");
  if (!cleaned) return "Vehicle number is required";
  if (!INDIAN_VEHICLE_REGEX.test(cleaned)) return "Enter a valid vehicle number (e.g., GJ01AB1234)";
  return null;
}

export function validateBookingDate(date: string): string | null {
  if (!date) return "Date is required";
  const today = new Date().toISOString().split("T")[0];
  if (date < today) return "Date must be today or in the future";
  return null;
}

export function validateBookingTime(date: string, startTime: string, endTime: string): string | null {
  if (!startTime) return "Start time is required";
  if (!endTime) return "End time is required";

  const now = new Date();
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);

  const today = now.toISOString().split("T")[0];
  // Allow booking up to 5 minutes before start time (for demo/live use)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  if (date === today && startDateTime < fiveMinutesAgo) return "Start time must be within 5 minutes from now or in the future";
  if (endDateTime <= startDateTime) return "End time must be after start time";

  return null;
}

export function formatVehicleNumber(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
