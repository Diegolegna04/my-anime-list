import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Genre {
  mal_id: number;
  name: string;
  url?: string;
}

export interface StreamingService {
  name: string;
  url: string;
}

export interface AnimeInfo {
  episodes: number | null;
  score: number | null;
  status: string;
  genres: Genre[];
  type?: string;
  aired?: {
    from: string;
    to: string | null;
  };
  rating?: string;
  studios?: Array<{ name: string }>;
}

@Component({
  selector: 'app-anime-info-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './anime-info-card.component.html',
  styleUrls: ['./anime-info-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeInfoCardComponent {
  @Input({ required: true }) animeDetails!: AnimeInfo;
  @Input() streamingServices: StreamingService[] = [];

  /**
   * Formatta il numero di episodi
   */
  get formattedEpisodes(): string {
    if (!this.animeDetails?.episodes) {
      return 'N/A';
    }
    return this.animeDetails.episodes.toString();
  }

  /**
   * Formatta il voto con gestione dei decimali
   */
  get formattedScore(): string {
    if (!this.animeDetails?.score) {
      return 'N/A';
    }
    return this.animeDetails.score.toFixed(2);
  }

  /**
   * Traduce lo status in italiano
   */
  get translatedStatus(): string {
    const statusMap: { [key: string]: string } = {
      'Currently Airing': 'In corso',
      'Finished Airing': 'Completato',
      'Not yet aired': 'Non ancora trasmesso',
      'On Hold': 'In pausa',
      'Cancelled': 'Cancellato'
    };
    
    return statusMap[this.animeDetails?.status] || this.animeDetails?.status || 'N/A';
  }

  /**
   * Determina la classe CSS per lo status badge
   */
  get statusClass(): string {
    const status = this.animeDetails?.status?.toLowerCase() || '';
    
    if (status.includes('airing')) return 'status-airing';
    if (status.includes('finished')) return 'status-finished';
    if (status.includes('not yet')) return 'status-upcoming';
    
    return 'status-default';
  }

  /**
   * Determina la classe CSS per il voto
   */
  get scoreClass(): string {
    const score = this.animeDetails?.score || 0;
    
    if (score >= 8) return 'score-excellent';
    if (score >= 7) return 'score-good';
    if (score >= 6) return 'score-average';
    
    return 'score-low';
  }

  /**
   * Verifica se ci sono generi da mostrare
   */
  get hasGenres(): boolean {
    return this.animeDetails?.genres && this.animeDetails.genres.length > 0;
  }

  /**
   * Verifica se ci sono servizi streaming
   */
  get hasStreamingServices(): boolean {
    return this.streamingServices && this.streamingServices.length > 0;
  }

  /**
   * Ottiene l'icona per il voto
   */
  get scoreIcon(): string {
    const score = this.animeDetails?.score || 0;
    
    if (score >= 8) return '🌟';
    if (score >= 7) return '⭐';
    if (score >= 6) return '✨';
    
    return '📊';
  }

  /**
   * Formatta il tipo di anime
   */
  get formattedType(): string {
    const typeMap: { [key: string]: string } = {
      'TV': 'Serie TV',
      'Movie': 'Film',
      'OVA': 'OVA',
      'ONA': 'ONA',
      'Special': 'Speciale',
      'Music': 'Video Musicale'
    };
    
    return typeMap[this.animeDetails?.type || ''] || this.animeDetails?.type || 'N/A';
  }

  /**
   * Ottiene i nomi degli studios
   */
  get studioNames(): string {
    if (!this.animeDetails?.studios || this.animeDetails.studios.length === 0) {
      return 'N/A';
    }
    
    return this.animeDetails.studios.map(s => s.name).join(', ');
  }

  /**
   * Traccia i generi per ngFor optimization
   */
  trackByGenreId(index: number, genre: Genre): number {
    return genre.mal_id;
  }

  /**
   * Traccia i servizi streaming per ngFor optimization
   */
  trackByServiceName(index: number, service: StreamingService): string {
    return service.name;
  }
}