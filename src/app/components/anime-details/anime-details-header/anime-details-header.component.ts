// anime-details-header.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AnimeDetails {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  episodes: number;
  score: number;
  status: string;
  genres: Array<{ mal_id: number; name: string; }>;
}

@Component({
  selector: 'app-anime-details-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anime-details-header.component.html',
  styleUrls: ['./anime-details-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeDetailsHeaderComponent {
  @Input({ required: true }) animeDetails!: AnimeDetails;
  @Input() titleLanguage: 'english' | 'original' = 'original';
  @Input() isTranslating: boolean = false;
  
  @Output() translateRequested = new EventEmitter<void>();

  /**
   * Determina quale titolo mostrare in base alla lingua selezionata
   */
  getDisplayedTitle(): string {
    if (!this.animeDetails) return '';
    
    if (this.titleLanguage === 'english') {
      return this.animeDetails.title_english || this.animeDetails.title;
    }
    return this.animeDetails.title || this.animeDetails.title_english || '';
  }

  /**
   * Emette evento per richiedere la traduzione
   */
  onTranslateClick(): void {
    if (!this.isTranslating) {
      this.translateRequested.emit();
    }
  }

  /**
   * Gestisce errori di caricamento immagine
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder-anime.png'; // Immagine placeholder
  }

  /**
   * Verifica se la synopsis è troppo lunga
   */
  get isSynopsisLong(): boolean {
    return this.animeDetails?.synopsis?.length > 500;
  }
}