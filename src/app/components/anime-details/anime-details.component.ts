import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { AnimeService } from '../../services/anime.service';
import { FormsModule } from '@angular/forms';

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

  private animeDetailUrl = 'https://api.jikan.moe/v4/anime';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.animeId = Number(params.get('id'));
      if (this.animeId) {
        this.loadAnimeDetails();
        this.loadRecommendedAnime();
        this.loadAnimeState();
        this.loadInEvidenza();
        this.loadStreaming();

        const statoWatching = JSON.parse(localStorage.getItem('statoWatching') || '{}');
        const elencoVisti = JSON.parse(localStorage.getItem('elencoVisti') || '[]');
        const elencoVoti = JSON.parse(localStorage.getItem('elencoVoti') || '{}');
        const elencoPreferiti = JSON.parse(localStorage.getItem('elencoPreferiti') || '[]');

        if (statoWatching[this.animeId]) {
          this.watching = true;
          this.episodiVisti = statoWatching[this.animeId];
        }
        this.visto = elencoVisti.includes(this.animeId.toString());
        this.voto = elencoVoti[this.animeId] || 0; // Default a 0 invece di null
        this.preferito = elencoPreferiti.includes(this.animeId.toString());
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

  // Carica i dettagli dell'anime
  loadAnimeDetails(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}`;
    this.http.get<any>(url).subscribe((response) => {
      this.animeDetails = response.data;
    });
  }

  // Carica gli anime consigliati
  loadRecommendedAnime(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}/recommendations`;
    this.http.get<any>(url).subscribe((response) => {
      this.recommendedAnime = response.data.map((rec: any) => rec.entry);
      this.updateDisplayedAnime();
    });
  }

  // Aggiorna la lista degli anime visibili
  updateDisplayedAnime(): void {
    this.displayedRecommendedAnime = this.recommendedAnime.slice(0, this.animeToShow);
  }

  // Carica altri anime
  loadMoreAnime(): void {
    this.animeToShow += 5;
    this.updateDisplayedAnime();
  }

  // Naviga ai dettagli di un anime raccomandato
  viewAnimeDetails(animeId: number): void {
    this.animeService.goToDetails(animeId);
  }

  // Funzione per contrassegnare come visto
  toggleVisto(): void {
    this.visto = !this.visto;
    this.updateElencoVistiLocalStorage(this.visto);
  
    if (this.visto && this.animeState === 'non visto') {
      this.setAnimeState('in visione');
    } else if (!this.visto && (this.animeState === 'in visione' || this.animeState === 'completato')) {
      this.setAnimeState('non visto');
    }
  }

  // Metodo aggiornato per il sistema di voto a stelle
  setVoto(rating: number): void {
    this.voto = rating;
    const elencoVoti = JSON.parse(localStorage.getItem('elencoVoti') || '{}');
    elencoVoti[this.animeId] = rating;
    localStorage.setItem('elencoVoti', JSON.stringify(elencoVoti));
    console.log(`Voto impostato a: ${rating}`);
  }

  // Nuovi metodi per gestire il sistema di voto a stelle
  onStarHover(rating: number): void {
    this.hoveredRating = rating;
  }

  onStarLeave(): void {
    this.hoveredRating = 0;
  }

  // Metodo helper per determinare la classe CSS delle stelle
  getStarClass(starNumber: number): string {
    const targetRating = this.hoveredRating > 0 ? this.hoveredRating : this.voto;
    
    if (starNumber <= targetRating) {
      return 'filled';
    } else if (starNumber - 0.5 === targetRating) {
      return 'half';
    }
    return '';
  }

  setPreferito(isPreferred: boolean): void {
    const elencoPreferiti = JSON.parse(localStorage.getItem('elencoPreferiti') || '[]');

    if (isPreferred && !elencoPreferiti.includes(this.animeId.toString())) {
      elencoPreferiti.push(this.animeId.toString());
    } else if (!isPreferred) {
      const index = elencoPreferiti.indexOf(this.animeId.toString());
      if (index !== -1) elencoPreferiti.splice(index, 1);
    }

    localStorage.setItem('elencoPreferiti', JSON.stringify(elencoPreferiti));
    this.preferito = isPreferred;
  }

  togglePreferito(): void {
    this.setPreferito(!this.preferito);
  }

  loadAnimeState(): void {
    const savedState = JSON.parse(localStorage.getItem('animeStates') || '{}');
    this.animeState = savedState[this.animeId]?.state || 'non visto';
    this.episodiVisti = savedState[this.animeId]?.episodiVisti || 0;
  }

  // Aggiorna lo stato dell'anime
  setAnimeState(state: string): void {
    if (state === 'completato') {
      this.episodiVisti = this.animeDetails.episodes;
      this.visto = true;
    } else if (state === 'non visto') {
      this.episodiVisti = 0;
      this.visto = false;
    } else if (state === 'in visione') {
      
      if (!this.visto && this.episodiVisti === 0) {
          this.visto = true;
      }
    }
  
    this.animeState = state;
    this.saveAnimeState();
    this.updateElencoVistiLocalStorage(this.visto);
  }

  updateElencoVistiLocalStorage(isVisto: boolean): void {
    const elencoVisti = JSON.parse(localStorage.getItem('elencoVisti') || '[]');
    const animeIdString = this.animeId.toString();
  
    if (isVisto && !elencoVisti.includes(animeIdString)) {
      elencoVisti.push(animeIdString);
    } else if (!isVisto && elencoVisti.includes(animeIdString)) {
      const index = elencoVisti.indexOf(animeIdString);
      if (index !== -1) {
        elencoVisti.splice(index, 1);
      }
    }
    localStorage.setItem('elencoVisti', JSON.stringify(elencoVisti));
  }

  // Aggiorna gli episodi visti
  updateEpisodiVisti(): void {
    if (this.animeState === 'in visione') {
      if (this.episodiVisti >= this.animeDetails.episodes) {
        // Se tutti gli episodi sono visti, cambia lo stato in "completato"
        this.setAnimeState('completato');
      }
      this.saveAnimeState();
    }
  }

  // Salva lo stato dell'anime nel localStorage
  saveAnimeState(): void {
    const savedState = JSON.parse(localStorage.getItem('animeStates') || '{}');
    savedState[this.animeId] = {
      state: this.animeState,
      episodiVisti: this.episodiVisti,
    };
    localStorage.setItem('animeStates', JSON.stringify(savedState));
  }

  translateText(): void {
    const apiUrl = 'https://api.mymemory.translated.net/get';
    const maxLength = 500;

    if (!this.animeDetails) return;

    // Funzione per tradurre un testo con MyMemory
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

            // Se tutte le parti sono state tradotte, chiamiamo la callback
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

    // Traduzione del titolo
    translate(this.animeDetails.title, (translatedTitle) => {
      this.animeDetails.title = translatedTitle;
    });

    // Traduzione della sinossi
    translate(this.animeDetails.synopsis, (translatedSynopsis) => {
      this.animeDetails.synopsis = translatedSynopsis;
    });
  }

  loadInEvidenza(): void {
    const inEvidenza = localStorage.getItem('inEvidenza');
    if (inEvidenza) {
      this.inEvidenza = JSON.parse(inEvidenza).includes(this.animeId.toString());
    } else {
      this.inEvidenza = false;
    }
  }

  toggleInEvidenza(): void {
    const inEvidenza = JSON.parse(localStorage.getItem('inEvidenza') || '[]');
    const animeIdString = this.animeId.toString();
    const index = inEvidenza.indexOf(animeIdString);

    if (index === -1) {
      // L'ID dell'anime non è presente, quindi aggiungilo
      inEvidenza.push(animeIdString);
    } else {
      // L'ID dell'anime è presente, quindi rimuovilo
      inEvidenza.splice(index, 1);
    }
    this.inEvidenza = !this.inEvidenza;
    localStorage.setItem('inEvidenza', JSON.stringify(inEvidenza));
  }
}
