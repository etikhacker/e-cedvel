// Start production browser sessions on one origin so PKCE cookies and callbacks agree.
export function canonicalPageRedirect(url: string, method: string, environment: string | undefined,
  configuredUrl: string | undefined): string | null {
  if (environment !== 'production' || !configuredUrl || !['GET','HEAD'].includes(method)) return null;
  const source = new URL(url);
  if (source.pathname.startsWith('/api/')) return null;
  const canonical = new URL(configuredUrl);
  if (canonical.protocol !== 'https:' || canonical.username || canonical.password) return null;
  if (source.origin === canonical.origin) return null;
  source.protocol = canonical.protocol;
  source.host = canonical.host;
  return source.href;
}
