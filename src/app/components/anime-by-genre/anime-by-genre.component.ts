import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AnimeService } from '../../services/anime.service';
import { GenreService } from '../../services/genre.service';
import { AnimeCardComponent } from '../../services/shared/anime-card.component';
import { getGenreDescription } from '../../services/constants/anime-genre-descriptions';

@Component({
  selector: 'app-anime-by-genre',
  standalone: true,
  templateUrl: './anime-by-genre.component.html',
  styleUrls: ['./anime-by-genre.component.css'],
  imports: [AnimeCardComponent],
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
  isDescriptionExpanded: boolean = false;

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