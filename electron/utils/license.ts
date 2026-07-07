/**
 * License key validation — placeholder implementation.
 *
 * Replace this function body with a real license-server call before distributing
 * paid copies. Client-side checks are a deterrent, not a guarantee — see SECURITY.md.
 */
export function validateLicense(): void {
  const key = process.env.LICENSE_KEY;

  if (!key) {
    // No key set — allow app to run (suitable for internal / trial use)
    return;
  }

  // Placeholder format check: real keys should be validated server-side
  const VALID_PREFIX_RE = /^SP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!VALID_PREFIX_RE.test(key)) {
    console.warn('[License] Key format invalid. Contact support.');
    // In production you may call app.quit() here after showing a dialog
  }
}
