# CLAUDE.md — my-anime-list (frontend)

Client Angular del clone di MyAnimeList. Backend Quarkus nel repo sorella `../my-anime-list-backend`.
Architettura, autenticazione e integrazione col backend: `PROJECT.md`. Sistema visivo: `DESIGN.md`. Criticità note: `../TODO.md`.

## Stack

- Angular 20 (componenti standalone, signals, RxJS), TypeScript 5.8.
- CSS puro per componente (`*.component.css`); token e classi globali in `src/styles.css`. Niente Tailwind, niente SCSS.
- Icone: Font Awesome 6.0.0-beta3 da CDN (`src/index.html`). Nessun webfont: il testo usa `--font-sans` (oggi solo `sans-serif`).
- `sweetalert2`, `@angular/cdk` (drag & drop nel profilo), `crypto-js`.
- Test: Karma + Jasmine, solo su una parte dei componenti.

## Comandi

```bash
npm start                                   # http://localhost:4200, /api proxato da proxy.conf.json
npm run build                               # build di produzione + typecheck (dist/clone-cruncyroll/browser)
npx ng test --watch=false --browsers=ChromeHeadless
```

Non c'è lint configurato: la verifica minima è `npm run build`.

## Regole

- Tutte le chiamate al backend usano path relativi `/api/...`. In produzione Vercel le riscrive verso Railway (`vercel.json`); in locale lo fa `proxy.conf.json`. Non introdurre URL assoluti.
- Prima di toccare l'interfaccia leggi `DESIGN.md` e rispettalo: solo token `var(--…)`, solo icone Font Awesome, un solo spinner globale, tema scuro tramite token.
- Per lavoro estetico (analisi, restyling, rifinitura, animazioni) usa la skill `/styling`.
- Testi dell'interfaccia solo in italiano, scritti nei template (niente i18n).
- Nuovi componenti: standalone, nella cartella della pagina che li usa; se condivisi in `src/app/services/shared/`.
- Screenshot e file di Playwright vanno in `.playwright-mcp/` (ignorata da git), mai in `src/` o `public/`.

## Git

- Mai lavorare direttamente su `main`/`master`: lavoro estetico su `styling/<target>`, il resto su un branch dedicato.
- Commit e push solo su richiesta esplicita.

## Trappole note

- `AuthService.login()` non è il metodo usato dal form di login: il form in `login-register.component.ts` chiama `HttpClient` direttamente.
- `src/environments/*` contengono `apiUrl` obsoleti (IP LAN, Netlify) che nessun servizio usa più per le chiamate.
- La sessione è un cookie httpOnly del backend (`withCredentials: true`); `localStorage` contiene solo uno stato "specchio" per la UI.
