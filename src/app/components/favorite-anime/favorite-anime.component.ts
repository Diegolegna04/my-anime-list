import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AnimeService } from '../../services/anime.service';
import { UserAnimeService } from '../../services/userAnimeService.service';
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-favorite-anime',
  templateUrl: './favorite-anime.component.html',
  standalone: true,
  imports: [RouterLink, CommonModule],
  styleUrls: ['./favorite-anime.component.css']
})
export class FavoriteAnimeComponent implements OnInit {
  favoriteAnime: any[] = [];
  isLoading: boolean = true;
  titleLanguage: 'english' | 'original' = 'original';
  isGridView: boolean = true;

  private readonly REQUEST_CONCURRENCY_LIMIT = 3;
  private readonly REQUEST_DELAY_MS = 500;

  constructor(
    private http: HttpClient, 
    private animeService: AnimeService,
    private userAnimeService: UserAnimeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    this.loadFavoriteAnime();
    window.scroll(0, 0);
  }

  loadFavoriteAnime(): void {
    this.isLoading = true;
    this.favoriteAnime = [];

    // Carica i preferiti dal backend
    this.userAnimeService.getFavorites().subscribe({
      next: (favorites) => {
        if (!favorites || favorites.length === 0) {
          this.isLoading = false;
          this.favoriteAnime = [];
          return;
        }

        // Mappa i dati al formato esistente
        const favoriteEntries = favorites.map((favorite: any) => ({
          id: favorite.animeId.toString(),
          userAnimeData: favorite,
          details: null
        }));

        this.favoriteAnime = favoriteEntries;

        // Carica i dettagli degli anime
        this.processAnimeDetailsRequests().then(() => {
          this.isLoading = false;
          this.sortFavorites();
          this.cdr.detectChanges();
        }).catch(error => {
          console.error("Errore durante il caricamento dei dettagli degli anime:", error);
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Errore nel caricamento dei preferiti:', error);
        this.isLoading = false;
        this.favoriteAnime = [];
      }
    });
  }

  private async processAnimeDetailsRequests(): Promise<void> {
    const totalRequests = this.favoriteAnime.length;

    const requestQueue: (() => Promise<void>)[] = this.favoriteAnime.map(anime => async () => {
      anime.details = await this.getAnimeDetailsById(anime.id);
    });

    const concurrency = this.REQUEST_CONCURRENCY_LIMIT;
    const delay = this.REQUEST_DELAY_MS;

    for (let i = 0; i < totalRequests; i += concurrency) {
      const batch = requestQueue.slice(i, i + concurrency);
      await Promise.all(batch.map(request => request()));

      if (i + concurrency < totalRequests) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async getAnimeDetailsById(id: string): Promise<any> {
    try {
      return await this.animeService.getAnimeById(id).toPromise();
    } catch (error) {
      console.error(`Errore nel recupero dettagli per ID ${id}:`, error);
      return null;
    }
  }

  private sortFavorites(): void {
    this.favoriteAnime = this.favoriteAnime
      .filter(anime => anime.details) // Solo anime con dettagli caricati
      .sort((a, b) => {
        const titleA = this.getTitle(a.details?.data).toLowerCase();
        const titleB = this.getTitle(b.details?.data).toLowerCase();
        return titleA.localeCompare(titleB);
      });
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  toggleTitleLanguage(): void {
    this.titleLanguage = this.titleLanguage === 'english' ? 'original' : 'english';
    localStorage.setItem('titleLanguage', this.titleLanguage);
    this.cdr.detectChanges();
  }

  getTitle(anime: any): string {
    if (!anime) return '';
    const englishTitle = anime.title_english || '';
    const originalTitle = anime.title || '';

    if (this.titleLanguage === 'english') {
      return englishTitle || originalTitle;
    } else {
      return originalTitle || englishTitle;
    }
  }

  refreshData(): void {
    this.loadFavoriteAnime();
  }

  removeFromFavorites(animeId: number): void {
    this.userAnimeService.toggleFavorite(animeId).subscribe({
      next: () => {
        this.loadFavoriteAnime(); // Ricarica la lista
      },
      error: (error) => {
        console.error('Errore nella rimozione dai preferiti:', error);
      }
    });
  }
}
