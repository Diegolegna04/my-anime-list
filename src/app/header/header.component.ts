import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnimeService } from '../services/anime.service';

@Component({
  selector: 'app-header',
  imports: [NgIf, ReactiveFormsModule, FormsModule],
  templateUrl: './header.component.html',
  standalone: true,
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  animeList: any[] = [];
  private topAnimeUrl = 'https://api.jikan.moe/v4/top/anime';
  showSearchBar: boolean = false;
  query: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private animeService: AnimeService
  ) {}

  ngOnInit(): void {
    this.loadTopAnime();
  }

  // Carica la lista dei migliori anime
  loadTopAnime(): void {
    this.http.get<any>(this.topAnimeUrl).subscribe((response) => {
      this.animeList = response.data;
    });
  }

  // Alterna la visibilità della barra di ricerca
  toggleSearchBar(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  // Esegue la ricerca dell'anime
  searchAnime(): void {
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query } });
      this.showSearchBar = false; // Chiude la barra di ricerca dopo la ricerca
    }
  }

  // Naviga alla pagina dei generi
  goToGenres(): void {
    this.router.navigate(['/genres']);
  }
}
