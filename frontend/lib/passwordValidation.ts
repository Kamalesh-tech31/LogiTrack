export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
  {
    id: "special",
    label: "One special character (!@#$%^&*)",
    test: (p: string) => /[!@#$%^&*]/.test(p),
  },
] as const;

export function getPasswordValidationErrors(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter((rule) => !rule.test(password)).map(
    (rule) => rule.label,
  );
}

export function isPasswordValid(password: string): boolean {
  return getPasswordValidationErrors(password).length === 0;
}
