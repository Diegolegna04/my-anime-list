import { provideRouter, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AnimeDetailsComponent } from './anime-details/anime-details.component';
import { AnimeSearchComponent } from './components/anime-search/anime-search.component';
import { GenresComponent } from './genres/genres.component';
import { AnimeByGenreComponent } from './anime-by-genre/anime-by-genre.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Home
  { path: 'anime/:id', component: AnimeDetailsComponent }, // Dettagli Anime
  { path: 'search', component: AnimeSearchComponent }, // Ricerca Anime
  { path: 'genres', component: GenresComponent }, // Lista Generi
  { path: 'anime-by-genre/:id', component: AnimeByGenreComponent }, // Anime per Genere
];

export const appRouterProviders = [
  provideRouter(routes),
];
