/** Return an external canonical article URL only for the official HTTPS origin. */
export function safeCanonicalUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    if (url.protocol !== 'https:' || url.origin !== 'https://hybridmind.online' || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}
