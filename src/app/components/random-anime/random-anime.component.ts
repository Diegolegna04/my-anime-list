import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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
  private animeRandom = 'https://api.jikan.moe/v4/random/anime';
  
  anime: AnimeData | null = null;
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  getRandomAnime(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get<AnimeResponse>(this.animeRandom).subscribe({
      next: (response) => {
        this.anime = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Errore nel caricamento dell\'anime';
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
