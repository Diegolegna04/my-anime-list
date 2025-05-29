import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../services/anime.service';
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-watched-anime',
  templateUrl: './watched-anime.component.html',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule],
  styleUrls: ['./watched-anime.component.css'],
})
export class WatchedAnimeComponent implements OnInit {
  watchedAnime: any[] = [];
  filteredAnime: any[] = [];
  isLoading: boolean = true;
  filter: string = 'all';

  titleLanguage: 'english' | 'original' = 'original';

  private readonly REQUEST_CONCURRENCY_LIMIT = 3;
  private readonly REQUEST_DELAY_MS = 500;

  constructor(private animeService: AnimeService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    this.loadWatchedAnime();
  }

  loadWatchedAnime(): void {
    const animeStates = JSON.parse(localStorage.getItem('animeStates') || '{}');

    const validAnimeEntries = Object.keys(animeStates).filter(id => {
      const state = animeStates[id].state;
      return state === 'completato' || state === 'in visione';
    });

    this.watchedAnime = validAnimeEntries.map((id) => ({
      id,
      state: animeStates[id].state,
      episodiVisti: animeStates[id].episodiVisti,
      details: null,
    }));

    if (this.watchedAnime.length === 0) {
      this.isLoading = false;
      this.filteredAnime = [];
      return;
    }

    this.isLoading = true;

    this.processAnimeDetailsRequests().then(() => {
      this.isLoading = false;
      this.applyFilter();
      this.cdr.detectChanges();
    }).catch(error => {
      console.error("Errore durante il caricamento dei dettagli degli anime:", error);
      this.isLoading = false;
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
    const totalRequests = this.watchedAnime.length;
    let completedRequests = 0;

    const requestQueue: (() => Promise<void>)[] = this.watchedAnime.map(anime => async () => {
      anime.details = await this.getAnimeDetailsById(anime.id);
      completedRequests++;

      this.applyFilter();
      this.cdr.detectChanges();
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

      if (titleA < titleB) {
        return -1;
      }
      if (titleA > titleB) {
        return 1;
      }
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
}
