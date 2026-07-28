import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AnimeService } from '../../services/anime.service';
import { UserAnime, UserAnimeService } from '../../services/userAnimeService.service';
import { AnimeInfoCardComponent } from './anime-info-card/anime-info-card.component';
import { AnimeStateManagerComponent, AnimeState } from './anime-state-manager/anime-state-manager.component';
import { EpisodesTrackerComponent } from './episodes-tracker/episodes-tracker.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { FavoriteToggleComponent } from './favorite-toggle/favorite-toggle.component';
import { NewsListComponent } from './news-list/news-list.component';
import { RecommendedAnimeSidebarComponent } from './recommended-anime-sidebar/recommended-anime-sidebar.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-anime-details',
  templateUrl: './anime-details.component.html',
  styleUrls: ['./anime-details.component.css'],
  imports: [
    CommonModule,
    RouterLink,
    AnimeInfoCardComponent,
    AnimeStateManagerComponent,
    EpisodesTrackerComponent,
    StarRatingComponent,
    FavoriteToggleComponent,
    NewsListComponent,
    RecommendedAnimeSidebarComponent
  ],
  standalone: true,
})

export class AnimeDetailsComponent implements OnInit, OnDestroy {
  
  animeId: number = 0;
  animeDetails: any = null;
  recommendedAnime: any[] = [];
  animeStreaming: any[] = [];
  news: any[] = [];
  userAnimeData: UserAnime | null = null;
  animeState: AnimeState = 'non visto';
  voto: number = 0;
  preferito: boolean = false;
  episodiVisti: number = 0;
  inEvidenza: boolean = false;
  titleLanguage: 'english' | 'original' = 'original';
  isTranslating: boolean = false;
  isLoadingUserData: boolean = true;
  isLoadingAnimeData: boolean = true;
  private readonly animeDetailUrl = '/api/anime-proxy/anime';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService,
    private userAnimeService: UserAnimeService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeTitleLanguage();
    this.subscribeToRouteChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTitleLanguage(): void {
    this.titleLanguage = (localStorage.getItem('titleLanguage') as 'english' | 'original') || 'original';
  }

  private subscribeToRouteChanges(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = Number(params.get('id'));
        if (id && id !== this.animeId) {
          this.animeId = id;
          this.loadAllData();
        }
      });
  }

  private loadAllData(): void {
    this.isLoadingAnimeData = true;
    this.isLoadingUserData = true;
    this.loadAnimeDetails();
    this.loadRecommendedAnime();
    this.loadStreaming();
    this.loadAnimeNews();
    this.loadUserAnimeData();
  }

  private loadAnimeDetails(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}`;

    this.http.get<any>(url)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingAnimeData = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.animeDetails = response.data;
        },
        error: (error) => {
          console.error('Errore caricamento anime:', error);
          this.animeDetails = null;
        }
      });
  }

  private loadRecommendedAnime(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}/recommendations`;

    this.http.get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recommendedAnime = response.data.map((rec: any) => rec.entry);
        },
        error: (error) => {
          console.error('Errore caricamento raccomandazioni:', error);
          this.recommendedAnime = [];
        }
      });
  }

  private loadStreaming(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}/streaming`;

    this.http.get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.animeStreaming = Array.isArray(response.data) ? response.data : [];
        },
        error: (error) => {
          console.error('Errore caricamento streaming:', error);
          this.animeStreaming = [];
        }
      });
  }

  private loadAnimeNews(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}/news`;

    this.http.get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.news = response.data || [];
        },
        error: (error) => {
          console.error('Errore caricamento news:', error);
          this.news = [];
        }
      });
  }

  private loadUserAnimeData(): void {
    this.isLoadingUserData = true;

    this.userAnimeService.getAnimeStatus(this.animeId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingUserData = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (userData) => {
          this.mapUserDataToLocalState(userData);
        },
        error: () => {
          this.initializeDefaultState();
        }
      });
  }

  private mapUserDataToLocalState(userData: UserAnime): void {
    if (!userData) {
      this.initializeDefaultState();
      return;
    }

    const statusMap: { [key: string]: AnimeState } = {
      'watching': 'in visione',
      'completed': 'completato',
      'plan_to_watch': 'da vedere',
      'dropped': 'droppato',
      'on_hold': 'in pausa'
    };

    this.userAnimeData = userData;
    this.animeState = statusMap[userData.status] || 'non visto';
    this.voto = userData.rating || 0;
    this.preferito = userData.isFavorite || false;
    this.inEvidenza = userData.inEvidenza || false;
    this.episodiVisti = userData.episodesWatched || 0;
  }

  private initializeDefaultState(): void {
    this.userAnimeData = null;
    this.animeState = 'non visto';
    this.voto = 0;
    this.preferito = false;
    this.inEvidenza = false;
    this.episodiVisti = 0;
  }

  getDisplayedTitle(): string {
    if (!this.animeDetails) return '';
    if (this.titleLanguage === 'english') {
      return this.animeDetails.title_english || this.animeDetails.title;
    } else {
      return this.animeDetails.title || this.animeDetails.title_english;
    }
  }

  onTranslateRequested(): void {
    if (this.isTranslating || !this.animeDetails) return;
    this.isTranslating = true;
    this.translateText();
  }

  private translateText(): void {
    const apiUrl = 'https://api.mymemory.translated.net/get';
    const maxLength = 500;

    const translate = (text: string, callback: (translated: string) => void) => {
      if (!text) return;

      const parts: string[] = [];
      for (let i = 0; i < text.length; i += maxLength) {
        parts.push(text.substring(i, i + maxLength));
      }

      const translatedParts: string[] = [];
      let completedRequests = 0;

      parts.forEach((part, index) => {
        const params = { q: part, langpair: 'en|it' };

        this.http.get<any>(apiUrl, { params })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              translatedParts[index] = response.responseData.translatedText;
              completedRequests++;
              if (completedRequests === parts.length) {
                callback(translatedParts.join(' '));
              }
            },
            error: (error) => {
              console.error('Errore nella traduzione:', error);
              this.isTranslating = false;
              this.cdr.markForCheck();
            }
          });
      });
    };

    let completedTranslations = 0;
    const checkComplete = () => {
      completedTranslations++;
      if (completedTranslations === 2) {
        this.isTranslating = false;
        this.cdr.markForCheck();
      }
    };

    translate(this.animeDetails.title, (translatedTitle) => {
      this.animeDetails.title = translatedTitle;
      checkComplete();
    });

    translate(this.animeDetails.synopsis, (translatedSynopsis) => {
      this.animeDetails.synopsis = translatedSynopsis;
      checkComplete();
    });
  }

  onStateChanged(newState: AnimeState): void {
    const backendStatusMap: { [key in AnimeState]: string } = {
      'in visione': 'watching',
      'completato': 'completed',
      'da vedere': 'plan_to_watch',
      'droppato': 'dropped',
      'in pausa': 'on_hold',
      'non visto': 'plan_to_watch'
    };

    const backendStatus = backendStatusMap[newState];
    const previousState = this.animeState;

    if (newState === 'non visto' && this.userAnimeData) {
      this.removeAnimeFromDatabase(previousState);
      return;
    }

    this.animeState = newState;

    this.userAnimeService.updateAnimeStatus(this.animeId, backendStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.userAnimeData = response;

          if (newState === 'completato') {
            // Usa i dettagli già caricati se disponibili,
            // altrimenti li recupera da Jikan prima di aggiornare
            if (this.animeDetails?.episodes > 0) {
              this.syncCompletedEpisodes(this.animeDetails.episodes);
            } else {
              this.http.get<any>(`${this.animeDetailUrl}/${this.animeId}`)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (res) => {
                    const totalEpisodes = res.data?.episodes || 0;
                    if (totalEpisodes > 0) {
                      this.animeDetails = res.data;
                      this.syncCompletedEpisodes(totalEpisodes);
                    }
                  },
                  error: () => {
                    console.error('Impossibile recuperare il numero di episodi');
                  }
                });
            }
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Errore aggiornamento stato:', error);
          this.animeState = previousState;
          this.cdr.markForCheck();
        }
      });
  }

  // Aggiorna episodi sia in memoria che nel DB
  private syncCompletedEpisodes(totalEpisodes: number): void {
    this.episodiVisti = totalEpisodes;
    this.userAnimeService.updateEpisodesWatched(this.animeId, totalEpisodes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAnime) => {
          this.userAnimeData = updatedAnime;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Errore aggiornamento episodi al completamento:', error);
        }
      });
  }

  private removeAnimeFromDatabase(previousState: AnimeState): void {
    this.userAnimeService.removeAnime(this.animeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.initializeDefaultState();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Errore rimozione anime:', error);
          this.animeState = previousState;
          this.cdr.markForCheck();
        }
      });
  }

  onEpisodesUpdated(episodes: number): void {
    this.episodiVisti = episodes;

    const maxEpisodes = this.animeDetails?.episodes || 0;

    if (maxEpisodes > 0 && episodes >= maxEpisodes) {
      this.onStateChanged('completato');
      return;
    }

    this.updateEpisodesInDatabase(episodes);
  }

  private updateEpisodesInDatabase(episodes: number): void {
    if (!this.userAnimeData && this.animeState === 'non visto') {
      this.onStateChanged('in visione');
    }

    this.userAnimeService.updateEpisodesWatched(this.animeId, episodes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.userAnimeData = response;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Errore aggiornamento episodi:', error);
          this.loadUserAnimeData();
        }
      });
  }

  onRatingChanged(rating: number): void {
    // Voto consentito solo se l'anime è completato
    if (this.animeState !== 'completato') return;

    this.voto = rating;

    this.userAnimeService.updateRating(this.animeId, rating)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.userAnimeData = response;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Errore aggiornamento voto:', error);
        }
      });
  }

  onFavoriteToggled(): void {
    this.userAnimeService.toggleFavorite(this.animeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.preferito = response.isFavorite;
          this.userAnimeData = response;
          this.toastService.show(
            response.isFavorite ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti',
            'success'
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.show('Errore durante l\'aggiornamento dei preferiti', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  onInEvidenzaChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onInEvidenzaToggled(target.checked);
  }

  onInEvidenzaToggled(value: boolean): void {
    this.inEvidenza = value;
  
    this.userAnimeService.toggleInEvidenza(this.animeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.inEvidenza = response.inEvidenza;
          this.userAnimeData = response;
          this.userAnimeService.refreshInEvidenza();
          this.toastService.show(
            response.inEvidenza ? 'Aggiunto in evidenza' : 'Rimosso dall\'evidenza',
            'success'
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.show('Errore durante l\'aggiornamento dell\'evidenza', 'error');
          this.inEvidenza = !value;
          this.cdr.markForCheck();
        }
      });
  }

  onRecommendedAnimeClick(animeId: number): void {
    this.animeService.goToDetails(animeId);
  }

  get showEpisodesTracker(): boolean {
    return this.animeState === 'in visione';
  }

  // Rating visibile solo se completato
  get showRating(): boolean {
    return this.animeState === 'completato';
  }

  get showFavoriteToggle(): boolean {
    return ['in visione', 'completato'].includes(this.animeState) && this.voto >= 8;
  }

  get showInEvidenza(): boolean {
    return ['in visione', 'completato'].includes(this.animeState) || this.episodiVisti >= 5;
  }

  get canFavorite(): boolean {
    return this.voto >= 8;
  }
}
