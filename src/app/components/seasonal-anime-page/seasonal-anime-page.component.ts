import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AnimeService } from '../../services/anime.service';

@Component({
  selector: 'app-seasonal-anime',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private animeService: AnimeService
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';

    this.route.params.subscribe(params => {
      this.currentSeason = params['season'];
      const decodedSeason = this.currentSeason.replace(/-/g, ' ');
      this.parseSeason(decodedSeason);
      this.resetAndLoadSeasonalAnime();
    });

    window.scroll(0, 0);
  }

  parseSeason(seasonParam: string): void {
    if (seasonParam === 'current' || seasonParam.toLowerCase() === 'now') {
      const currentDate = new Date();
      this.year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      if (month >= 1 && month <= 3) {
        this.season = 'winter';
      } else if (month >= 4 && month <= 6) {
        this.season = 'spring';
      } else if (month >= 7 && month <= 9) {
        this.season = 'summer';
      } else {
        this.season = 'fall';
      }
    } else {
      const parts = seasonParam.split(' ');
      if (parts.length === 2) {
        this.season = parts[0].toLowerCase();
        this.year = parseInt(parts[1], 10);
      } else {
        this.parseSeason('current');
      }
    }
  }

  resetAndLoadSeasonalAnime(): void {
    this.currentPage = 1;
    this.seasonalAnimeList = [];
    this.hasNextPage = true;
    this.loadSeasonalAnime();
  }

  loadSeasonalAnime(): void {
    if (this.isLoading || !this.hasNextPage) return;

    this.isLoading = true;
    const url = `/api/anime-proxy/seasons/${this.year}/${this.season}?page=${this.currentPage}`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          const newAnime = response.data
            .filter((anime: any) => anime.images?.jpg?.image_url)
            .sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
          
          this.seasonalAnimeList = [...this.seasonalAnimeList, ...newAnime];
          this.hasNextPage = response.pagination?.has_next_page || false;
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
