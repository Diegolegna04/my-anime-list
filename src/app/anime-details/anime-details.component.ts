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
  animeId: number | null = null;
  animeDetails: any = null;
  recommendedAnime: any[] = [];
  displayedRecommendedAnime: any[] = [];
  animeToShow = 5;

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
}
