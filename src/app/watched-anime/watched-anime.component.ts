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
  isLoading: boolean = true;

  constructor(private animeService: AnimeService, private cdr: ChangeDetectorRef) {} // Inietta ChangeDetectorRef

  ngOnInit(): void {
    this.loadWatchedAnime();
  }

  loadWatchedAnime(): void {
    const elencoVisti = JSON.parse(localStorage.getItem('elencoVisti') || '[]');

    this.watchedAnime = elencoVisti.map((id: string) => {
      return { id, details: null };
    });

    let remaining = this.watchedAnime.length;

    this.watchedAnime.forEach(anime => {
      this.getAnimeDetailsById(anime.id).then(details => {
        anime.details = details;
        remaining--;

        if (remaining === 0) {
          this.isLoading = false;
          this.cdr.detectChanges(); // Forza il rilevamento delle modifiche
        }
      });
    });
  }

  async getAnimeDetailsById(id: string): Promise<any> {
    return this.animeService.getAnimeById(id).toPromise();
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }
}
