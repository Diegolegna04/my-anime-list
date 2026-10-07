import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AnimeCardComponent } from '../../services/shared/anime-card.component';
import { TitleLanguageToggleComponent } from '../../services/shared/title-language-toggle.component';

@Component({
  selector: 'app-top-anime',
  standalone: true,
  imports: [TitleLanguageToggleComponent, AnimeCardComponent],
  templateUrl: './top-anime.component.html',
  styleUrl: './top-anime.component.css'
})
export class TopAnimeComponent {
  @Input() animeList: any[] = [];
  @Input() isLoading: boolean = false;
  /** La prima pagina non è arrivata: al posto della griglia vuota si mostra l'errore */
  @Input() hasError: boolean = false;
  @Output() loadMore = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  isGridView: boolean = true;
  titleLanguage: 'english' | 'original' = 'original';

  constructor() {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
  }

  setTitleLanguage(language: 'english' | 'original'): void {
    this.titleLanguage = language;
    localStorage.setItem('titleLanguage', language);
  }
}