/**
 * Turn a failed form validation into sentences a person can act on.
 *
 * ## Why this exists
 *
 * Five forms called `handleSubmit(onSubmit)` with **no invalid handler**. When the
 * form's own rules refused a submit, react-hook-form called the second handler —
 * which did not exist — so the click produced *nothing at all*: no message, no
 * scroll, no request, not even a spinner. The page simply looked dead. The fields
 * at fault sat in red, often below the fold, sometimes inside a collapsed row.
 *
 * One shared reader, so all of them explain themselves the same way (X-03).
 *
 * ## What it produces
 *
 * The field path is spelled out in words, because a bare rule message ("Must be
 * at least 1") says nothing on a form with thirty inputs:
 *
 *   `lots.2.quantity` + "Quantity must be at least 1"
 *   → `Lots #3 → Quantity — Quantity must be at least 1`
 *
 * Array positions are 1-based, the way a person counts.
 */
function humanise(part: string): string {
  const spaced = part.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `lots.2.quantity` reads as `Lots #3 → Quantity`. */
export function describeErrorPath(path: string[]): string {
  return path.reduce<string>((label, part) => {
    if (/^\d+$/.test(part)) return `${label} #${Number(part) + 1}`;
    const name = humanise(part);
    return label ? `${label} → ${name}` : name;
  }, "");
}

export function collectValidationProblems(errors: unknown): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  const walk = (node: unknown, path: string[]) => {
    if (!node || typeof node !== "object") return;

    // A node carrying a `message` is a leaf rule failure.
    const message = (node as { message?: unknown }).message;
    if (typeof message === "string" && message) {
      const label = describeErrorPath(path);
      const line = label ? `${label} — ${message}` : message;
      if (!seen.has(line)) {
        seen.add(line);
        problems.push(line);
      }
      return;
    }

    for (const [key, value] of Object.entries(
      node as Record<string, unknown>,
    )) {
      walk(value, [...path, key]);
    }
  };

  walk(errors, []);
  return problems;
}
