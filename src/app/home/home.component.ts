import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AnimeService } from '../services/anime.service';
import { RandomAnimeComponent } from "../components/random-anime/random-anime.component";
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { TopAnimeComponent } from './top-anime/top-anime.component';
import { SeasonalAnimeComponent } from './seasonal-anime/seasonal-anime.component';
import { GenresHomeComponent } from "./genres-home/genres-home.component";
import { NewsletterComponent } from "./newsletter/newsletter.component";

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    RandomAnimeComponent,
    HeroSectionComponent,
    TopAnimeComponent,
    SeasonalAnimeComponent,
    GenresHomeComponent,
    NewsletterComponent
],
})
export class HomeComponent implements OnInit, OnDestroy {
  animeList: any[] = [];
  seasonalAnimeList: any[] = [];
  isLoading: boolean = false;
  currentView: 'list' | 'search' = 'list';
  
  private topAnimeUrl = '/api/anime-proxy/top/anime';
  private seasonalAnimeUrl = '/api/anime-proxy/seasons/now';
  currentPage: number = 1;

  constructor(
    private http: HttpClient,
    private router: Router,
    private animeService: AnimeService
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
    this.loadSeasonalAnime();
  }

  loadTopAnime(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.topAnimeUrl}?page=${this.currentPage}`).subscribe((response) => {
      this.animeList = [...this.animeList, ...response.data];
      this.isLoading = false;
    });
  }

  loadMoreAnime(): void {
    this.currentPage++;
    this.loadTopAnime();
  }
  
  loadSeasonalAnime(): void {
    this.isLoading = true;
    this.http.get<any>(this.seasonalAnimeUrl).subscribe((response) => {
      this.seasonalAnimeList = response.data
        .filter((anime: any) => anime.score && anime.score > 0)
        .sort((a: any, b: any) => b.score - a.score);
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

  ngOnDestroy(): void {
    localStorage.setItem('homeScrollPos', window.scrollY.toString());
  }
}
