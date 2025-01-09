import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf } from '@angular/common';
import { AnimeService } from '../services/anime.service';

@Component({
  selector: 'app-anime-details',
  templateUrl: './anime-details.component.html',
  styleUrls: ['./anime-details.component.css'],
  imports: [NgIf, NgForOf],
  standalone: true,
})
export class AnimeDetailsComponent implements OnInit {
  animeId: number = 0;
  animeDetails: any = null;
  recommendedAnime: any[] = [];
  displayedRecommendedAnime: any[] = [];
  animeToShow = 5;
  visto: string = "";
  preferito: boolean = false;

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
        var elencoVisti = localStorage.getItem('elencoVisti');
        if (elencoVisti) {
          var elencoVisti2: string[] = JSON.parse(elencoVisti)
          var res = elencoVisti2.indexOf(this.animeId.toString());
          if (res != -1) {
            this.visto = "si";
          }
          else {
            this.visto = "no";
          }
          console.log(res);
          console.log(elencoVisti2)
        }
        var elencoPreferiti = localStorage.getItem('elencoPreferiti');
        if (elencoPreferiti) {
          this.preferito = true;
        }
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

  onChangeVisti(event: any) {
    const target = event.target as HTMLSelectElement;
    const criteria = target.value;

    if (criteria == "si") {
      var elencoVisti = localStorage.getItem('elencoVisti');
      if (elencoVisti) {
        var elencoVisti2: string[] = JSON.parse(elencoVisti);
        var res = elencoVisti2.indexOf(this.animeId.toString());
        if (res == -1) {
          elencoVisti2.push(this.animeId.toString());
          localStorage.setItem('elencoVisti', JSON.stringify(elencoVisti2));
        }
      }
      else {
        localStorage.setItem('elencoVisti', JSON.stringify([this.animeId.toString()]));
      }
    }
    else if (criteria == "no") {
      var elencoVisti = localStorage.getItem('elencoVisti');
      if (elencoVisti) {
        var elencoVisti2: string[] = JSON.parse(elencoVisti);
        var res = elencoVisti2.indexOf(this.animeId.toString());
        if (res != -1) {
          elencoVisti2.splice(res, 1);
          localStorage.setItem('elencoVisti', JSON.stringify(elencoVisti2));
        }
      }
    }
    console.log(criteria)
  }
}
