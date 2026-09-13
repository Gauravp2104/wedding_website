// Resolve the site's own base URL for building absolute links (e.g. the
// "edit my RSVP" link in confirmation emails). SITE_URL overrides — set it
// in production to the site's real domain — otherwise it's derived from the
// incoming request, which works fine on Vercel where Host is the real domain.
export function resolveOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers.host || (req.get && req.get('host'));
  return `${proto}://${host}`;
}
