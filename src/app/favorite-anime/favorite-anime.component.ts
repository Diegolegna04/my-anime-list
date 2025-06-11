import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {AnimeService} from '../services/anime.service';

@Component({
  selector: 'app-favorite-anime',
  templateUrl: './favorite-anime.component.html',
  standalone: true,
  imports: [],
  styleUrls: ['./favorite-anime.component.css']
})
export class FavoriteAnimeComponent implements OnInit {
  favoriteAnime: any[] = [];
  private animeDetailUrl = 'https://api.jikan.moe/v4/anime';
  titleLanguage: 'english' | 'original' = 'original';
  isGridView: boolean = true;

  constructor(private http: HttpClient, private animeService: AnimeService) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    this.loadFavoriteAnime();
    window.scroll(0, 0);
  }

  loadFavoriteAnime(): void {
    const elencoPreferiti = JSON.parse(localStorage.getItem('elencoPreferiti') || '[]');
    this.favoriteAnime = []; // Reset the array

    // Carica i dettagli di ogni anime preferito
    elencoPreferiti.forEach((id: string) => {
      this.getAnimeDetailsById(id);
    });
  }

  getAnimeDetailsById(id: string): void {
    const url = `${this.animeDetailUrl}/${id}`;
    this.http.get<any>(url).subscribe((response) => {
      this.favoriteAnime.push(response.data);
    });
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleView(): void {
    this.isGridView = !this.isGridView; // Cambia la modalità di visualizzazione
  }

  toggleTitleLanguage(): void {
    this.titleLanguage = this.titleLanguage === 'english' ? 'original' : 'english';
    localStorage.setItem('titleLanguage', this.titleLanguage);
  }

  // Restituisce il titolo nella lingua selezionata
  getTitle(anime: any): string {
    if (this.titleLanguage === 'english') {
      return anime.title_english || anime.title;
    } else {
      return anime.title || anime.title_english;
    }
  }
}
