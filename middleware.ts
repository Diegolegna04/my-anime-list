import { next, rewrite } from '@vercel/functions';

// Vercel Routing Middleware (fuori da src/: non fa parte della build Angular).
// Aggiunge l'header segreto alle chiamate /api verso Railway, così il backend si fida
// dell'IP in X-Forwarded-For solo se la richiesta arriva da qui.
// Senza BACKEND_PROXY_SECRET non fa nulla e vale la rewrite di vercel.json.
const BACKEND_URL = process.env['BACKEND_URL'] ?? 'https://backend-production-d0d99.up.railway.app';

export const config = { matcher: '/api/:path*' };

export default function middleware(request: Request): Response {
  const secret = process.env['BACKEND_PROXY_SECRET'];
  if (!secret) {
    return next();
  }
  const url = new URL(request.url);
  const destination = new URL(url.pathname + url.search, BACKEND_URL);
  // `request.headers` sostituisce tutti gli header della richiesta upstream: si parte da una copia
  // di quelli originali (cookie di sessione compresi) e si imposta il segreto, sovrascrivendo
  // un eventuale valore inviato dal client.
  const headers = new Headers(request.headers);
  headers.set('X-Proxy-Secret', secret);
  return rewrite(destination, { request: { headers } });
}
