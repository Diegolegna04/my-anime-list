import { Component, OnInit } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AnimeService} from '../services/anime.service';

@Component({
  selector: 'app-header',
  imports: [
    NgIf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './header.component.html',
  standalone: true,
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  animeList: any[] = [];
  private topAnimeUrl = 'https://api.jikan.moe/v4/top/anime';
  showSearchBar: boolean = false;

  constructor(private http: HttpClient, private router: Router, private animeService: AnimeService) {}

  ngOnInit(): void {
    this.loadTopAnime();
  }

  loadTopAnime(): void {
    this.http.get<any>(this.topAnimeUrl).subscribe((response) => {
      this.animeList = response.data;
    });
  }

  query: string = '';

  // Alterna la visibilità della barra di ricerca
  toggleSearchBar(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  // Cerca un anime
  searchAnime(): void {
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query } });
    }
  }

  goToGenres(): void {
    this.router.navigate(['/genres']);
  }

}
