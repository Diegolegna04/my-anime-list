import { ipAddress, next, rewrite } from '@vercel/functions';

// Vercel Routing Middleware (fuori da src/: non fa parte della build Angular).
// Aggiunge l'header segreto alle chiamate /api verso Railway, così il backend si fida
// dell'IP in X-Forwarded-For solo se la richiesta arriva da qui.
// Senza BACKEND_PROXY_SECRET non fa nulla e vale la rewrite di vercel.json.
const BACKEND_URL = process.env['BACKEND_URL'] || 'https://backend-production-d0d99.up.railway.app';

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
  // Host e X-Forwarded-Host sono quelli dell'app Vercel: se restassero nell'override, Railway (che
  // instrada in base a Host) risponderebbe 404. Tolti, il proxy ricava Host dall'URL di destinazione.
  headers.delete('host');
  headers.delete('x-forwarded-host');
  headers.set('X-Proxy-Secret', secret);
  // Nel rewrite verso un URL esterno Vercel mette in X-Forwarded-For il proprio IP di uscita:
  // l'IP vero dell'utente va al backend in X-Client-IP. Un valore inviato dal client viene
  // sempre sovrascritto o tolto.
  const clientIp = ipAddress(request);
  if (clientIp) {
    headers.set('X-Client-IP', clientIp);
  } else {
    headers.delete('X-Client-IP');
  }
  return rewrite(destination, { request: { headers } });
}
