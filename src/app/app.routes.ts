import {
  PreloadAllModules,
  provideRouter,
  Routes,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';

// Solo la home è nel bundle iniziale: le altre pagine sono chunk separati,
// scaricati in background subito dopo l'avvio (PreloadAllModules).
export const routes: Routes = [
  { path: '', component: HomeComponent }, // Home
  {
    path: 'anime/:id', // Dettagli Anime
    loadComponent: () =>
      import('./components/anime-details/anime-details.component').then(
        (m) => m.AnimeDetailsComponent,
      ),
  },
  {
    path: 'search', // Ricerca Anime
    loadComponent: () =>
      import('./components/anime-search/anime-search.component').then(
        (m) => m.AnimeSearchComponent,
      ),
  },
  {
    path: 'genres', // Lista Generi
    loadComponent: () => import('./genres/genres.component').then((m) => m.GenresComponent),
  },
  {
    path: 'genres/anime-by-genre/:id',
    loadComponent: () =>
      import('./components/anime-by-genre/anime-by-genre.component').then(
        (m) => m.AnimeByGenreComponent,
      ),
  },
  {
    path: 'register-login',
    loadComponent: () =>
      import('./login-register/login-register.component').then((m) => m.LoginRegisterComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile/watched-anime',
    loadComponent: () =>
      import('./components/watched-anime/watched-anime.component').then(
        (m) => m.WatchedAnimeComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile/watched-anime/favourites',
    loadComponent: () =>
      import('./components/favorite-anime/favorite-anime.component').then(
        (m) => m.FavoriteAnimeComponent,
      ),
    canActivate: [authGuard],
  },
  // Lista di un amico in sola lettura: stessa pagina della libreria, dati dell'amico
  {
    path: 'profile/friends/:username',
    loadComponent: () =>
      import('./components/watched-anime/watched-anime.component').then(
        (m) => m.WatchedAnimeComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'seasonal/:season',
    loadComponent: () =>
      import('./components/seasonal-anime-page/seasonal-anime-page.component').then(
        (m) => m.SeasonalAnimePageComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];

export const appRouterProviders = [
  provideRouter(
    routes,
    // Ogni nuova pagina parte dall'alto; con "indietro" si ritrova il punto in cui si era
    withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    withPreloading(PreloadAllModules),
  ),
];
