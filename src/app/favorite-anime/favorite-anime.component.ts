import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {NgForOf, NgIf} from '@angular/common';
import {AnimeService} from '../services/anime.service';

@Component({
  selector: 'app-favorite-anime',
  templateUrl: './favorite-anime.component.html',
  standalone: true,
  imports: [
    NgForOf,
    NgIf
  ],
  styleUrls: ['./favorite-anime.component.css']
})
export class FavoriteAnimeComponent implements OnInit {
  favoriteAnime: any[] = [];
  private animeDetailUrl = 'https://api.jikan.moe/v4/anime';

  constructor(private http: HttpClient, private animeService: AnimeService) {}

  ngOnInit(): void {
    this.loadFavoriteAnime();
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
}
