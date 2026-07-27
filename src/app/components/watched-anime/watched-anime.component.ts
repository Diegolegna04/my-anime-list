import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { UserAnimeService } from '../../services/userAnimeService.service';
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-watched-anime',
  templateUrl: './watched-anime.component.html',
  standalone: true,
  imports: [RouterLink, CommonModule],
  styleUrls: ['./watched-anime.component.css'],
})
export class WatchedAnimeComponent implements OnInit {
  watchedAnime: any[] = [];
  filteredAnime: any[] = [];
  isLoading: boolean = true;
  filter: string = 'all';

  titleLanguage: 'english' | 'original' = 'original';

  constructor(
    private animeService: AnimeService,
    private userAnimeService: UserAnimeService,
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

    this.loadWatchedAnime();
    window.scroll(0, 0);
  }

  loadWatchedAnime(): void {
    this.isLoading = true;

    forkJoin({
      completed: this.userAnimeService.getAnimeByStatus('completed').pipe(
        catchError(error => {
          console.error('Errore nel caricamento anime completati:', error);
          return of([]);
        })
      ),
      watching: this.userAnimeService.getAnimeByStatus('watching').pipe(
        catchError(error => {
          console.error('Errore nel caricamento anime in visione:', error);
          return of([]);
        })
      ),
      planToWatch: this.userAnimeService.getAnimeByStatus('plan_to_watch').pipe(
        catchError(error => {
          console.error('Errore nel caricamento anime da vedere:', error);
          return of([]);
        })
      ),
      onHold: this.userAnimeService.getAnimeByStatus('on_hold').pipe(
        catchError(error => {
          console.error('Errore nel caricamento anime in pausa:', error);
          return of([]);
        })
      ),
      dropped: this.userAnimeService.getAnimeByStatus('dropped').pipe(
        catchError(error => {
          console.error('Errore nel caricamento anime droppati:', error);
          return of([]);
        })
      )
    }).subscribe({
      next: (result) => {
        this.watchedAnime = [
          ...result.completed.map((anime: any) => ({
            id: anime.animeId.toString(),
            state: 'completato',
            episodiVisti: anime.episodesWatched || 0,
            details: null,
            userAnimeData: anime
          })),
          ...result.watching.map((anime: any) => ({
            id: anime.animeId.toString(),
            state: 'in visione',
            episodiVisti: anime.episodesWatched || 0,
            details: null,
            userAnimeData: anime
          })),
          ...result.planToWatch.map((anime: any) => ({
            id: anime.animeId.toString(),
            state: 'da vedere',
            episodiVisti: anime.episodesWatched || 0,
            details: null,
            userAnimeData: anime
          })),
          ...result.onHold.map((anime: any) => ({
            id: anime.animeId.toString(),
            state: 'in pausa',
            episodiVisti: anime.episodesWatched || 0,
            details: null,
            userAnimeData: anime
          })),
          ...result.dropped.map((anime: any) => ({
            id: anime.animeId.toString(),
            state: 'droppato',
            episodiVisti: anime.episodesWatched || 0,
            details: null,
            userAnimeData: anime
          }))
        ];

        if (this.watchedAnime.length === 0) {
          this.isLoading = false;
          this.filteredAnime = [];
          return;
        }

        this.processAnimeDetailsRequests().then(() => {
          this.isLoading = false;
          this.applyFilter();
          this.cdr.detectChanges();
        }).catch(error => {
          console.error("Errore durante il caricamento dei dettagli degli anime:", error);
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Errore nel caricamento degli anime:', error);
        this.isLoading = false;
        this.filteredAnime = [];
      }
    });
  }

  async getAnimeDetailsById(id: string): Promise<any> {
    try {
      return await this.animeService.getAnimeById(id).toPromise();
    } catch (error) {
      console.error(`Errore nel recupero dettagli per ID ${id}:`, error);
      return null;
    }
  }

  private async processAnimeDetailsRequests(): Promise<void> {
    await Promise.all(
      this.watchedAnime.map(async (anime) => {
        anime.details = await this.getAnimeDetailsById(anime.id);
        this.applyFilter();
        this.cdr.detectChanges();
      })
    );
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let loadedAnime = this.watchedAnime.filter((anime) => anime.details);

    if (this.filter === 'all') {
      this.filteredAnime = loadedAnime;
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