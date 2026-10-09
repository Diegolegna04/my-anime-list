# CLAUDE.md — my-anime-list (frontend)

Client Angular del clone di MyAnimeList. Backend Quarkus nel repo sorella `../my-anime-list-backend`.
Architettura, autenticazione e integrazione col backend: `PROJECT.md`. Sistema visivo: `DESIGN.md`. Criticità note: `../TODO.md`.

## Stack

- Angular 20 (componenti standalone, signals, RxJS), TypeScript 5.8.
- CSS puro per componente (`*.component.css`); token e classi globali in `src/styles.css`. Niente Tailwind, niente SCSS.
- Icone: Font Awesome 6.0.0-beta3 da CDN (`src/index.html`). Nessun webfont: il testo usa `--font-sans` (oggi solo `sans-serif`).
- `@angular/cdk` (drag & drop nel profilo).
- Test: Karma + Jasmine, solo su una parte dei componenti.

## Comandi

```bash
npm start                                   # http://localhost:4200, /api proxato da proxy.conf.json
npm run build                               # build di produzione + typecheck (dist/my-anime-list/browser)
npx ng test --watch=false --browsers=ChromeHeadless
```

Non c'è lint configurato: la verifica minima è `npm run build`.

## Regole

- Tutte le chiamate al backend usano path relativi `/api/...`. In produzione Vercel le riscrive verso Railway (`vercel.json`); in locale lo fa `proxy.conf.json`. Non introdurre URL assoluti.
- `middleware.ts` (Vercel Routing Middleware, fuori da `src/`) aggiunge `X-Proxy-Secret` alle chiamate `/api` con una rewrite verso Railway. Se `BACKEND_PROXY_SECRET` non è impostata su Vercel non fa nulla e vale la rewrite di `vercel.json`.
- `BACKEND_PROXY_SECRET` (Vercel) deve essere uguale a `APP_PROXY_SECRET` (Railway). Ordine di deploy: prima env + deploy su Railway, poi env + deploy su Vercel.
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
