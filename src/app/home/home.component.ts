import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AnimeService } from '../services/anime.service';
import { SeasonRef, seasonSlug, sortSeasonalForHome } from '../services/anime-utils';
import { SeasonService } from '../services/season.service';
import { ToastService } from '../services/toast.service';
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
  /** Stagione mostrata in home: null finché non è stata decisa */
  activeSeason: SeasonRef | null = null;
  isLoading: boolean = false;
  currentView: 'list' | 'search' = 'list';
  
  private topAnimeUrl = '/api/anime-proxy/top/anime';
  currentPage: number = 1;

  constructor(
    private http: HttpClient,
    private router: Router,
    private animeService: AnimeService,
    private seasonService: SeasonService,
    private toastService: ToastService
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
    this.http.get<any>(`${this.topAnimeUrl}?page=${this.currentPage}`).subscribe({
      next: (response) => {
        this.animeList = [...this.animeList, ...(response.data || [])];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        if (this.currentPage > 1) {
          // Così il prossimo "carica altri" riprova la stessa pagina
          this.currentPage--;
          this.toastService.show('Impossibile caricare altri anime, riprova tra poco', 'error');
        }
      }
    });
  }

  loadMoreAnime(): void {
    this.currentPage++;
    this.loadTopAnime();
  }
  
  loadSeasonalAnime(): void {
    this.seasonService.resolveActiveSeason().subscribe(({ season, list }) => {
      this.activeSeason = season;
      this.seasonalAnimeList = sortSeasonalForHome(list);
    });
  }

  /** Link del pulsante "Anime Stagionali": "now" finché la stagione non è decisa */
  get activeSeasonSlug(): string {
    return this.activeSeason ? seasonSlug(this.activeSeason) : 'now';
  }

  ngOnDestroy(): void {
    localStorage.setItem('homeScrollPos', window.scrollY.toString());
  }
}
