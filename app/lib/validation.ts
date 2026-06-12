export type FieldError = string | null;
export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function required(value: unknown, label: string): string | null {
  if (value === undefined || value === null) return `${label} is required`;
  if (typeof value === "string" && value.trim().length === 0) return `${label} is required`;
  if (typeof value === "number" && !Number.isFinite(value)) return `${label} is required`;
  return null;
}

export function minLength(value: string, min: number, label: string): string | null {
  if (value.length < min) return `${label} must be at least ${min} characters`;
  return null;
}

export function isValidEmail(value: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
  return null;
}

export function minValue(value: number, min: number, label: string): string | null {
  if (value < min) return `${label} must be at least ${min}`;
  return null;
}

export function clearErrors<T>(formErrors: FormErrors<T>, ...fields: (keyof T)[]): FormErrors<T> {
  const next = { ...formErrors };
  for (const field of fields) delete next[field];
  return next;
}
