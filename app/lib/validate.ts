export type Rule = {
  key: string;
  label: string;
  required?: boolean;
};

export type Errors = Record<string, string | null>;

export function validate(data: Record<string, unknown>, rules: Rule[]): Errors {
  const errors: Errors = {};
  for (const rule of rules) {
    if (!rule.required) continue;
    const value = data[rule.key];
    if (value === undefined || value === null || value === "") {
      errors[rule.key] = `${rule.label} is required`;
    }
  }
  return errors;
}

export function hasErrors(errors: Errors): boolean {
  return Object.values(errors).some((e) => e !== null && e !== undefined);
}
