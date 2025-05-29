import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../services/anime.service';
import { ChangeDetectorRef } from '@angular/core';

import {RouterLink, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-watched-anime',
  templateUrl: './watched-anime.component.html',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  styleUrls: ['./watched-anime.component.css'],
})
export class WatchedAnimeComponent implements OnInit {
  watchedAnime: any[] = [];
  filteredAnime: any[] = [];
  isLoading: boolean = true;
  filter: string = 'all'; // Può essere 'all', 'completato', o 'in visione'

  titleLanguage: 'english' | 'original' = 'original'; // Aggiunto per la lingua del titolo

  constructor(private animeService: AnimeService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    this.loadWatchedAnime();
  }

  loadWatchedAnime(): void {
    const elencoVisti = JSON.parse(localStorage.getItem('animeStates') || '{}');

    // Convertiamo l'elenco salvato in un array di anime con i dettagli
    this.watchedAnime = Object.keys(elencoVisti).map((id) => ({
      id,
      state: elencoVisti[id].state,
      details: null,
    }));

    if (this.watchedAnime.length === 0) {
      this.isLoading = false; // Nessun anime salvato
      return;
    }

    const requests = this.watchedAnime.map((anime) =>
      this.getAnimeDetailsById(anime.id).then((details) => {
        anime.details = details;
      })
    );

    Promise.all(requests).then(() => {
      this.isLoading = false;
      this.applyFilter();
      this.cdr.detectChanges(); // Assicura che l'interfaccia si aggiorni correttamente
    });
  }

  async getAnimeDetailsById(id: string): Promise<any> {
    return this.animeService.getAnimeById(id).toPromise();
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.filter === 'all') {
      this.filteredAnime = this.watchedAnime.filter((anime) => anime.details);
    } else {
      this.filteredAnime = this.watchedAnime.filter(
        (anime) => anime.state === this.filter
      );
    }
  }

  toggleTitleLanguage(): void {
    this.titleLanguage = this.titleLanguage === 'english' ? 'original' : 'english';
    localStorage.setItem('titleLanguage', this.titleLanguage);
    this.cdr.detectChanges(); // Forza l'aggiornamento della vista
  }

  getTitle(anime: any): string {
    if (!anime) return '';
    if (this.titleLanguage === 'english') {
      return anime.title_english || anime.title;
    } else {
      return anime.title || anime.title_english;
    }
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }
}
