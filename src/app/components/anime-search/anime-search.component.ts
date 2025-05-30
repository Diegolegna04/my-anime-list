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
  selectedSortCriteria: string = 'members';
  titleLanguage: 'english' | 'original' = 'original';

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
    this.animeService.searchAnime(query).subscribe(
      (response: { data: any[]; }) => {
        this.searchResults = response.data;
        this.sortAnimeInternal(this.selectedSortCriteria);
      },
      (error) => {
        console.error('Error during search:', error);
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
      case 'members':
        sortedResults.sort((a, b) => (b.members || 0) - (a.members || 0));
        break;
      case 'score':
        sortedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
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
