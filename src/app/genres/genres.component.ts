import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-genres',
  standalone: true,
  templateUrl: './genres.component.html',
  styleUrls: ['./genres.component.css'],
  imports: [
    NgForOf,
    NgIf
  ]
})
export class GenresComponent implements OnInit {
  genres: any[] = [];
  isLoading: boolean = true;

  // Suddivisione delle categorie
  mainGenres: any[] = [];
  explicitGenres: any[] = [];
  themes: any[] = [];
  demographics: any[] = [];

  private genresUrl = 'https://api.jikan.moe/v4/genres/anime';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.http.get<any>(this.genresUrl).subscribe(
      (response) => {
        this.genres = response.data;
        this.categorizeGenres();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading genres:', error);
        this.isLoading = false;
      }
    );
  }

  // Suddivisione generi in categorie
  categorizeGenres(): void {
    this.mainGenres = this.genres.filter((genre) =>
      ['action', 'adventure', 'comedy', 'drama', 'fantasy', 'horror', 'mystery', 'romance', 'sci-fi', 'slice of life', 'sports', 'suspense'].includes(genre.name.toLowerCase())
    );
    this.explicitGenres = this.genres.filter((genre) =>
      ['ecchi', 'hentai', 'erotica'].includes(genre.name.toLowerCase())
    );
    this.themes = this.genres.filter((genre) =>
      ['adult cast', 'anthropomorphic', 'cyberpunk', 'delinquents', 'gore', 'magical sex shift', 'military', 'mythology', 'psychological', 'super power', 'survival', 'workplace'].includes(genre.name.toLowerCase())
    );
    this.demographics = this.genres.filter((genre) =>
      ['josei', 'seinen', 'shoujo', 'shounen'].includes(genre.name.toLowerCase())
    );
  }

  // Navigazione alla pagina degli anime per genere
  viewAnimeByGenre(genreId: number): void {
    this.router.navigate(['/genres/anime-by-genre', genreId]);
  }
}
