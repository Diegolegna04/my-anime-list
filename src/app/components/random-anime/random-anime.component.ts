import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { retry, throwError, timer } from 'rxjs';

interface AnimeData {
  mal_id: number;
  title: string;
  title_english?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis?: string;
  score?: number;
  episodes?: number;
  status: string;
  year?: number;
  genres: Array<{ name: string }>;
}

interface AnimeResponse {
  data: AnimeData;
}

@Component({
  selector: 'app-random-anime',
  imports: [CommonModule],
  templateUrl: './random-anime.component.html',
  styleUrl: './random-anime.component.css'
})
export class RandomAnimeComponent {
  private animeRandom = '/api/anime-proxy/random/anime';
  
  anime: AnimeData | null = null;
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  getRandomAnime(): void {
    this.loading = true;
    this.error = null;
    
    // Un secondo tentativo sugli errori temporanei del proxy/Jikan
    this.http.get<AnimeResponse>(this.animeRandom).pipe(
      retry({
        count: 1,
        delay: (err: HttpErrorResponse, attempt) =>
          [502, 503, 504].includes(err.status) ? timer(600 * attempt) : throwError(() => err)
      })
    ).subscribe({
      next: (response) => {
        this.anime = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Il servizio anime al momento non risponde, riprova tra qualche secondo';
        this.loading = false;
        console.error('Errore API:', err);
      }
    });
  }

  getAnimeTitle(): string {
    if (!this.anime) return '';
    return this.anime.title_english || this.anime.title;
  }

  getGenres(): string {
    if (!this.anime || !this.anime.genres) return '';
    return this.anime.genres.map(genre => genre.name).join(', ');
  }
}
