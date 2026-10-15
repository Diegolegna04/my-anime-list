# my-anime-list — Frontend

Client Angular del clone di MyAnimeList. Consuma il backend Quarkus (repo sorella `my-anime-list-backend`) tramite `/api/*`: in produzione Vercel riscrive `/api` verso Railway, in sviluppo lo fa `proxy.conf.json` (verso il backend di produzione su Railway).

## Stack

- Angular 20 (standalone components, signals, RxJS) — vedi `package.json`, dipendenze `@angular/*` `^20.0.0`
- `@angular/cdk` (drag & drop nella pagina profilo)
- Test: Karma + Jasmine

## Struttura

```
src/app/
├── app.routes.ts            # routing; protette da authGuard: /profile, /profile/watched-anime (+ /favourites), /profile/friends/:username
├── auth.guard.ts             # canActivate basato su AuthService.accessoEffettuato$
├── services/
│   ├── auth.service.ts       # login/registrazione/profilo/reset password, stato di login, localStorage
│   ├── anime.service.ts      # proxy verso /api/anime-proxy, coda con rate limit + cache locale
│   ├── userAnimeService.service.ts  # stato utente-anime e libreria (/api/user-anime)
│   ├── friend.service.ts     # amici, richieste, statistiche e libreria di un amico (/api/friends)
│   ├── genre.service.ts      # generi/temi/demografiche da Jikan, cache in memoria (shareReplay)
│   ├── season.service.ts, user-list.service.ts, theme.service.ts, toast.service.ts
│   ├── anime.models.ts, anime-utils.ts
│   ├── shared/               # anime-card, title-language-toggle
│   └── constants/anime-genre-descriptions.ts
├── login-register/           # form combinato login+registrazione
├── forgot-password/, reset-password/, verify-email/
├── profile/                  # dashboard utente: stats, anime in evidenza (drag&drop), impostazioni; friends-panel/
├── components/
│   ├── anime-details/        # dettaglio anime + sotto-componenti (rating, episodi, preferiti, news, sidebar)
│   ├── anime-search/, anime-by-genre/, seasonal-anime-page/, random-anime/, favorite-anime/, watched-anime/, toast/
├── header/ (con search-suggest/), footer/, genres/, not-found/
└── home/                     # hero, top-anime, seasonal-anime, genres-home, newsletter
```

## Autenticazione (lato client)

- Sessione basata su cookie httpOnly (`SESSION_COOKIE`) impostato dal backend: tutte le chiamate autenticate usano `withCredentials: true`, nessun token in `localStorage`.
- `AuthService` mantiene solo stato "specchio" in `localStorage` (`accessoEffettuato`, `userData`, `username`, `profileImage`) per idratare la UI senza round-trip; la fonte di verità resta il cookie + `/api/auth/profile`.
- Login e registrazione (`login-register.component.ts`) passano da `AuthService.login()` / `register()`; lo stesso servizio gestisce verifica email, reset password e `updateProfile()`.
- La password viaggia in chiaro nel body delle richieste (solo su HTTPS): nessun hashing lato client, l'hash è responsabilità del backend. La minima lunghezza è 6 caratteri.

## Integrazione con il backend

- Tutte le chiamate usano path relativi (`/api/...`). Non ci sono più file `environment.*`.
- Produzione: `vercel.json` riscrive `/api/*` verso Railway; il middleware `middleware.ts` (se `BACKEND_PROXY_SECRET` è impostata) lo fa aggiungendo `X-Proxy-Secret`. Sviluppo: `proxy.conf.json` punta al backend di produzione su Railway.
- `AnimeService` (`/api/anime-proxy`, che a sua volta usa Jikan con ripiego su AniList):
  - le chiamate "pesanti" (top, generi, dettaglio, raccomandazioni, streaming, news) passano da una coda con al massimo 2 richieste in volo e intervallo base di 700 ms; su 429 ritentano (fino a 4 volte) e la coda rallenta, poi torna alla velocità normale dopo una serie di successi;
  - `getAnimeById` (usato dalle liste: profilo, anime visti, preferiti) ritenta anche su 502/503/504 e salva la risposta in `localStorage` per 24 ore (`animeCache:<id>`), più una cache in memoria;
  - la pagina di dettaglio usa `getAnimeDetails`: sempre fresca, mai cache, ritenta solo su 429 (con Jikan giù fallisce subito senza intasare la coda).
- Liste utente: `getLibrary()` restituisce la libreria in una sola richiesta con titoli e copertine; per le voci rimaste senza dati (`anime: null`) il componente recupera i dettagli con `getAnimeById`.
- Vista amico (`/profile/friends/:username`, stesso `WatchedAnimeComponent`): statistiche e libreria in sola lettura da `/api/friends/{username}/library`.

## Stato dei test

~95 specs Jasmine (Karma): servizi `AnimeService`, `AuthService`, `GenreService`, `SeasonService`, utilità anime, `auth.guard`, e componenti tra cui `login-register`, `profile`, `watched-anime`, `forgot-password`, home (hero, top, seasonal, generi), `genres`, random/seasonal page, dettagli anime (rating, episodi, preferiti, news, sidebar, info card, state manager), toast. Senza spec: `userAnimeService`, `friend.service`, `header`, `search-suggest`, `friends-panel`.

## Comandi

```bash
npm install
npm start                                    # http://localhost:4200, /api proxato su Railway (proxy.conf.json)
npm run build                                # output in dist/my-anime-list/browser
npx ng test --watch=false --browsers=ChromeHeadless
npm run lint                                 # ESLint; npm run format / format:check per Prettier
vercel --prod                                # deploy (da CLI, niente integrazione Git)
```

`Dockerfile` + `nginx.conf` costruiscono un'immagine opzionale con il solo frontend (SPA servita da nginx, nessun proxy `/api`); il `docker-compose.yml` è nel repo del backend.

Le criticità note sono elencate in `../TODO.md`.
