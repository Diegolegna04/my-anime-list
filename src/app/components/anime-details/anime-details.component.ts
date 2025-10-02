import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AnimeService } from '../../services/anime.service';
import { UserAnime, UserAnimeService } from '../../services/userAnimeService.service';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-anime-details',
  templateUrl: './anime-details.component.html',
  styleUrls: ['./anime-details.component.css'],
  imports: [FormsModule, RouterLink],
  standalone: true,
})
export class AnimeDetailsComponent implements OnInit {
  animeId: number = 0;
  animeDetails: any = null;
  recommendedAnime: any[] = [];
  displayedRecommendedAnime: any[] = [];
  animeStreaming: any[] = [];
  animeToShow = 5;
  visto: boolean = false;
  voto: number = 0;
  preferito: boolean = false;
  watching: boolean = false;
  episodiVisti: number = 0;
  animeState: string = 'non visto';
  inEvidenza: boolean = false;
  hoveredRating: number = 0;
  userAnimeData: UserAnime | null = null;
  isLoadingUserData: boolean = true;
  titleLanguage: 'english' | 'original' = 'original';
  news: any[] = [];
  private animeDetailUrl = 'https://api.jikan.moe/v4/anime';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService,
    private userAnimeService: UserAnimeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
  
    this.route.paramMap.subscribe((params) => {
      this.animeId = Number(params.get('id'));
      if (this.animeId) {
        this.loadAnimeDetails();
        this.loadRecommendedAnime();
        this.loadUserAnimeData();
        this.loadStreaming();
        this.loadAnimeNews();
      }
    });
  }

  getDisplayedTitle(): string {
    if (!this.animeDetails) return '';
    if (this.titleLanguage === 'english') {
      return this.animeDetails.title_english || this.animeDetails.title;
    } else {
      return this.animeDetails.title || this.animeDetails.title_english;
    }
  }

  loadAnimeNews(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}/news`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.news = response.data || [];
      },
      error: (error) => {
        console.error('Errore nel caricamento delle news:', error);
        this.news = [];
      }
    });
  }

  loadStreaming(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}/streaming`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.animeStreaming = response.data;
        } else {
          this.animeStreaming = [];
          console.warn('Dati di streaming non validi o assenti:', response);
        }
      },
      error: (error) => {
        console.error('Errore nel caricamento dei servizi di streaming:', error);
        this.animeStreaming = [];
      }
    });
  }

  loadAnimeDetails(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}`;
    this.http.get<any>(url).subscribe((response) => {
      this.animeDetails = response.data;
    });
  }

  loadRecommendedAnime(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}/recommendations`;
    this.http.get<any>(url).subscribe((response) => {
      this.recommendedAnime = response.data.map((rec: any) => rec.entry);
      this.updateDisplayedAnime();
    });
  }

  updateDisplayedAnime(): void {
    this.displayedRecommendedAnime = this.recommendedAnime.slice(0, this.animeToShow);
  }

  loadMoreAnime(): void {
    this.animeToShow += 5;
    this.updateDisplayedAnime();
  }

  viewAnimeDetails(animeId: number): void {
    this.animeService.goToDetails(animeId);
  }

  // Carica i dati dell'anime utente dal backend
  loadUserAnimeData(): void {
    this.isLoadingUserData = true;
    
    this.userAnimeService.getAnimeStatus(this.animeId).subscribe({
      next: (userData) => {
        this.userAnimeData = userData;
        this.mapUserDataToLocalState(userData);
        this.isLoadingUserData = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        // Se l'anime non è presente nel database utente, inizializza con valori di default
        console.log('Anime non presente nei dati utente, usando valori di default');
        this.initializeDefaultState();
        this.isLoadingUserData = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Mappa i dati dal backend al formato locale del componente
  private mapUserDataToLocalState(userData: UserAnime): void {
    if (!userData) {
      this.initializeDefaultState();
      return;
    }

    // Mappatura degli stati
    const statusMap: { [key: string]: string } = {
      'watching': 'in visione',
      'completed': 'completato',
      'plan_to_watch': 'da vedere',
      'dropped': 'droppato',
      'on_hold': 'in pausa'
    };

    this.animeState = statusMap[userData.status] || 'non visto';
    this.voto = userData.rating || 0;
    this.preferito = userData.isFavorite || false;
    this.inEvidenza = userData.inEvidenza || false;
    this.episodiVisti = userData.episodesWatched || 0;
    
    // Logica per visto e watching
    this.visto = ['in visione', 'completato'].includes(this.animeState);
    this.watching = this.animeState === 'in visione';
  }

  private initializeDefaultState(): void {
    this.animeState = 'non visto';
    this.voto = 0;
    this.preferito = false;
    this.inEvidenza = false;
    this.episodiVisti = 0;
    this.visto = false;
    this.watching = false;
    this.userAnimeData = null;
  }

  // Aggiorna lo stato dell'anime nel backend
  setAnimeState(state: string): void {
    // Mappatura degli stati al formato backend
    const backendStatusMap: { [key: string]: string } = {
      'in visione': 'watching',
      'completato': 'completed',
      'da vedere': 'plan_to_watch',
      'droppato': 'dropped',
      'in pausa': 'on_hold',
      'non visto': 'plan_to_watch' // Default fallback
    };

    const backendStatus = backendStatusMap[state];
    const previousState = this.animeState;
    
    if (state === 'completato') {
      this.episodiVisti = this.animeDetails?.episodes || 0;
      this.visto = true;
    } else if (state === 'non visto') {
      this.episodiVisti = 0;
      this.visto = false;
      // Per "non visto", rimuoviamo l'anime dal database
      if (this.userAnimeData) {
        this.userAnimeService.removeAnime(this.animeId).subscribe({
          next: () => {
            this.initializeDefaultState();
            this.cdr.detectChanges();
          },
          error: (error) => console.error('Errore nella rimozione dell\'anime:', error)
        });
      }
      return;
    } else if (state === 'in visione') {
      if (!this.visto && this.episodiVisti === 0) {
        this.visto = true;
      }
    }

    this.animeState = state;

    this.userAnimeService.updateAnimeStatus(this.animeId, backendStatus).subscribe({
      next: (response) => {
        this.userAnimeData = response;
        // Mantieni i valori locali invece di sovrascriverli
        if (state === 'completato') {
          this.episodiVisti = response.episodesWatched;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Errore nell\'aggiornamento dello stato:', error);
        // Ripristina lo stato precedente in caso di errore
        this.animeState = previousState;
        this.cdr.detectChanges();
      }
    });
  }

  toggleVisto(): void {
    this.visto = !this.visto;
    
    if (this.visto && this.animeState === 'non visto') {
      this.setAnimeState('in visione');
    } else if (!this.visto && (this.animeState === 'in visione' || this.animeState === 'completato')) {
      this.setAnimeState('non visto');
    }
  }

  // Aggiorna il voto nel backend
  setVoto(rating: number): void {
    this.voto = rating;
    
    // Se l'anime non è ancora nel database, aggiungilo prima
    if (!this.userAnimeData) {
      // Imposta uno stato di default se necessario
      const defaultStatus = this.animeState !== 'non visto' ? this.animeState : 'in visione';
      this.setAnimeState(defaultStatus);
    }

    this.updateUserAnimeData({ rating });
  }

  onStarHover(rating: number): void {
    this.hoveredRating = rating;
  }

  onStarLeave(): void {
    this.hoveredRating = 0;
  }

  getStarClass(starNumber: number): string {
    const targetRating = this.hoveredRating > 0 ? this.hoveredRating : this.voto;
    
    if (starNumber <= targetRating) {
      return 'filled';
    } else if (starNumber - 0.5 === targetRating) {
      return 'half';
    }
    return '';
  }

  // Toggle preferito nel backend
  togglePreferito(): void {
    this.userAnimeService.toggleFavorite(this.animeId).subscribe({
      next: (response) => {
        this.preferito = response.isFavorite;
        this.userAnimeData = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Errore nel toggle preferito:', error);
      }
    });
  }

  // Toggle in evidenza nel backend
  toggleInEvidenza(): void {
    this.userAnimeService.toggleInEvidenza(this.animeId).subscribe({
      next: (response) => {
        this.inEvidenza = response.inEvidenza;
        this.userAnimeData = response;
        this.cdr.detectChanges();
        
        // Aggiorna la cache degli anime in evidenza
        this.userAnimeService.refreshInEvidenza();
      },
      error: (error) => {
        console.error('Errore nel toggle in evidenza:', error);
      }
    });
  }

  // Aggiorna episodi visti
  updateEpisodiVisti(): void {
    if (this.animeState === 'in visione') {
      // Valida il numero di episodi
      const maxEpisodes = this.animeDetails?.episodes || 0;
      if (this.episodiVisti < 0) {
        this.episodiVisti = 0;
      } else if (maxEpisodes > 0 && this.episodiVisti > maxEpisodes) {
        this.episodiVisti = maxEpisodes;
      }

      // Se tutti gli episodi sono visti, cambia lo stato in "completato"
      if (maxEpisodes > 0 && this.episodiVisti >= maxEpisodes) {
        this.setAnimeState('completato');
        return;
      }
      
      // Aggiorna solo gli episodi visti senza ricaricare tutti i dati
      this.updateUserAnimeData({ episodesWatched: this.episodiVisti });
    }
  }

  // Metodo helper per aggiornare dati specifici dell'anime utente
  private updateUserAnimeData(updateData: Partial<UserAnime>): void {
    // Se l'anime non è ancora nel DB → lo creiamo almeno con lo stato corrente
    if (!this.userAnimeData) {
      const defaultStatusMap: { [key: string]: string } = {
        'in visione': 'watching',
        'completato': 'completed',
        'da vedere': 'plan_to_watch',
        'droppato': 'dropped',
        'in pausa': 'on_hold',
        'non visto': 'plan_to_watch'
      };

      this.userAnimeService.updateAnimeStatus(this.animeId, defaultStatusMap[this.animeState]).subscribe({
        next: (created) => {
          this.userAnimeData = created;
          this.applyUpdate(updateData);
        },
        error: (err) => console.error('Errore creazione anime:', err)
      });
      return;
    }

    // Se esiste già, applica subito l'update
    this.applyUpdate(updateData);
  }

  translateText(): void {
    const apiUrl = 'https://api.mymemory.translated.net/get';
    const maxLength = 500;

    if (!this.animeDetails) return;

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

        this.http.get<any>(apiUrl, { params }).subscribe(
          (response) => {
            translatedParts[index] = response.responseData.translatedText;
            completedRequests++;

            if (completedRequests === parts.length) {
              callback(translatedParts.join(' '));
            }
          },
          (error) => {
            console.error('Errore nella traduzione:', error);
          }
        );
      });
    };

    translate(this.animeDetails.title, (translatedTitle) => {
      this.animeDetails.title = translatedTitle;
    });

    translate(this.animeDetails.synopsis, (translatedSynopsis) => {
      this.animeDetails.synopsis = translatedSynopsis;
    });
  }

  // Metodi di utilità per refresh dei dati
  refreshUserData(): void {
    this.loadUserAnimeData();
  }

  // Metodo per gestire il cambio di stato con validazione
  onStateChange(newState: string): void {
    if (newState !== this.animeState) {
      this.setAnimeState(newState);
    }
  }

  // Metodo per gestire il cambio di episodi visti con validazione
  onEpisodesChange(): void {
    const maxEpisodes = this.animeDetails?.episodes || 0;
    
    // Valida il numero di episodi
    if (this.episodiVisti < 0) {
      this.episodiVisti = 0;
    } else if (maxEpisodes > 0 && this.episodiVisti > maxEpisodes) {
      this.episodiVisti = maxEpisodes;
    }

    this.updateEpisodiVisti();
  }

  // Metodo per verificare se l'anime è nel database utente
  isAnimeInUserDatabase(): boolean {
    return this.userAnimeData !== null;
  }

  // Metodo per ottenere il testo dello stato attuale
  getStateDisplayText(): string {
    const stateTexts: { [key: string]: string } = {
      'non visto': 'Non visto',
      'in visione': 'In visione',
      'completato': 'Completato',
      'da vedere': 'Da vedere',
      'droppato': 'Droppato',
      'in pausa': 'In pausa'
    };
    
    return stateTexts[this.animeState] || 'Non visto';
  }

  // Funzione separata per applicare l'update giusto
  private applyUpdate(updateData: Partial<UserAnime>): void {
    if (updateData.rating !== undefined) {
      this.userAnimeService.updateRating(this.animeId, updateData.rating).subscribe({
        next: (response) => {
          this.userAnimeData = response;
          // Non sovrascrivere voto se l'utente sta ancora modificando
          if (this.voto !== updateData.rating) {
            this.voto = response.rating;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Errore aggiornamento rating:', err)
      });
    }

    if (updateData.episodesWatched !== undefined) {
      this.userAnimeService.updateEpisodesWatched(this.animeId, updateData.episodesWatched).subscribe({
        next: (response) => {
          this.userAnimeData = response;
          // Non sovrascrivere episodiVisti se l'utente sta ancora modificando
          if (this.episodiVisti !== updateData.episodesWatched) {
            this.episodiVisti = response.episodesWatched;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Errore aggiornamento episodi:', err);
          // In caso di errore, ripristina il valore dal backend
          this.loadUserAnimeData();
        }
      });
    }
  }
}
