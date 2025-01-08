import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgForOf } from '@angular/common';
import { AnimeService } from '../services/anime.service';

@Component({
  selector: 'app-anime-by-genre',
  standalone: true,
  templateUrl: './anime-by-genre.component.html',
  styleUrls: ['./anime-by-genre.component.css'],
  imports: [NgForOf],
})
export class AnimeByGenreComponent implements OnInit {
  animeList: any[] = [];
  genreId: number | null = null;
  isGridView: boolean = true; // Variabile per alternare tra griglia e lista
  private animeByGenreUrl = 'https://api.jikan.moe/v4/anime';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private animeService: AnimeService
  ) {}

  ngOnInit(): void {
    this.genreId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAnimeByGenre();
  }

  loadAnimeByGenre(): void {
    if (this.genreId) {
      const url = `${this.animeByGenreUrl}?genres=${this.genreId}`;
      this.http.get<any>(url).subscribe((response) => {
        this.animeList = response.data;
      });
    }
  }

  toggleView(): void {
    this.isGridView = !this.isGridView; // Cambia la modalità di visualizzazione
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }
}
