import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GenreService, Genre } from '../services/genre.service';

@Component({
  selector: 'app-genres',
  standalone: true,
  templateUrl: './genres.component.html',
  styleUrls: ['./genres.component.css'],
  imports: [
    CommonModule,
    RouterLink
  ]
})
export class GenresComponent implements OnInit {
  isLoading: boolean = true;
  mainGenres: Genre[] = [];
  explicitGenres: Genre[] = [];
  themes: Genre[] = [];
  demographics: Genre[] = [];

  constructor(private router: Router, private genreService: GenreService) {}

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.genreService.getAllGenres().subscribe({
      next: (genres) => {
        this.mainGenres = genres.filter(g => g.category === 'genres');
        this.explicitGenres = genres.filter(g => g.category === 'explicit_genres');
        this.themes = genres.filter(g => g.category === 'themes');
        this.demographics = genres.filter(g => g.category === 'demographics');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading genres:', error);
        this.isLoading = false;
      }
    });
  }

  viewAnimeByGenre(genreId: number, genreName: string): void {
    this.router.navigate(['/genres/anime-by-genre', genreId], { queryParams: { name: genreName } });
  }
}
