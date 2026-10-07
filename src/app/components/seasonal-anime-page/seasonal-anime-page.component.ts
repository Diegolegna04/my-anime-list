import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AnimeService } from '../../services/anime.service';
import {
  SeasonRef,
  hasAnnouncedTitles,
  nextSeason,
  previousSeason,
  seasonSlug,
  uniqueByMalId
} from '../../services/anime-utils';
import { SeasonService } from '../../services/season.service';
import { TitleLanguageToggleComponent } from '../../services/shared/title-language-toggle.component';
import { AnimeCardComponent } from '../../services/shared/anime-card.component';

@Component({
  selector: 'app-seasonal-anime',
  standalone: true,
  imports: [TitleLanguageToggleComponent, AnimeCardComponent, CommonModule, RouterLink],
  templateUrl: './seasonal-anime-page.component.html',
  styleUrls: ['./seasonal-anime-page.component.css']
})
export class SeasonalAnimePageComponent implements OnInit, OnDestroy {
  seasonalAnimeList: any[] = [];
  isLoading: boolean = false;
  currentSeason: string = '';
  year: number = 0;
  season: string = '';
  isGridView: boolean = true;
  titleLanguage: 'english' | 'original' = 'original';
  currentPage: number = 1;
  hasNextPage: boolean = true;
  /** Endpoint scelto a pagina 1 (seasons/now o anno/stagione) */
  private viaNow: boolean | undefined;
  /** La stagione successiva ha titoli annunciati; null finché non si sa */
  private nextSeasonAvailable: boolean | null = null;
  private pageSubscription?: Subscription;
  private nextSeasonSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private animeService: AnimeService,
    private seasonService: SeasonService
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';

    this.route.params.subscribe(params => {
      this.currentSeason = params['season'];
      const decodedSeason = this.currentSeason.replace(/-/g, ' ');
      if (this.parseSeason(decodedSeason)) {
        this.resetAndLoadSeasonalAnime();
      } else {
        // "now"/"current" (o un parametro non valido): la stessa stagione della home,
        // che tiene conto di quando gli anime nuovi iniziano davvero
        this.seasonService.resolveActiveSeason().subscribe(({ season }) => {
          this.season = season.season;
          this.year = season.year;
          this.resetAndLoadSeasonalAnime();
        });
      }
    });

    window.scroll(0, 0);
  }

  /** Legge "fall 2026"; false se il parametro non indica una stagione precisa */
  parseSeason(seasonParam: string): boolean {
    const parts = seasonParam.split(' ');
    const season = parts[0]?.toLowerCase();
    const year = parseInt(parts[1], 10);
    if (parts.length !== 2 || !['winter', 'spring', 'summer', 'fall'].includes(season) || isNaN(year)) {
      return false;
    }
    this.season = season;
    this.year = year;
    return true;
  }

  resetAndLoadSeasonalAnime(): void {
    // Cambiando stagione mentre la precedente carica, la sua risposta non deve
    // finire in questa pagina (e isLoading rimasto true bloccava il caricamento)
    this.pageSubscription?.unsubscribe();
    this.nextSeasonSubscription?.unsubscribe();
    this.isLoading = false;
    this.currentPage = 1;
    this.seasonalAnimeList = [];
    this.hasNextPage = true;
    this.viaNow = undefined;
    this.nextSeasonAvailable = null;
    this.loadSeasonalAnime();
    this.loadNextSeasonInfo();
  }

  loadSeasonalAnime(): void {
    if (this.isLoading || !this.hasNextPage) return;

    this.isLoading = true;
    // A pagina 1 SeasonService sceglie tra seasons/now e anno/stagione;
    // le pagine successive vanno chieste allo stesso endpoint
    this.pageSubscription = this.seasonService.getSeasonPage(this.target, this.currentPage, this.viaNow).subscribe({
      next: (page) => {
        this.viaNow = page.viaNow;
        if (page.data.length > 0) {
          const newAnime = page.data
            .filter((anime: any) => anime.images?.jpg?.image_url)
            .sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
          
          this.seasonalAnimeList = uniqueByMalId([...this.seasonalAnimeList, ...newAnime]);
          this.hasNextPage = page.hasNextPage;
        } else {
          this.hasNextPage = false;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento degli anime stagionali:', error);
        this.isLoading = false;
        this.hasNextPage = false;
        this.seasonalAnimeList = [];
      }
    });
  }

  loadMoreAnime(): void {
    if (!this.hasNextPage || this.isLoading) return;
    this.currentPage++;
    this.loadSeasonalAnime();
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
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

  getFormattedSeason(): string {
    const seasonNames: { [key: string]: string } = {
      'spring': 'Primavera',
      'summer': 'Estate',
      'fall': 'Autunno',
      'winter': 'Inverno'
    };
    
    return `${seasonNames[this.season] || this.season} ${this.year}`;
  }

  // L'inverno che segue l'autunno 2026 è l'inverno 2027 (anime da fine dicembre
  // 2026 a marzo 2027): prima qui l'anno restava lo stesso e si finiva
  // sull'inverno 2026, già passato. nextSeason/previousSeason lo gestiscono.
  goToPreviousSeason(): void {
    this.router.navigate(['/seasonal', seasonSlug(previousSeason(this.target))]);
  }

  goToNextSeason(): void {
    this.router.navigate(['/seasonal', seasonSlug(nextSeason(this.target))]);
  }

  /**
   * "Successiva" solo se la stagione dopo ha già abbastanza titoli annunciati.
   * Finché non si sa (o se la richiesta fallisce) vale il limite di calendario:
   * fino all'autunno dell'anno prossimo.
   */
  canGoToNextSeason(): boolean {
    if (this.nextSeasonAvailable !== null) return this.nextSeasonAvailable;
    const order = ['winter', 'spring', 'summer', 'fall'];
    const limitYear = new Date().getFullYear() + 1;
    return this.year * 10 + order.indexOf(this.season) < limitYear * 10 + order.indexOf('fall');
  }

  /** Se la stagione successiva ha titoli annunciati, dalla sua prima pagina */
  private loadNextSeasonInfo(): void {
    this.nextSeasonSubscription = this.seasonService.getSeasonPage(nextSeason(this.target), 1).subscribe({
      next: (page) => {
        this.nextSeasonAvailable = hasAnnouncedTitles(page.data);
      },
      error: () => {
        this.nextSeasonAvailable = null;
      }
    });
  }

  private get target(): SeasonRef {
    return { season: this.season, year: this.year };
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
    this.nextSeasonSubscription?.unsubscribe();
  }
}
