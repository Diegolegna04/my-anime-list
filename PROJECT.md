# my-anime-list — Frontend

Client Angular del clone di MyAnimeList. Consuma il backend Quarkus (repo sorella `my-anime-list-backend`) tramite `/api/*`, proxato in dev/prod verso il backend reale.

## Stack

- Angular 21 (standalone components, signals, RxJS) — vedi `package.json`, dipendenze `@angular/*` `^20.0.0`
- `crypto-js` per l'hashing SHA-256 lato client della password (solo in un punto, vedi sotto)
- `sweetalert2`, `@angular/cdk` (drag & drop nella pagina profilo)
- Test: Karma + Jasmine, con `.spec.ts` per una parte dei componenti (non tutti)

## Struttura

```
src/app/
├── app.routes.ts            # routing, unica route protetta: /profile (authGuard)
├── auth.guard.ts             # canActivate basato su AuthService.accessoEffettuato$
├── services/
│   ├── auth.service.ts       # stato di login, profilo utente, localStorage
│   ├── anime.service.ts      # proxy verso /api/anime-proxy, cache locale + coda/rate-limit lato client
│   ├── userAnimeService.service.ts  # CRUD stato utente-anime (/api/user-anime)
│   ├── genre.service.ts      # generi/temi/demografiche da Jikan, cache in memoria (shareReplay)
│   ├── theme.service.ts, toast.service.ts
│   └── constants/anime-genre-descriptions.ts
├── login-register/           # form combinato login+registrazione (NON passa da AuthService.login())
├── profile/                  # dashboard utente: stats, anime in evidenza (drag&drop), impostazioni
├── components/
│   ├── anime-details/        # dettaglio anime + sotto-componenti (rating, episodi, preferiti, news, sidebar)
│   ├── anime-search/, anime-by-genre/, seasonal-anime-page/, random-anime/, favorite-anime/, watched-anime/
│   └── shared/ (anime-card), toast/
└── home/                     # hero, top-anime, seasonal-anime, genres-home, newsletter
```

## Autenticazione (lato client)

- Sessione basata su cookie httpOnly (`SESSION_COOKIE`) impostato dal backend: tutte le chiamate autenticate usano `withCredentials: true`, nessun token in `localStorage`.
- `AuthService` mantiene solo stato "specchio" in `localStorage` (`accessoEffettuato`, `userData`, `username`, `profileImage`) per idratare la UI senza round-trip; la fonte di verità resta il cookie + `/api/auth/profile`.
- Il form reale di login/registrazione (`login-register.component.ts`) chiama `HttpClient` direttamente con i campi corretti (`email`, `password`, `rememberMe`); il metodo `AuthService.login()` esiste ma non è quello usato dal form (vedi TODO.md, è disallineato con l'interfaccia `LoginRequest`).
- Cambio password dalle impostazioni profilo: il client calcola `CryptoJS.SHA256(newPassword)` e manda l'hash esadecimale come `password` a `/api/user/update`. Il backend lo accetta e lo rimette in chiaro nel campo password (vedi PROJECT.md backend per come viene "sanato" al login successivo).

## Integrazione con il backend

- Tutte le chiamate usano path relativi (`/api/...`); il dev server/reverse proxy deve instradarle verso Quarkus sulla porta 8080.
- `environment.ts` / `environment.prod.ts` espongono `apiUrl`, ma **solo** `anime.service.ts` lo usa, e lo importa direttamente da `environment.prod` invece che da `environment` — il file replacement Angular per dev (`environment.development.ts`) di fatto non ha effetto su questo servizio.
- Entrambi gli `environment.*.ts` puntano a un IP LAN hardcoded (`192.168.178.196:8080`), non a un dominio pubblico.

## Stato dei test

Solo una parte dei componenti/servizi ha uno `.spec.ts` (es. star-rating, episodes-tracker, favorite-toggle, toast, hero-section, seasonal-anime, top-anime, genres-home, newsletter, random-anime, auth.guard). Mancano test per i servizi core (`auth.service.ts`, `anime.service.ts`, `userAnimeService.service.ts`) e per `login-register`, `profile`, `header`.

## Comandi

```bash
npm install
ng serve            # http://localhost:4200, proxy /api verso backend:8080
ng build             # output in dist/, servito da nginx (vedi nginx.conf)
ng test
```

## Non coperto da questo documento

Non è stato modificato codice per produrre questo file: è una fotografia dello stato attuale del repo. Le criticità individuate (bug, TODO tecnici) sono elencate in `../TODO.md`.
