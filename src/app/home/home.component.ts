import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import {AnimeListComponent} from '../components/anime-list/anime-list.component';
import {AnimeService} from '../services/anime.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [FormsModule, NgForOf, NgIf, AnimeListComponent],
})
export class HomeComponent implements OnInit {
  animeList: any[] = [];
  query: string = '';
  currentView: 'list' | 'search' = 'list';

  private topAnimeUrl = 'https://api.jikan.moe/v4/top/anime';

  constructor(private http: HttpClient, private router: Router, private animeService: AnimeService) {}

  ngOnInit(): void {
    this.loadTopAnime();
  }

  // Carica la lista dei Top Anime
  loadTopAnime(): void {
    this.http.get<any>(this.topAnimeUrl).subscribe((response) => {
      this.animeList = response.data;
    });
  }

  // Naviga alla pagina dei dettagli
  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }
}
