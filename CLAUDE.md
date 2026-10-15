# CLAUDE.md — my-anime-list (frontend)

Client Angular del clone di MyAnimeList. Backend Quarkus nel repo sorella `../my-anime-list-backend`.
Architettura, autenticazione e integrazione col backend: `PROJECT.md`. Sistema visivo: `DESIGN.md`. Criticità note: `../TODO.md`.

## Stack

- Angular 20 (componenti standalone, signals, RxJS), TypeScript 5.8.
- CSS puro per componente (`*.component.css`); token e classi globali in `src/styles.css`. Niente Tailwind, niente SCSS.
- Icone: Font Awesome 6.0.0-beta3 da CDN (`src/index.html`). Nessun webfont: il testo usa `--font-sans` (oggi solo `sans-serif`).
- `@angular/cdk` (drag & drop nel profilo).
- Test: Karma + Jasmine (~124 specs: servizi core, login-register, profile, watched-anime e molti componenti).
- Lint: ESLint (`angular-eslint`, `eslint.config.js`); formato: Prettier (`.prettierrc.json`).

## Comandi

```bash
npm start                                   # http://localhost:4200, /api proxato da proxy.conf.json
npm run build                               # build di produzione + typecheck (dist/my-anime-list/browser)
npx ng test --watch=false --browsers=ChromeHeadless
npm run lint                                # ESLint: gli errori bloccano, gli avvisi (`any`, `prefer-inject`) no
npm run format                              # Prettier su tutto il repo; `npm run format:check` per controllare
vercel --prod                               # deploy: solo da CLI (niente integrazione Git); vedi README
```

La CI (`.github/workflows/ci.yml`) lancia a ogni push lint, `format:check`, test e build. Non fa deploy.

## Regole

- Tutte le chiamate al backend usano path relativi `/api/...`. In produzione Vercel le riscrive verso Railway (`vercel.json`); in locale lo fa `proxy.conf.json`. Non introdurre URL assoluti.
- `middleware.ts` (Vercel Routing Middleware, fuori da `src/`) aggiunge `X-Proxy-Secret` e `X-Client-IP` (l'IP vero dell'utente: in questa rewrite `X-Forwarded-For` inizia con l'IP di uscita di Vercel) alle chiamate `/api` con una rewrite verso Railway. Se `BACKEND_PROXY_SECRET` non è impostata su Vercel non fa nulla e vale la rewrite di `vercel.json`.
- `BACKEND_PROXY_SECRET` (Vercel) deve essere uguale a `APP_PROXY_SECRET` (Railway). Ordine di deploy: prima `BACKEND_PROXY_SECRET` su Vercel (Production e Preview) + deploy, e smoke test di una preview (login con cookie e `/api/auth/profile` 200); solo dopo `APP_PROXY_SECRET` su Railway + deploy. Il motivo: un backend con il segreto che riceve richieste senza header usa l'ultima voce di `X-Forwarded-For`, cioè l'IP di Vercel, e tutti gli utenti finiscono nello stesso bucket di rate limit per IP; un backend senza segreto ignora l'header (comportamento di prima), quindi partire da Vercel è innocuo.
- L'URL di Railway è in due posti, da cambiare insieme: `vercel.json` e `middleware.ts` (default di `BACKEND_URL`, override opzionale via env Vercel).
- Prima di toccare l'interfaccia leggi `DESIGN.md` e rispettalo: solo token `var(--…)`, solo icone Font Awesome, un solo spinner globale, tema scuro tramite token.
- Per lavoro estetico (analisi, restyling, rifinitura, animazioni) usa la skill `/styling`.
- Testi dell'interfaccia solo in italiano, scritti nei template (niente i18n).
- Nuovi componenti: standalone, nella cartella della pagina che li usa; se condivisi in `src/app/services/shared/`.
- Screenshot e file di Playwright vanno in `.playwright-mcp/` (ignorata da git), mai in `src/` o `public/`.

## Git

- Mai lavorare direttamente su `main`/`master`: lavoro estetico su `styling/<target>`, il resto su un branch dedicato.
- Commit e push solo su richiesta esplicita.

## Trappole note

- La sessione è un cookie httpOnly del backend (`withCredentials: true`); `localStorage` contiene solo uno stato "specchio" per la UI.
- Le chiamate al proxy anime passano da `AnimeService` (coda con rate limit, retry su 429; i 502/503/504 si ritentano solo per `getAnimeById` e, tramite `withRetry`, per `getRandomAnime`, `searchAnime` e `getPopularAnime`; dettagli, consigli, streaming, news, top e generi passano dalla corsia prioritaria della coda e non aspettano l'arretrato delle liste). Non aggiungere `HttpClient` diretto verso `/api/anime-proxy` nei componenti. La cache localStorage da 24 ore vale solo per `getAnimeById` (liste); la pagina di dettaglio legge sempre dati freschi.
- Login, registrazione e profilo passano da `AuthService`; la password viaggia in chiaro su HTTPS, niente hashing lato client.
