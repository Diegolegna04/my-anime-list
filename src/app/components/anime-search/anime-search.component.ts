import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  query: string = '';
  isGridView: boolean = true;
  selectedSortCriteria: string = 'score'; // Cambiato da 'members' a 'score'
  titleLanguage: 'english' | 'original' = 'original';
  currentPage: number = 1;
  hasMoreResults: boolean = false;
  isLoading: boolean = false;

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
        this.performSearch(this.query);
      }
    });
  }

  performSearch(query: string): void {
    this.isLoading = true;
    this.currentPage = 1;
    this.hasMoreResults = false;
    
    this.animeService.searchAnime(query).subscribe(
      (response: { data: any[]; pagination?: any; }) => {
        this.searchResults = response.data;
        this.sortAnimeInternal(this.selectedSortCriteria);
        
        // Controlla se ci sono più pagine disponibili
        if (response.pagination) {
          this.hasMoreResults = response.pagination.has_next_page || false;
        }
        
        this.isLoading = false;
      },
      (error) => {
        console.error('Error during search:', error);
        this.isLoading = false;
      }
    );
  }

  loadMoreResults(): void {
    if (this.isLoading || !this.hasMoreResults) return;
    
    this.isLoading = true;
    this.currentPage++;
    
    this.animeService.searchAnime(this.query, this.currentPage).subscribe(
      (response: { data: any[]; pagination?: any; }) => {
        this.searchResults = [...this.searchResults, ...response.data];
        this.sortAnimeInternal(this.selectedSortCriteria);
        
        if (response.pagination) {
          this.hasMoreResults = response.pagination.has_next_page || false;
        }
        
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading more results:', error);
        this.isLoading = false;
        this.currentPage--; // Ripristina la pagina in caso di errore
      }
    );
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
    this.sortAnimeInternal(this.selectedSortCriteria);
  }

  sortAnimeInternal(criteria: string): void {
    if (!this.searchResults || this.searchResults.length === 0) {
      return;
    }

    let sortedResults = [...this.searchResults];

    switch (criteria) {
      case 'score':
        sortedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'members':
        sortedResults.sort((a, b) => (b.members || 0) - (a.members || 0));
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
    this.searchResults = sortedResults;
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
