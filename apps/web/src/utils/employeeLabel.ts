/**
 * Employees look identical across many dropdowns and lists when only a name
 * or only an employee code is shown — two "Ravi Kumar"s are indistinguishable,
 * and a bare employee code means nothing to whoever's picking from the list.
 * Show both together everywhere a person is selected or displayed by identity.
 */
export function formatEmployeeLabel(
  emp:
    | {
        full_name?: string | null;
        employee_code?: string | null;
        fullName?: string | null;
        employeeCode?: string | null;
      }
    | null
    | undefined,
): string {
  if (!emp) return 'Unknown';
  const name = emp.full_name || emp.fullName;
  const code = emp.employee_code || emp.employeeCode;
  if (name && code) return `${name} (${code})`;
  return name || code || 'Unknown';
}
