import { Component, OnInit } from '@angular/core';
import { AnimeService } from '../../../services/anime.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {getGenreName, isValidGenreId} from '../../../services/constants/anime-genres';

@Component({
  selector: 'app-anime-by-genre-header',
  imports: [],
  templateUrl: './anime-by-genre-header.component.html',
  styleUrl: './anime-by-genre-header.component.css'
})
export class AnimeByGenreHeaderComponent implements OnInit {
  animeList: any[] = [];
  genreId: number | null = null;
  genreName: string | null = null;
  titleLanguage: 'english' | 'original' = 'original';
  isGridView: boolean = true;
  currentSortCriteria: string = 'score';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService
  ) {}

  ngOnInit(): void {
      this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
      
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
    }

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  sortAnime(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const criteria = target.value;

    this.currentSortCriteria = criteria;
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
}
