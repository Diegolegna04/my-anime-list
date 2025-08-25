import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-top-anime',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './top-anime.component.html',
  styleUrl: './top-anime.component.css'
})
export class TopAnimeComponent {
  @Input() animeList: any[] = [];
  @Input() isLoading: boolean = false;
  @Output() loadMore = new EventEmitter<void>();

  isGridView: boolean = true;
  titleLanguage: 'english' | 'original' = 'original';

  constructor() {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
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
}