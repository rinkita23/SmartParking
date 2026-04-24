import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be under 50 characters"),
  email: z.string().trim().email("Enter a valid email").max(255).refine((val) => val.endsWith("@gmail.com"), "Only @gmail.com email addresses are accepted"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/\d/, "Must include a number")
    .regex(/[^A-Za-z0-9]/, "Must include a special character"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  checks: { label: string; ok: boolean }[];
}

export function evaluatePassword(pw: string): PasswordStrength {
  const checks = [
    { label: "8+ characters", ok: pw.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "Lowercase letter", ok: /[a-z]/.test(pw) },
    { label: "Number", ok: /\d/.test(pw) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.ok).length as 0 | 1 | 2 | 3 | 4 | 5;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score], checks };
}
