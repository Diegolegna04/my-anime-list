import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AnimeService } from '../../services/anime.service';
import { GenreCategory, GenreService } from '../../services/genre.service';
import { AnimeCardComponent } from '../../services/shared/anime-card.component';
import { getGenreDescription, getGenreShortDescription } from '../../services/constants/anime-genre-descriptions';
import { getGenreIcon } from '../../services/constants/genre-icons';

@Component({
  selector: 'app-anime-by-genre',
  standalone: true,
  templateUrl: './anime-by-genre.component.html',
  styleUrls: ['./anime-by-genre.component.css'],
  imports: [AnimeCardComponent, RouterLink],
})
export class AnimeByGenreComponent implements OnInit {
  animeList: any[] = [];
  genreId: number | null = null;
  genreName: string | null = null;
  isGridView: boolean = true;
  private animeByGenreUrl = '/api/anime-proxy/anime';
  private currentPage: number = 1;
  titleLanguage: 'english' | 'original' = 'original';
  isLoading: boolean = false;
  currentSortCriteria: string = 'score';
  genreDescription: string | null = null;
  genreShortDescription: string | null = null;
  genreIcon = getGenreIcon(0);
  isDescriptionExpanded: boolean = false;
  genreMeta: { category: GenreCategory; categoryLabel: string; count: string } | null = null;

  private static readonly CATEGORY_LABELS: Record<GenreCategory, string> = {
    genres: 'Genere',
    themes: 'Tema',
    demographics: 'Demografia',
    explicit_genres: 'Genere esplicito'
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService,
    private genreService: GenreService
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';

    const savedSortCriteria = localStorage.getItem('genreSortCriteria');
    if (savedSortCriteria) {
      this.currentSortCriteria = savedSortCriteria;
    }

    this.genreId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.genreId) {
      this.genreDescription = getGenreDescription(this.genreId);
      this.genreShortDescription = getGenreShortDescription(this.genreId);
      this.genreIcon = getGenreIcon(this.genreId);
      this.loadGenreMeta(this.genreId);
    }

    this.route.queryParams.subscribe(params => {
      if (params['name']) {
        this.genreName = params['name'];
        this.loadAnimeByGenre();
      } else if (this.genreId) {
        this.genreService.getGenreName(this.genreId).subscribe(name => {
          this.genreName = name;
          this.loadAnimeByGenre();
        });
      }
    });
  }

  loadAnimeByGenre(): void {
    this.isLoading = true;
    if (this.genreId) {
      const url = `${this.animeByGenreUrl}?genres=${this.genreId}&genreName=${encodeURIComponent(this.genreName || '')}&page=${this.currentPage}&order_by=score&sort=desc&limit=25`;
      this.http.get<any>(url).subscribe({
        next: (response) => {
          const newAnime = response.data;
          this.animeList = [...this.animeList, ...newAnime];

          if (this.currentSortCriteria !== 'score') {
            this.animeList = this.animeService.sortAnime(this.animeList, this.currentSortCriteria);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Errore nel caricamento degli anime per genere:', error);
          this.isLoading = false;
        }
      });
    }
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  setGridView(grid: boolean): void {
    this.isGridView = grid;
  }

  // Categoria e numero di anime per la riga sotto il titolo. I generi sono già
  // in cache se si arriva dal catalogo; se la richiesta fallisce la riga non compare.
  private loadGenreMeta(genreId: number): void {
    this.genreService.getAllGenres().subscribe({
      next: genres => {
        const genre = genres.find(g => g.id === genreId);
        if (genre) {
          this.genreMeta = {
            category: genre.category,
            categoryLabel: AnimeByGenreComponent.CATEGORY_LABELS[genre.category],
            count: genre.count ? new Intl.NumberFormat('it-IT').format(genre.count) : ''
          };
        }
      },
      error: () => { this.genreMeta = null; }
    });
  }

  sortAnime(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const criteria = target.value;

    this.currentSortCriteria = criteria;
    localStorage.setItem('genreSortCriteria', criteria);
    this.animeList = this.animeService.sortAnime(this.animeList, criteria);
  }

  toggleTitleLanguage(): void {
    this.titleLanguage = this.titleLanguage === 'english' ? 'original' : 'english';
    localStorage.setItem('titleLanguage', this.titleLanguage);
  }

  loadMoreAnime(): void {
    this.currentPage++;
    this.loadAnimeByGenre();
  }
}