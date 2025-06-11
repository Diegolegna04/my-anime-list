import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ViewportScroller } from '@angular/common';
import { DOCUMENT } from '@angular/core';
import { filter } from 'rxjs';
import { AnimeService } from '../services/anime.service';
import { RandomAnimeComponent } from "../components/random-anime/random-anime.component";

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [FormsModule, RouterLink, RandomAnimeComponent],
})
export class HomeComponent implements OnInit, OnDestroy {
  animeList: any[] = [];
  seasonalAnimeList: any[] = [];
  filteredSeasonalAnime: any[] = [];
  query: string = '';
  currentView: 'list' | 'search' = 'list';
  isLoading: boolean = false;
  isGridView: boolean = true;
  currentSlideIndex: number = 0;
  itemsPerSlide: number = 5;
  
  private topAnimeUrl = 'https://api.jikan.moe/v4/top/anime';
  private seasonalAnimeUrl = 'https://api.jikan.moe/v4/seasons/now';
  currentPage: number = 1;
  titleLanguage: 'english' | 'original' = 'original';

  constructor(
    private http: HttpClient,
    private router: Router,
    private animeService: AnimeService,
    private viewportScroller: ViewportScroller,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const currentUrl = this.router.url;
      if (currentUrl === '/') {
        localStorage.setItem('homeScrollPos', window.scrollY.toString());
      }
    });
  }

  ngOnInit(): void {
    this.loadTopAnime();
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    this.loadSeasonalAnime();
  }

  // Carica la lista dei Top Anime
  loadTopAnime(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.topAnimeUrl}?page=${this.currentPage}`).subscribe((response) => {
      this.animeList = [...this.animeList, ...response.data];
      this.isLoading = false;
    });
  }

  // Naviga alla pagina dei dettagli
  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  // Carica altri anime
  loadMoreAnime(): void {
    this.currentPage++;
    this.loadTopAnime();
  }

  // Cambia la lingua del titolo e salva la scelta in localStorage
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

  loadSeasonalAnime(): void {
    this.isLoading = true;
    this.http.get<any>(this.seasonalAnimeUrl).subscribe((response) => {
      this.seasonalAnimeList = response.data
        .filter((anime: any) => anime.score && anime.score > 0)
        .sort((a: any, b: any) => b.score - a.score);
      
      this.filteredSeasonalAnime = this.seasonalAnimeList.slice(0, 15);
      this.isLoading = false;
    });
  }

  getCurrentAnimeSeason(): string {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    let season = '';

    if (month >= 4 && month <= 6) {
      season = 'Spring';
    } else if (month >= 7 && month <= 9) {
      season = 'Summer';
    } else if (month >= 10 && month <= 12) {
      season = 'Fall';
    } else {
      season = 'Winter';
    }

    return season + ' ' + year;
  }

  getCurrentAnimeSeasonT(): string {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    let season = '';

    if (month >= 4 && month <= 6) {
      season = 'spring';
    } else if (month >= 7 && month <= 9) {
      season = 'summer';
    } else if (month >= 10 && month <= 12) {
      season = 'fall';
    } else {
      season = 'winter';
    }

    return season + '-' + year;
  }

  getCurrentSlideAnime(): any[] {
    const startIndex = this.currentSlideIndex;
    const endIndex = startIndex + this.itemsPerSlide;
    return this.filteredSeasonalAnime.slice(startIndex, endIndex);
  }

  nextSlide(): void {
    const maxIndex = Math.max(0, this.filteredSeasonalAnime.length - this.itemsPerSlide);
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex+=4;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex-=4;
    }
  }

  canGoNext(): boolean {
    const maxIndex = Math.max(0, this.filteredSeasonalAnime.length - this.itemsPerSlide);
    return this.currentSlideIndex < maxIndex;
  }

  canGoPrev(): boolean {
    return this.currentSlideIndex > 0;
  }

  ngOnDestroy(): void {
    localStorage.setItem('homeScrollPos', window.scrollY.toString());
  }
}
