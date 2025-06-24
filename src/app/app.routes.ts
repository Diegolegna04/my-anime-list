import { provideRouter, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AnimeDetailsComponent } from './anime-details/anime-details.component';
import { AnimeSearchComponent } from './components/anime-search/anime-search.component';
import { GenresComponent } from './genres/genres.component';
import { AnimeByGenreComponent } from './components/anime-by-genre/anime-by-genre.component';
import { LoginRegisterComponent } from './login-register/login-register.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { FavoriteAnimeComponent } from './favorite-anime/favorite-anime.component';
import { WatchedAnimeComponent } from './watched-anime/watched-anime.component';
import { ProfileComponent } from './profile/profile.component';
import { SeasonalAnimeComponent } from './components/seasonal-anime/seasonal-anime.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Home
  { path: 'anime/:id', component: AnimeDetailsComponent }, // Dettagli Anime
  { path: 'search', component: AnimeSearchComponent }, // Ricerca Anime
  { path: 'genres', component: GenresComponent }, // Lista Generi
  { path: 'genres/anime-by-genre/:id', component: AnimeByGenreComponent },
  { path: 'register-login', component: LoginRegisterComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'profile/watched-anime', component: WatchedAnimeComponent },
  { path: 'profile/watched-anime/favourites', component: FavoriteAnimeComponent },
  { path: 'seasonal/:season', component: SeasonalAnimeComponent },
  { path: '**', component: NotFoundComponent }
];

export const appRouterProviders = [
  provideRouter(routes),
];
