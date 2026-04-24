// Payment field validators. NOTE: card/CVV/UPI/bank credentials are NEVER persisted.

// Luhn check for card numbers
export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(value: string): string | null {
  const cleaned = value.replace(/\s/g, "");
  if (!cleaned) return "Card number is required";
  if (!/^\d+$/.test(cleaned)) return "Card number must be digits only";
  if (cleaned.length !== 16) return "Card number must be 16 digits";
  if (!luhnCheck(cleaned)) return "Invalid card number";
  return null;
}

export function validateCVV(value: string): string | null {
  if (!value) return "CVV is required";
  if (!/^\d{3,4}$/.test(value)) return "CVV must be 3 or 4 digits";
  return null;
}

export function validateExpiry(value: string): string | null {
  if (!value) return "Expiry is required";
  const m = value.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return "Use MM/YY format";
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return "Invalid month";
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59);
  if (exp < now) return "Card has expired";
  return null;
}

export function formatCardNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

// UPI: handle@provider, e.g. name@okhdfc
const UPI_REGEX = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;
export function validateUPI(value: string): string | null {
  if (!value) return "UPI ID is required";
  if (!UPI_REGEX.test(value)) return "Enter a valid UPI ID (e.g. name@okhdfc)";
  return null;
}

export function validateMobile(value: string): string | null {
  const cleaned = value.replace(/\D/g, "");
  if (!cleaned) return "Mobile number is required";
  if (!/^[6-9]\d{9}$/.test(cleaned)) return "Enter a valid 10-digit Indian mobile";
  return null;
}

export function validateBank(value: string): string | null {
  if (!value) return "Please select your bank";
  return null;
}

export function validateNetBankingUserId(value: string): string | null {
  if (!value || value.trim().length < 3) return "Enter a valid user ID";
  return null;
}

export function validateNetBankingPassword(value: string): string | null {
  if (!value || value.length < 4) return "Enter your net banking password";
  return null;
}
