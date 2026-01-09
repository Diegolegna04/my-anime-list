import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

@Component({
  selector: 'app-anime-search',
  templateUrl: './anime-search.component.html',
  styleUrls: ['./anime-search.component.css'],
  imports: [
    CommonModule,
    FormsModule
  ],
  standalone: true,
})
export class AnimeSearchComponent implements OnInit {
  searchResults: any[] = [];
  displayedResults: any[] = [];
  query: string = '';
  isGridView: boolean = true;
  selectedSortCriteria: string = 'score';
  titleLanguage: 'english' | 'original' = 'original';
  isLoading: boolean = false;
  loadingProgress: number = 0;
  
  // Paginazione per "Carica Altri"
  private itemsPerPage: number = 25;
  private currentDisplayPage: number = 1;

  constructor(
    private animeService: AnimeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    
    this.route.queryParams.subscribe((params) => {
      this.query = params['q'] || '';
      if (this.query) {
        this.performFullSearch(this.query);
      }
    });
  }

  performFullSearch(query: string): void {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.searchResults = [];
    this.displayedResults = [];
    this.currentDisplayPage = 1;

    // Prima richiesta per ottenere il numero totale di pagine
    this.animeService.searchAnime(query, 1).subscribe(
      (response: { data: any[]; pagination?: any; }) => {
        const firstPageData = response.data;
        const totalPages = response.pagination?.last_visible_page || 1;
        const maxPages = Math.min(totalPages, 5); // Limita a max 5 pagine (125 risultati)

        if (maxPages === 1) {
          // Solo una pagina, mostra subito i risultati
          this.searchResults = this.removeDuplicates(firstPageData);
          this.applySort();
          this.updateDisplayedResults();
          this.isLoading = false;
          return;
        }

        // Carica tutte le pagine in parallelo con rate limiting
        const pageRequests = [];
        
        // Aggiungi la prima pagina che abbiamo già
        pageRequests.push(of(firstPageData));

        // Crea richieste per le altre pagine con delay per evitare rate limiting
        for (let page = 2; page <= maxPages; page++) {
          const delayTime = (page - 2) * 350; // 350ms tra ogni richiesta
          pageRequests.push(
            this.animeService.searchAnime(query, page).pipe(
              delay(delayTime),
              catchError(error => {
                console.error(`Error loading page ${page}:`, error);
                return of({ data: [] });
              })
            )
          );
        }

        // Esegui tutte le richieste
        let completedRequests = 0;
        pageRequests.forEach((request, index) => {
          request.subscribe((pageResponse: any) => {
            completedRequests++;
            this.loadingProgress = Math.round((completedRequests / maxPages) * 100);

            // Aggiungi i risultati della pagina
            const pageData = Array.isArray(pageResponse) ? pageResponse : pageResponse.data;
            this.searchResults = [...this.searchResults, ...pageData];

            // Se tutte le richieste sono completate
            if (completedRequests === maxPages) {
              this.searchResults = this.removeDuplicates(this.searchResults);
              this.applySort();
              this.updateDisplayedResults();
              this.isLoading = false;
              this.loadingProgress = 100;
            }
          });
        });
      },
      (error) => {
        console.error('Error during search:', error);
        this.isLoading = false;
      }
    );
  }

  // Rimuove duplicati basandosi su mal_id
  private removeDuplicates(animeList: any[]): any[] {
    const uniqueMap = new Map();
    animeList.forEach(anime => {
      if (anime && anime.mal_id && !uniqueMap.has(anime.mal_id)) {
        uniqueMap.set(anime.mal_id, anime);
      }
    });
    return Array.from(uniqueMap.values());
  }

  // Applica l'ordinamento selezionato
  private applySort(): void {
    this.searchResults = this.sortAnime([...this.searchResults], this.selectedSortCriteria);
  }

  // Aggiorna i risultati visualizzati (paginazione lato client)
  private updateDisplayedResults(): void {
    const endIndex = this.currentDisplayPage * this.itemsPerPage;
    this.displayedResults = this.searchResults.slice(0, endIndex);
  }

  // Funzione di ordinamento
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
