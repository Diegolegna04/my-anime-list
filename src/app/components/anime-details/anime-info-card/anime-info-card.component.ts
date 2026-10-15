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

/**
 * Servizi che dall'Italia non si possono usare: attivi solo negli USA (Hulu, Tubi, Hoopla,
 * Adult Swim), canali YouTube bloccati fuori dall'Asia (Muse Asia, Ani-One) o chiusi
 * (Funimation, VRV). Né Jikan né AniList dicono in quali paesi vale un link: è una lista
 * di servizi noti, non un controllo del catalogo italiano.
 */
const NOT_IN_ITALY = ['hulu', 'tubi', 'hoopla', 'adult swim', 'funimation', 'vrv', 'muse asia', 'ani-one'];

export function isAvailableInItaly(service: StreamingService): boolean {
  const name = service.name.toLowerCase();
  return !NOT_IN_ITALY.some((blocked) => name.includes(blocked));
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
  studios?: { name: string }[];
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
  @Input() streamingStatus: 'loading' | 'ready' | 'error' = 'ready';

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
    const statusMap: Record<string, string> = {
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

  /** Link utilizzabili dall'Italia, mostrati come pulsanti */
  get italianServices(): StreamingService[] {
    return (this.streamingServices || []).filter(isAvailableInItaly);
  }

  /** Nomi dei servizi esteri, citati in una riga senza link */
  get foreignServiceNames(): string {
    const names = (this.streamingServices || [])
      .filter((service) => !isAvailableInItaly(service))
      .map((service) => service.name);
    return [...new Set(names)].join(', ');
  }

  /**
   * Ottiene l'icona Font Awesome per il voto
   */
  get scoreIcon(): string {
    const score = this.animeDetails?.score || 0;

    if (score >= 8) return 'fa-trophy';
    if (score >= 7) return 'fa-star';
    if (score >= 6) return 'fa-star-half-alt';

    return 'fa-chart-bar';
  }

  /**
   * Formatta il tipo di anime
   */
  get formattedType(): string {
    const typeMap: Record<string, string> = {
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
   * Traccia i generi per nome: quelli del ripiego AniList non hanno mal_id,
   * e con l'id la chiave risultava vuota e ripetuta (avviso NG0955)
   */
  trackByGenreName(index: number, genre: Genre): string {
    return genre.name;
  }

  /**
   * Traccia i servizi streaming per ngFor optimization
   */
  trackByServiceName(index: number, service: StreamingService): string {
    return service.name;
  }
}