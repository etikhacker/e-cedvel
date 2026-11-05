export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const INVITE_TOKEN = /^[a-f0-9]{64}$/;
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function safeFilename(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0,100) || 'Cedvel';
}
export function inviteInput(body: unknown): {email:string; university_id:string} | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { email, university_id } = body as Record<string,unknown>;
  if (typeof email !== 'string' || email.length>254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim())
    || typeof university_id !== 'string' || !UUID.test(university_id)) return null;
  return {email:email.trim().toLowerCase(),university_id};
}
export function callbackDestination(type: string|null, next: string|null): string {
  if (type==='recovery') return '/reset-password';
  if (next && /^\/admin\/setup\?token=[a-f0-9]{64}$/.test(next)) return next;
  return '/dashboard';
}
