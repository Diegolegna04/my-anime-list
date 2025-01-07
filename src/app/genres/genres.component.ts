import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-genres',
  standalone: true,
  templateUrl: './genres.component.html',
  styleUrls: ['./genres.component.css'],
  imports: [NgForOf, NgIf],
})
export class GenresComponent implements OnInit {
  genres: any[] = [];
  isLoading: boolean = true; // Variabile per gestire lo stato di caricamento
  private genresUrl = 'https://api.jikan.moe/v4/genres/anime';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.http.get<any>(this.genresUrl).subscribe(
      (response) => {
        this.genres = response.data;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading genres:', error);
        this.isLoading = false;
      }
    );
  }

  viewAnimeByGenre(genreId: number): void {
    this.router.navigate(['/anime-by-genre', genreId]);
  }
}
