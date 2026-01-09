import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {AnimeService} from '../../services/anime.service';
import {getGenreName, isValidGenreId} from '../../services/constants/anime-genres';
import { getGenreDescription } from '../../services/constants/anime-genre-descriptions';

@Component({
  selector: 'app-anime-by-genre',
  standalone: true,
  templateUrl: './anime-by-genre.component.html',
  styleUrls: ['./anime-by-genre.component.css'],
  imports: [],
})
export class AnimeByGenreComponent implements OnInit {
  animeList: any[] = [];
  genreId: number | null = null;
  genreName: string | null = null;
  isGridView: boolean = true;
  private animeByGenreUrl = 'https://api.jikan.moe/v4/anime';
  private currentPage: number = 1;
  titleLanguage: 'english' | 'original' = 'original';
  isLoading: boolean = false;
  currentSortCriteria: string = 'score';
  genreDescription: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    
    // Recupera il criterio di ordinamento salvato, se presente
    const savedSortCriteria = localStorage.getItem('genreSortCriteria');
    if (savedSortCriteria) {
      this.currentSortCriteria = savedSortCriteria;
    }
    
    // Ottieni l'ID del genere dai parametri della route
    this.genreId = Number(this.route.snapshot.paramMap.get('id'));
    
    // Verifica se l'ID del genere è valido
    if (this.genreId && !isValidGenreId(this.genreId)) {
      console.warn(`ID genere non valido: ${this.genreId}`);
    }
    
    // Ottieni il nome del genere dalla query string se disponibile, altrimenti usa la funzione helper
    this.route.queryParams.subscribe(params => {
      if (params['name']) {
        this.genreName = params['name'];
      } else {
        this.genreName = this.genreId ? getGenreName(this.genreId) : 'Sconosciuto';
      }
    });
    if (this.genreId) {
      this.genreDescription = getGenreDescription(this.genreId);
    }
    
    this.loadAnimeByGenre();
  }

  loadAnimeByGenre(): void {
    this.isLoading = true;
    if (this.genreId) {
      const url = `${this.animeByGenreUrl}?genres=${this.genreId}&page=${this.currentPage}&order_by=score&sort=desc&limit=25`;
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

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  sortAnime(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const criteria = target.value;

    this.currentSortCriteria = criteria;
    // Salva il criterio di ordinamento nel localStorage
    localStorage.setItem('genreSortCriteria', criteria);
    this.animeList = this.animeService.sortAnime(this.animeList, criteria);
  }

  toggleTitleLanguage(): void {
    this.titleLanguage = this.titleLanguage === 'english' ? 'original' : 'english';
    localStorage.setItem('titleLanguage', this.titleLanguage);
  }

  getTitle(anime: any): string {
    if (this.titleLanguage === 'english') {
      return anime.title_english || anime.title;
    } else {
      return anime.title || anime.title_english;
    }
  }

  loadMoreAnime(): void {
    this.currentPage++;
    this.loadAnimeByGenre();
  }
}
