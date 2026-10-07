import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { AnimeCardComponent } from '../../services/shared/anime-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPTY, from, of, Subscription } from 'rxjs';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { TitleLanguageToggleComponent } from '../../services/shared/title-language-toggle.component';

@Component({
  selector: 'app-anime-search',
  templateUrl: './anime-search.component.html',
  styleUrls: ['./anime-search.component.css'],
  imports: [TitleLanguageToggleComponent, 
    CommonModule,
    FormsModule,
    AnimeCardComponent,
    RouterLink
  ],
  standalone: true,
})
export class AnimeSearchComponent implements OnInit, OnDestroy {
  searchResults: any[] = [];
  displayedResults: any[] = [];
  query: string = '';
  /** Generi proposti quando si arriva alla ricerca senza una parola (id MyAnimeList) */
  readonly suggestedGenres = [
    { id: 1, label: 'Azione' },
    { id: 2, label: 'Avventura' },
    { id: 4, label: 'Commedia' },
    { id: 8, label: 'Drammatico' },
    { id: 10, label: 'Fantasy' },
    { id: 22, label: 'Romance' },
    { id: 24, label: 'Sci-Fi' },
    { id: 36, label: 'Slice of Life' }
  ];
  isGridView: boolean = true;
  selectedSortCriteria: string = 'score';
  titleLanguage: 'english' | 'original' = 'original';
  isLoading: boolean = false;
  loadingProgress: number = 0;
  
  private itemsPerPage: number = 25;
  private currentDisplayPage: number = 1;
  private searchSubscription?: Subscription;

  constructor(
    private animeService: AnimeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    
    this.route.queryParams.subscribe((params) => {
      this.query = (params['q'] || '').trim();
      if (this.query) {
        this.performFullSearch(this.query);
      } else {
        this.searchResults = [];
        this.displayedResults = [];
      }
    });
  }

  performFullSearch(query: string): void {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.searchResults = [];
    this.displayedResults = [];
    this.currentDisplayPage = 1;

    // Una ricerca precedente ancora in corso non deve aggiungere risultati a questa
    this.searchSubscription?.unsubscribe();

    let maxPages = 1;
    this.searchSubscription = this.animeService.searchAnime(query, 1).pipe(
      switchMap((response: { data: any[]; pagination?: any }) => {
        maxPages = Math.min(response.pagination?.last_visible_page || 1, 5);
        this.searchResults = this.removeDuplicates(response.data || []);
        this.loadingProgress = Math.round((1 / maxPages) * 100);

        if (maxPages === 1) return EMPTY;

        // Le altre pagine due alla volta: in sequenza, con una pausa fissa tra
        // l'una e l'altra, la ricerca completa durava diversi secondi
        const pageNumbers = Array.from({ length: maxPages - 1 }, (_, i) => i + 2);
        return from(pageNumbers).pipe(
          mergeMap(page =>
            this.animeService.searchAnime(query, page).pipe(
              catchError(error => {
                console.error(`Errore caricando la pagina ${page}:`, error);
                return of({ data: [] });
              })
            ),
            2
          )
        );
      })
    ).subscribe({
      next: (pageResponse: any) => {
        const pageData = Array.isArray(pageResponse) ? pageResponse : (pageResponse.data || []);
        this.searchResults = [...this.searchResults, ...pageData];
        this.loadingProgress = Math.min(100, this.loadingProgress + Math.round(100 / maxPages));
      },
      complete: () => {
        this.searchResults = this.removeDuplicates(this.searchResults);
        this.applySort();
        this.updateDisplayedResults();
        this.isLoading = false;
        this.loadingProgress = 100;
      },
      error: (error) => {
        console.error('Errore durante la ricerca:', error);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private removeDuplicates(animeList: any[]): any[] {
    const uniqueMap = new Map();
    animeList.forEach(anime => {
      if (anime && anime.mal_id && !uniqueMap.has(anime.mal_id)) {
        uniqueMap.set(anime.mal_id, anime);
      }
    });
    return Array.from(uniqueMap.values());
  }

  private applySort(): void {
    this.searchResults = this.sortAnime([...this.searchResults], this.selectedSortCriteria);
  }

  private updateDisplayedResults(): void {
    const endIndex = this.currentDisplayPage * this.itemsPerPage;
    this.displayedResults = this.searchResults.slice(0, endIndex);
  }

  private sortAnime(animeList: any[], criteria: string): any[] {
    if (!animeList || animeList.length === 0) {
      return [];
    }

    let sortedResults = [...animeList];

    switch (criteria) {
      case 'score':
        sortedResults.sort((a, b) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA;
        });
        break;
      case 'members':
        sortedResults.sort((a, b) => {
          const membersA = a.members || 0;
          const membersB = b.members || 0;
          return membersB - membersA;
        });
        break;
      case 'date':
        sortedResults.sort((a, b) => {
          const dateA = new Date(a.aired?.from || 0).getTime();
          const dateB = new Date(b.aired?.from || 0).getTime();
          return dateB - dateA;
        });
        break;
      default:
        break;
    }

    return sortedResults;
  }

  loadMoreResults(): void {
    this.currentDisplayPage++;
    this.updateDisplayedResults();
  }

  get hasMoreResults(): boolean {
    return this.displayedResults.length < this.searchResults.length;
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  goBackToHome(): void {
    this.router.navigate(['/']);
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedSortCriteria = target.value;
    
    this.applySort();
    this.currentDisplayPage = 1;
    this.updateDisplayedResults();
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
