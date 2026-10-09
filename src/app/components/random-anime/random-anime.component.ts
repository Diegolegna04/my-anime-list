import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { AnimeData } from '../../services/anime.models';
import { withCleanSynopsis } from '../../services/anime-utils';

@Component({
  selector: 'app-random-anime',
  imports: [CommonModule, RouterLink],
  templateUrl: './random-anime.component.html',
  styleUrl: './random-anime.component.css'
})
export class RandomAnimeComponent {
  anime: AnimeData | null = null;
  loading = false;
  error: string | null = null;

  constructor(private animeService: AnimeService) {}

  getRandomAnime(): void {
    this.loading = true;
    this.error = null;
    
    this.animeService.getRandomAnime().subscribe({
      next: (response) => {
        this.anime = withCleanSynopsis(response.data);
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
