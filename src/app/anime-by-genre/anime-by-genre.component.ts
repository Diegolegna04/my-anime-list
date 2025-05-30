import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {AnimeService} from '../services/anime.service';

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
  isGridView: boolean = true; // Variabile per alternare tra griglia e lista
  private animeByGenreUrl = 'https://api.jikan.moe/v4/anime';
  private currentPage: number = 1; // Traccia la pagina corrente
  titleLanguage: 'english' | 'original' = 'original'; // Variabile per la lingua del titolo
  isLoading: boolean = false; // Variabile per gestire il caricamento
  currentSortCriteria: string = 'score'; // Traccia il criterio di ordinamento corrente

  private genreMap: { [key: number]: string } = {
    1: 'Action',
    2: 'Adventure',
    3: 'Racing',
    4: 'Comedy',
    5: 'Avant Garde',
    6: 'Mythology',
    7: 'Mystery',
    8: 'Drama',
    9: 'Ecchi',
    10: 'Fantasy',
    12: 'Hentai',
    14: 'Horror',
    22: 'Romance',
    24: 'Sci-Fi',
    25: 'Shoujo',
    27: 'Sounen',
    30: 'Sports',
    31: 'Super Power',
    36: 'Slice of Life',
    37: 'Supernatural',
    38: 'Military',
    40: 'Psychological',
    41: 'Suspense',
    42: 'Seinen',
    43: 'Josei',
    48: 'Workplace',
    49: 'Erotica',
    50: 'Adult Cast',
    51: 'Anthropomorphic',
    55: 'Delinquents',
    58: 'Gore',
    65: 'Magical Sex Shift',
    76: 'Survival',
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService
  ) {
  }

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    
    this.genreId = Number(this.route.snapshot.paramMap.get('id'));
    this.genreName = this.genreId ? this.genreMap[this.genreId] || 'Sconosciuto' : 'Sconosciuto';
    this.loadAnimeByGenre();
  }

  loadAnimeByGenre(): void {
    this.isLoading = true;
    if (this.genreId) {
      const url = `${this.animeByGenreUrl}?genres=${this.genreId}&page=${this.currentPage}&order_by=score&sort=desc&limit=25`;
      this.http.get<any>(url).subscribe((response) => {
        const newAnime = response.data;
        this.animeList = [...this.animeList, ...newAnime];

        if (this.currentSortCriteria !== 'score') {
          this.animeList = this.animeService.sortAnime(this.animeList, this.currentSortCriteria);
        }
        this.isLoading = false;
      });
    }
  }

  toggleView(): void {
    this.isGridView = !this.isGridView; // Cambia la modalità di visualizzazione
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  sortAnime(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const criteria = target.value;

    // Aggiorna il criterio di ordinamento corrente
    this.currentSortCriteria = criteria;
    
    this.animeList = this.animeService.sortAnime(this.animeList, criteria);
  }

  toggleTitleLanguage(): void {
    this.titleLanguage = this.titleLanguage === 'english' ? 'original' : 'english';
    localStorage.setItem('titleLanguage', this.titleLanguage);
  }

  // Restituisce il titolo nella lingua selezionata
  getTitle(anime: any): string {
    if (this.titleLanguage === 'english') {
      return anime.title_english || anime.title;
    } else {
      return anime.title || anime.title_english;
    }
  }

  // Carica altri anime
  loadMoreAnime(): void {
    this.currentPage++; // Incrementa il numero di pagina
    this.loadAnimeByGenre(); // Chiama il metodo per caricare altri anime
  }
}
