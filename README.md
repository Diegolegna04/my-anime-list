# MyAnimeList Clone (Angular + Quarkus)

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)
![Quarkus](https://img.shields.io/badge/Quarkus-3.x-4695EB?style=flat-square&logo=quarkus)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![Status](https://img.shields.io/badge/Status-WIP-orange?style=flat-square)

A personal anime tracking web app inspired by MyAnimeList, built with Angular 21 and a Java/Quarkus backend.

---

## Why I built this

MyAnimeList is great for data, but the UI feels dated and the experience is clunky. I wanted to build my own version with a cleaner interface, a more personalised profile and an excuse to go deep on Angular Signals and full-stack architecture with a real backend — not just a frontend calling a public API.

---

## Highlights

- **Angular Signals** for reactive, fine-grained UI state management
- **MAL-inspired tracking system** — status, episodes, rating, all in sync with a real database
- **Dynamic user profile** with pinned anime, stats and favourites
- **Session-based auth** with secure cookies and configurable expiry (remember me)
- **Real-time anime search** powered by the Jikan API

---

## Features

- 🔍 Search anime via [Jikan API](https://jikan.moe/) (unofficial MyAnimeList API)
- 📋 Track anime: Watching · Completed · Plan to Watch · Dropped · On Hold
- ⭐ Rate anime (unlocked only after marking as completed)
- ❤️ Favourites and pinned anime on profile
- 👤 Profile stats: watched, watching, favourites, pinned
- 🌙 Dark / Light theme
- 🌐 Title language toggle (Japanese / English)
- 🔐 Register, login, logout, remember me

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 — standalone components, signals, RxJS |
| Backend | Java 21 · Quarkus 3 · Maven · Panache |
| Database | MongoDB Atlas |
| Reverse proxy | nginx |
| Containers | Docker · Docker Compose |
| Anime data | Jikan API v4 |

---

## Project Structure

```
myanimelist/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      # Shared UI (toast, anime cards, trackers, state manager)
│   │   │   ├── services/        # Auth, anime, user-anime, toast
│   │   │   ├── pages/           # Page-level components (home, profile, details, list)
│   │   │   └── environments/    # Dev / prod environment configs
│   │   └── assets/
│   ├── nginx.conf               # SPA routing (try_files → index.html)
│   └── Dockerfile
│
├── backend/                     # Private repo — public soon
│   ├── src/main/java/com/mal/
│   │   ├── rest/                # JAX-RS resources (endpoints)
│   │   ├── services/            # Business logic
│   │   ├── persistence/
│   │   │   ├── model/           # MongoDB entities
│   │   │   └── repository/      # Panache repositories
│   │   └── rest/model/          # Request / response DTOs
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf               # Reverse proxy config (routes /api → backend)
│
└── docker-compose.yml           # Full stack orchestration
```

---

## Backend API

The backend exposes a REST API under `/api`. A few key endpoints:

```
POST   /api/auth/register
POST   /api/auth/login
DELETE /api/auth/logout
GET    /api/auth/profile

GET    /api/anime/search?q=...
GET    /api/anime/:id

PUT    /api/user-anime/:id/status
PUT    /api/user-anime/:id/rating
PUT    /api/user-anime/:id/favorite
GET    /api/user-anime/stats
```

Full API documentation coming alongside the backend repo.

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
- [Angular CLI](https://angular.dev/tools/cli) v21+
- Backend running locally (repo coming soon)

### Development

```bash
npm install
ng serve
```

Open `http://localhost:4200`. The app hot-reloads on file changes.  
`/api` requests are proxied to the backend on port 8080.

### Production build

```bash
ng build
```

Output goes to `dist/`, ready to be served by nginx.

---

## Running with Docker

```bash
docker compose up --build
```

Starts the full stack — frontend, backend, MongoDB and nginx — as a single composed environment.  
Available at `http://localhost` (port 80).

---

## Deployment (planned)

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway or VPS |
| Database | MongoDB Atlas (already in use) |
| Reverse proxy | nginx (same config, different host) |

Public deployment is the next milestone after the codebase stabilises.

---

## Roadmap

- [ ] Public deployment
- [ ] Backend repository made public
- [ ] Multi-language UI support
- [ ] Email confirmation on registration
- [ ] Mobile responsive improvements
- [ ] Anime recommendations based on watch history

---

## Notes

- Anime metadata is fetched live from [Jikan API](https://docs.api.jikan.moe/) and not persisted locally.
- UI is currently in Italian — multi-language support is planned

---

## License

Personal portfolio project.  
Feel free to explore the code, but please don't redistribute or reuse it without permission.