import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Router, RouterLink} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { AnimeListComponent } from '../components/anime-list/anime-list.component';
import { AnimeService } from '../services/anime.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [FormsModule, NgForOf, NgIf, AnimeListComponent, RouterLink],
})
export class HomeComponent implements OnInit {
  animeList: any[] = [];
  query: string = '';
  currentView: 'list' | 'search' = 'list';
  isLoading: boolean = false; // Variabile per gestire il caricamento
  isGridView: boolean = true;
  private topAnimeUrl = 'https://api.jikan.moe/v4/top/anime';
  private currentPage: number = 1; // Traccia la pagina corrente

  constructor(private http: HttpClient, private router: Router, private animeService: AnimeService) {}

  ngOnInit(): void {
    this.loadTopAnime();
  }

  // Carica la lista dei Top Anime
  loadTopAnime(): void {
    this.isLoading = true; // Attiva lo stato di caricamento
    this.http.get<any>(`${this.topAnimeUrl}?page=${this.currentPage}`).subscribe((response) => {
      this.animeList = [...this.animeList, ...response.data]; // Aggiungi nuovi anime alla lista
      this.isLoading = false; // Disattiva lo stato di caricamento
    });
  }

  // Naviga alla pagina dei dettagli
  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleView(): void {
    this.isGridView = !this.isGridView; // Cambia la modalità di visualizzazione
  }

  // Carica altri anime
  loadMoreAnime(): void {
    this.currentPage++; // Incrementa il numero di pagina
    this.loadTopAnime(); // Chiama il metodo per caricare altri anime
  }
}
