import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../services/anime.service';
import {RouterLink} from '@angular/router';
import {NgForOf, NgIf} from '@angular/common'; // Assicurati che il percorso sia corretto

@Component({
  selector: 'app-watched-anime',
  templateUrl: './watched-anime.component.html',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./watched-anime.component.css']
})
export class WatchedAnimeComponent implements OnInit {
  watchedAnime: any[] = [];

  constructor(private animeService: AnimeService) {}

  ngOnInit(): void {
    this.loadWatchedAnime();
  }

  loadWatchedAnime(): void {
    const elencoVisti = JSON.parse(localStorage.getItem('elencoVisti') || '[]');
    const elencoVoti = JSON.parse(localStorage.getItem('elencoVoti') || '{}');

    this.watchedAnime = elencoVisti.map((id: string) => {
      return {
        id,
        score: elencoVoti[id] || null,
        details: null // Inizializza i dettagli a null
      };
    });

    // Carica i dettagli per ogni anime
    this.watchedAnime.forEach(anime => {
      this.getAnimeDetailsById(anime.id).then(details => {
        anime.details = details; // Assegna i dettagli all'anime
      });
    });
  }

  async getAnimeDetailsById(id: string): Promise<any> {
    return this.animeService.getAnimeById(id).toPromise(); // Usa il metodo del servizio
  }
}
