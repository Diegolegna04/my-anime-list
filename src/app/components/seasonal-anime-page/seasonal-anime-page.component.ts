import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AnimeService } from '../../services/anime.service';
import { uniqueByMalId } from '../../services/anime-utils';
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
export class SeasonalAnimePageComponent implements OnInit {
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
    this.currentPage = 1;
    this.seasonalAnimeList = [];
    this.hasNextPage = true;
    this.viaNow = undefined;
    this.loadSeasonalAnime();
  }

  loadSeasonalAnime(): void {
    if (this.isLoading || !this.hasNextPage) return;

    this.isLoading = true;
    // A pagina 1 SeasonService sceglie tra seasons/now e anno/stagione;
    // le pagine successive vanno chieste allo stesso endpoint
    const target = { season: this.season, year: this.year };
    this.seasonService.getSeasonPage(target, this.currentPage, this.viaNow).subscribe({
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

  goToPreviousSeason(): void {
    let newYear = this.year;
    let newSeason = '';

    switch (this.season) {
      case 'spring':
        newSeason = 'winter';
        newYear = this.year - 1;
        break;
      case 'summer':
        newSeason = 'spring';
        break;
      case 'fall':
        newSeason = 'summer';
        break;
      case 'winter':
        newSeason = 'fall';
        newYear = this.year - 1;
        break;
    }

    const seasonParam = `${newSeason}-${newYear}`;
    this.router.navigate(['/seasonal', seasonParam]);
  }

  goToNextSeason(): void {
    let newYear = this.year;
    let newSeason = '';

    switch (this.season) {
      case 'spring':
        newSeason = 'summer';
        break;
      case 'summer':
        newSeason = 'fall';
        break;
      case 'fall':
        newSeason = 'winter';
        break;
      case 'winter':
        newSeason = 'spring';
        newYear = this.year + 1;
        break;
    }

    const seasonParam = `${newSeason}-${newYear}`;
    this.router.navigate(['/seasonal', seasonParam]);
  }

  canGoToNextSeason(): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    let actualCurrentSeason = '';
    if (currentMonth >= 1 && currentMonth <= 3) {
      actualCurrentSeason = 'winter';
    } else if (currentMonth >= 4 && currentMonth <= 6) {
      actualCurrentSeason = 'spring';
    } else if (currentMonth >= 7 && currentMonth <= 9) {
      actualCurrentSeason = 'summer';
    } else {
      actualCurrentSeason = 'fall';
    }

    const seasonOrder = ['winter', 'spring', 'summer', 'fall'];
    const currentSeasonIndex = seasonOrder.indexOf(actualCurrentSeason);
    const thisSeasonIndex = seasonOrder.indexOf(this.season);

    let nextSeasonIndex = thisSeasonIndex + 1;
    let nextSeasonYear = this.year;
    if (nextSeasonIndex >= seasonOrder.length) {
      nextSeasonIndex = 0;
      nextSeasonYear++;
    }
    const nextLogicalSeason = seasonOrder[nextSeasonIndex];
    const futureLimitYear = currentYear + 1;
    const futureLimitSeason = 'fall';

    const limitSeasonIndex = seasonOrder.indexOf(futureLimitSeason);

    const thisSeasonScore = this.year * 10 + thisSeasonIndex;
    const currentSeasonScore = currentYear * 10 + currentSeasonIndex;
    const limitSeasonScore = futureLimitYear * 10 + limitSeasonIndex;
    return thisSeasonScore < limitSeasonScore;
  }
}
