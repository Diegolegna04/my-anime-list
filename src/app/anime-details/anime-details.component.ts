import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf } from '@angular/common';
import { AnimeService } from '../services/anime.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-anime-details',
  templateUrl: './anime-details.component.html',
  styleUrls: ['./anime-details.component.css'],
  imports: [FormsModule, NgIf, NgForOf],
  standalone: true,
})
export class AnimeDetailsComponent implements OnInit {
  animeId: number = 0;
  animeDetails: any = null;
  recommendedAnime: any[] = [];
  displayedRecommendedAnime: any[] = [];
  animeToShow = 5;
  visto: boolean = false;
  voto: number | null = null;
  preferito: boolean = false;
  watching: boolean = false;
  episodiVisti: number = 0;
  animeState: string = 'non visto';

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

        const statoWatching = JSON.parse(localStorage.getItem('statoWatching') || '{}');
        const elencoVisti = JSON.parse(localStorage.getItem('elencoVisti') || '[]');
        const elencoVoti = JSON.parse(localStorage.getItem('elencoVoti') || '{}');
        const elencoPreferiti = JSON.parse(localStorage.getItem('elencoPreferiti') || '[]');

        if (statoWatching[this.animeId]) {
          this.watching = true;
          this.episodiVisti = statoWatching[this.animeId];
        }
        this.visto = elencoVisti.includes(this.animeId.toString());
        this.voto = elencoVoti[this.animeId] || null;
        this.preferito = elencoPreferiti.includes(this.animeId.toString());
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
    const elencoVisti = JSON.parse(localStorage.getItem('elencoVisti') || '[]');

    if (this.visto) {
      const index = elencoVisti.indexOf(this.animeId.toString());
      if (index !== -1) elencoVisti.splice(index, 1);
    } else {
      elencoVisti.push(this.animeId.toString());
    }

    localStorage.setItem('elencoVisti', JSON.stringify(elencoVisti));
    this.visto = !this.visto;
  }

  setVoto(value: number | null): void {
    this.voto = value;
    const elencoVoti = JSON.parse(localStorage.getItem('elencoVoti') || '{}');
    elencoVoti[this.animeId] = value;
    localStorage.setItem('elencoVoti', JSON.stringify(elencoVoti));
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
      // Se impostato su "completato", tutti gli episodi sono visti
      this.episodiVisti = this.animeDetails.episodes;
    } else if (state === 'non visto') {
      // Se impostato su "non visto", azzera gli episodi
      this.episodiVisti = 0;
    }

    this.animeState = state;
    this.saveAnimeState();
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
}
