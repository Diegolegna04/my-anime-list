import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { UserAnimeService } from '../../services/userAnimeService.service';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-favorite-anime',
  templateUrl: './favorite-anime.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./favorite-anime.component.css']
})
export class FavoriteAnimeComponent implements OnInit {
  favoriteAnime: any[] = [];
  isLoading: boolean = true;
  titleLanguage: 'english' | 'original' = 'original';
  isGridView: boolean = true;

  /** Anime di cui si stanno ancora caricando i dettagli */
  pendingDetails: number = 0;
  /** Tutti i preferiti, anche quelli ancora senza dettagli */
  private allFavorites: any[] = [];

  constructor(
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

    // Una sola richiesta con titoli e copertine già inclusi
    this.userAnimeService.getLibrary().subscribe({
      next: (library) => {
        this.showLoadedAndFetchMissing(library
          .filter(entry => entry.isFavorite)
          .map(entry => ({
            id: entry.animeId.toString(),
            userAnimeData: entry,
            details: entry.anime ? { data: entry.anime } : null
          })));
      },
      // Backend senza /library (es. deploy non ancora arrivato): solo i preferiti
      error: () => this.loadFromFavorites()
    });
  }

  private loadFromFavorites(): void {
    this.userAnimeService.getFavorites().subscribe({
      next: (favorites) => {
        this.showLoadedAndFetchMissing((favorites || []).map((favorite: any) => ({
          id: favorite.animeId.toString(),
          userAnimeData: favorite,
          details: null
        })));
      },
      error: (error) => {
        console.error('Errore nel caricamento dei preferiti:', error);
        this.isLoading = false;
        this.favoriteAnime = [];
      }
    });
  }

  /** Mostra subito i preferiti con i dettagli e carica gli altri man mano */
  private showLoadedAndFetchMissing(entries: any[]): void {
    this.allFavorites = entries;
    this.isLoading = false;
    this.sortFavorites();

    const missing = entries.filter(anime => !anime.details);
    this.pendingDetails = missing.length;
    missing.forEach(anime => {
      this.animeService.getAnimeById(anime.id).subscribe({
        next: (details) => {
          anime.details = details;
          this.pendingDetails--;
          this.sortFavorites();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`Errore nel recupero dettagli per ID ${anime.id}:`, error);
          this.pendingDetails--;
          this.cdr.detectChanges();
        }
      });
    });
  }

  private sortFavorites(): void {
    this.favoriteAnime = this.allFavorites
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
