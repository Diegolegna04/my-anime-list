import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../services/anime.service';
import { ChangeDetectorRef } from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-watched-anime',
  templateUrl: './watched-anime.component.html',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    NgForOf,
    RouterLink
  ],
  styleUrls: ['./watched-anime.component.css']
})
export class WatchedAnimeComponent implements OnInit {
  watchedAnime: any[] = [];
  filteredAnime: any[] = [];
  isLoading: boolean = true;
  filter: string = 'all'; // Può essere 'all', 'completato', o 'in visione'

  constructor(private animeService: AnimeService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
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

    let remaining = this.watchedAnime.length;

    this.watchedAnime.forEach((anime) => {
      this.getAnimeDetailsById(anime.id).then((details) => {
        anime.details = details;
        remaining--;

        if (remaining === 0) {
          this.isLoading = false;
          this.applyFilter(); // Applichiamo il filtro iniziale
          this.cdr.detectChanges();
        }
      });
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
      this.filteredAnime = this.watchedAnime;
    } else {
      this.filteredAnime = this.watchedAnime.filter(
        (anime) => anime.state === this.filter
      );
    }
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }
}
