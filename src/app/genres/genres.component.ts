import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GenreService } from '../services/genre.service';

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
  genres: any[] = [];
  isLoading: boolean = true;
  mainGenres: any[] = [];
  explicitGenres: any[] = [];
  themes: any[] = [];
  demographics: any[] = [];

  constructor(private router: Router, private genreService: GenreService) {}

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.genreService.getAllGenres().subscribe({
      next: (genres) => {
        this.genres = genres.map(g => ({ mal_id: g.id, name: g.name }));
        this.categorizeGenres();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading genres:', error);
        this.isLoading = false;
      }
    });
  }

  categorizeGenres(): void {
    this.mainGenres = this.genres.filter((genre: any) =>
      ['action',
        'adventure',
        'comedy',
        'drama',
        'fantasy',
        'horror',
        'mystery',
        'romance',
        'sci-fi',
        'slice of life',
        'sports',
        'suspense'].includes(genre.name.toLowerCase())
    );
    this.explicitGenres = this.genres.filter((genre: any) =>
      ['ecchi', 'hentai', 'erotica'].includes(genre.name.toLowerCase())
    );
    this.themes = this.genres.filter((genre: any) =>
      ['adult cast',
        'anthropomorphic',
        'cyberpunk',
        'delinquents',
        'gore',
        'magical sex shift',
        'military',
        'mythology',
        'psychological',
        'super power',
        'survival',
        'workplace'].includes(genre.name.toLowerCase())
    );
    this.demographics = this.genres.filter((genre: any) =>
      ['josei', 'seinen', 'shoujo', 'shounen'].includes(genre.name.toLowerCase())
    );
  }

  viewAnimeByGenre(genreId: number, genreName: string): void {
    this.router.navigate(['/genres/anime-by-genre', genreId], { queryParams: { name: genreName } });
  }
}
