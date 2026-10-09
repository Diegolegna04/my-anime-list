# MyAnimeList Clone (Angular + Quarkus)

![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=flat-square&logo=angular)
![Quarkus](https://img.shields.io/badge/Quarkus-3.x-4695EB?style=flat-square&logo=quarkus)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat-square&logo=vercel)
![Status](https://img.shields.io/badge/Status-WIP-orange?style=flat-square)

A personal anime tracking web app inspired by MyAnimeList, built with Angular 20 and a Java/Quarkus backend.

---

## Why I built this

MyAnimeList is great for data, but the UI feels dated and the experience is clunky. I wanted to build my own version with a cleaner interface, a more personalised profile and an excuse to go deep on Angular Signals and full-stack architecture with a real backend — not just a frontend calling a public API.

---

## Highlights

- **Angular Signals** for reactive, fine-grained UI state management
- **MAL-inspired tracking system** — status, episodes, rating, all in sync with a real database
- **Dynamic user profile** with pinned anime, stats and favourites
- **Session-based auth** with secure cookies and configurable expiry (remember me)
- **Anime search** powered by the Jikan API, proxied by the backend

---

## Features

- 🔍 Search anime via [Jikan API](https://jikan.moe/) (unofficial MyAnimeList API)
- 📋 Track anime: Watching · Completed · Plan to Watch · Dropped · On Hold
- ⭐ Rate anime (unlocked only after marking as completed)
- ❤️ Favourites and pinned anime on profile
- 👤 Profile stats: watched, watching, favourites, pinned
- 🤝 Friends: send/accept requests and browse a friend's list (read-only)
- 🌙 Dark / Light theme
- 🌐 Title language toggle (Japanese / English)
- 🔐 Register (with email verification), login, logout, remember me, password reset

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20 — standalone components, signals, RxJS |
| Backend | Java 21 · Quarkus 3 · Maven · Panache |
| Database | MongoDB 8 |
| Hosting | Vercel (frontend) · Railway (backend + MongoDB) |
| Anime data | Jikan API v4, with AniList as fallback (handled by the backend) |

---

## Project Structure

This repository contains only the frontend; the Quarkus backend lives in the sibling repo `my-anime-list-backend`.

```
my-anime-list/
├── src/app/
│   ├── components/          # Anime pages and widgets (details, search, watched list, favourites, toast…)
│   ├── home/                # Hero, top anime, seasonal anime, genres
│   ├── profile/             # Dashboard, settings, friends panel
│   ├── login-register/      # Combined login / registration form
│   ├── services/            # Auth, anime (proxy + request queue), user-anime, friends, genres, theme, toast
│   └── header/, footer/, genres/, forgot-password/, reset-password/, verify-email/, not-found/
├── public/                  # Static assets (images, favicon)
├── middleware.ts            # Vercel Routing Middleware (adds X-Proxy-Secret to /api calls)
├── vercel.json              # Build output + rewrites (/api → Railway backend)
├── proxy.conf.json          # Dev-server proxy for /api
├── Dockerfile, nginx.conf   # Optional image: build + nginx serving the SPA
└── PROJECT.md, DESIGN.md, CLAUDE.md
```

---

## Backend API

The backend exposes a REST API under `/api`. A few key endpoints:

```
POST   /api/auth/register
POST   /api/auth/login
DELETE /api/auth/logout
GET    /api/auth/profile

GET    /api/anime-proxy/...            # Jikan proxy (with AniList fallback)

PUT    /api/user-anime/:id/status
PUT    /api/user-anime/:id/rating
PUT    /api/user-anime/:id/favorite
GET    /api/user-anime/stats
GET    /api/user-anime/library

GET    /api/friends
GET    /api/friends/:username/library
```

See the backend repo (`README.md`, `PROJECT.md`) for the full picture.

---

## Authentication

Auth is handled via **session cookies** — no tokens in `localStorage`, no JWT to steal via XSS.

- On login, the server creates a session and sets a cookie
- Cookie expiry: 6 hours by default, 72 hours with *remember me*
- Expired sessions are automatically purged server-side on a scheduled job
- Logout deletes the session from the database and clears the cookie

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- No local backend needed: the dev server proxies `/api` to the production backend on Railway

### Development

```bash
npm install
npm start
```

Open `http://localhost:4200`. The app hot-reloads on file changes.  
`/api` requests are proxied by `proxy.conf.json` to the **production Railway backend**, so you work on real data. To use a local backend, change the `target` in `proxy.conf.json` locally (the backend listens on port 8080).

### Tests and production build

```bash
npx ng test --watch=false --browsers=ChromeHeadless
npm run build
```

The build output goes to `dist/my-anime-list/browser`.

---

## Docker (optional)

The `Dockerfile` builds the app and serves it with nginx (`nginx.conf`, SPA fallback to `index.html`):

```bash
docker build -t my-anime-list .
docker run -p 8080:80 my-anime-list
```

The image contains only the frontend and does not proxy `/api`. The `docker-compose.yml` for backend + MongoDB lives in the backend repo.

---

## Deployment

The app is live.

| Service | Platform |
|---|---|
| Frontend | Vercel, deployed from the CLI with `vercel --prod` (no Git integration) |
| Backend + MongoDB | Railway, deployed from the CLI (see the backend repo) |

- `vercel.json` rewrites `/api/*` to the Railway backend and everything else to `index.html`.
- `middleware.ts` (optional): when `BACKEND_PROXY_SECRET` is set on Vercel, it forwards `/api` calls to Railway with an `X-Proxy-Secret` header, so the backend trusts the client IP only for requests coming through Vercel. The value must match `APP_PROXY_SECRET` on the backend.

---

## Roadmap

- [ ] Backend repository made public
- [ ] Multi-language UI support
- [ ] Anime recommendations based on watch history

---

## Notes

- Anime metadata comes from [Jikan API](https://docs.api.jikan.moe/) through the backend proxy, with a fallback on AniList when Jikan is down. The frontend keeps a 24h `localStorage` cache for the anime shown in the user lists.
- UI is in Italian — multi-language support is planned

---

## License

Personal portfolio project.  
Feel free to explore the code, but please don't redistribute or reuse it without permission.
