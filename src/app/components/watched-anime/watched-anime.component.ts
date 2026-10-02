import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { UserAnimeService } from '../../services/userAnimeService.service';
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TitleLanguageToggleComponent } from '../../services/shared/title-language-toggle.component';
import { FriendService, FriendStats } from '../../services/friend.service';
import { LibraryEntry } from '../../services/userAnimeService.service';

/** Stato salvato nel backend -> etichetta usata dai filtri della pagina */
const STATE_LABELS: Record<string, string> = {
  completed: 'completato',
  watching: 'in visione',
  plan_to_watch: 'da vedere',
  on_hold: 'in pausa',
  dropped: 'droppato'
};

@Component({
  selector: 'app-watched-anime',
  templateUrl: './watched-anime.component.html',
  standalone: true,
  imports: [TitleLanguageToggleComponent, RouterLink, CommonModule],
  styleUrls: ['./watched-anime.component.css'],
})
export class WatchedAnimeComponent implements OnInit {
  watchedAnime: any[] = [];
  filteredAnime: any[] = [];
  isLoading: boolean = true;
  filter: string = 'all';
  /** Anime di cui si stanno ancora caricando i dettagli */
  pendingDetails: number = 0;

  titleLanguage: 'english' | 'original' = 'original';

  /** Valorizzato sulla rotta /profile/friends/:username: la pagina mostra la lista dell'amico */
  friendUsername: string | null = null;
  friendStats: FriendStats | null = null;
  /** L'amico non esiste o non è (più) tra gli amici */
  friendNotFound = false;

  constructor(
    private animeService: AnimeService,
    private userAnimeService: UserAnimeService,
    private friendService: FriendService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';

    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.filter = params['filter'];
      }
    });

    // Da un amico all'altro il componente resta lo stesso: si ricarica al cambio di username
    this.route.paramMap.subscribe(params => {
      this.friendUsername = params.get('username');
      this.loadWatchedAnime();
      window.scroll(0, 0);
    });
  }

  get isFriendView(): boolean {
    return this.friendUsername !== null;
  }

  loadWatchedAnime(): void {
    this.isLoading = true;
    this.friendNotFound = false;
    this.watchedAnime = [];
    this.filteredAnime = [];

    if (this.friendUsername !== null) {
      this.loadFriendLibrary(this.friendUsername);
      return;
    }

    // Una sola richiesta con titoli e copertine già inclusi
    this.userAnimeService.getLibrary().subscribe({
      next: (library) => this.showLibrary(library),
      // Backend senza /library (es. deploy non ancora arrivato): si va per stato
      error: () => this.loadByStatus()
    });
  }

  private loadFriendLibrary(username: string): void {
    this.friendStats = null;
    // Se nel frattempo si è passati a un altro amico, la risposta vecchia si scarta
    const stillCurrent = () => this.friendUsername === username;
    this.friendService.getStats(username).subscribe({
      next: (stats) => {
        if (!stillCurrent()) return;
        this.friendStats = stats;
        this.cdr.detectChanges();
      },
      // Le statistiche sono un di più: senza, la lista resta comunque visibile
      error: () => {}
    });
    this.friendService.getLibrary(username).subscribe({
      next: (library) => {
        if (stillCurrent()) this.showLibrary(library);
      },
      error: () => {
        if (!stillCurrent()) return;
        this.isLoading = false;
        this.friendNotFound = true;
        this.cdr.detectChanges();
      }
    });
  }

  private showLibrary(library: LibraryEntry[]): void {
    this.watchedAnime = library
      .filter(entry => STATE_LABELS[entry.status])
      .map(entry => this.toEntry(entry, STATE_LABELS[entry.status], entry.anime ? { data: entry.anime } : null));
    this.showLoadedAndFetchMissing();
  }

  /** Vecchio caricamento: lista per stato e dettagli di ogni anime chiesti uno per uno */
  private loadByStatus(): void {
    const byStatus = (status: string) => this.userAnimeService.getAnimeByStatus(status).pipe(
      catchError(error => {
        console.error(`Errore nel caricamento degli anime "${status}":`, error);
        return of([]);
      })
    );

    forkJoin(Object.keys(STATE_LABELS).map(byStatus)).subscribe({
      next: (lists: any[][]) => {
        const statuses = Object.keys(STATE_LABELS);
        this.watchedAnime = lists.flatMap((list, index) =>
          list.map((anime: any) => this.toEntry(anime, STATE_LABELS[statuses[index]], null))
        );
        this.showLoadedAndFetchMissing();
      },
      error: (error) => {
        console.error('Errore nel caricamento degli anime:', error);
        this.isLoading = false;
        this.filteredAnime = [];
      }
    });
  }

  private toEntry(userAnime: any, state: string, details: any): any {
    return {
      id: userAnime.animeId.toString(),
      state,
      episodiVisti: userAnime.episodesWatched || 0,
      details,
      userAnimeData: userAnime
    };
  }

  /**
   * Mostra subito gli anime che hanno già i dettagli e carica gli altri uno
   * alla volta, partendo da quelli del filtro scelto: la pagina non resta più
   * in caricamento finché non sono arrivati tutti.
   */
  private showLoadedAndFetchMissing(): void {
    this.isLoading = false;
    this.applyFilter();

    const missing = this.watchedAnime
      .filter(anime => !anime.details)
      .sort((a, b) => Number(b.state === this.filter) - Number(a.state === this.filter));
    this.pendingDetails = missing.length;

    missing.forEach(anime => {
      this.animeService.getAnimeById(anime.id).subscribe({
        next: (details) => {
          anime.details = details;
          this.pendingDetails--;
          this.applyFilter();
        },
        error: (error) => {
          console.error(`Errore nel recupero dettagli per ID ${anime.id}:`, error);
          this.pendingDetails--;
          this.cdr.detectChanges();
        }
      });
    });
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let loadedAnime = this.watchedAnime.filter((anime) => anime.details);

    if (this.filter === 'all') {
      // "Tutti" sono gli anime iniziati: i "Da vedere" hanno il loro filtro
      // (stesso conteggio del riquadro "Tutti gli anime" del profilo)
      this.filteredAnime = loadedAnime.filter((anime) => anime.state !== 'da vedere');
    } else {
      this.filteredAnime = loadedAnime.filter(
        (anime) => anime.state === this.filter
      );
    }

    this.filteredAnime.sort((a, b) => {
      const titleA = this.getTitle(a.details?.data).toLowerCase();
      const titleB = this.getTitle(b.details?.data).toLowerCase();

      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });

    this.cdr.detectChanges();
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

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  refreshData(): void {
    this.loadWatchedAnime();
  }
}