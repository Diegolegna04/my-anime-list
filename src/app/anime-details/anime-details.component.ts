import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-anime-details',
  templateUrl: './anime-details.component.html',
  styleUrls: ['./anime-details.component.css'],
  imports: [
    NgIf,
    NgForOf
  ],
  standalone: true
})
export class AnimeDetailsComponent implements OnInit {
  animeId: number | null = null;
  animeDetails: any = null;

  private animeDetailUrl = 'https://api.jikan.moe/v4/anime';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.animeId = Number(params.get('id')); // Ottieni l'ID dal routing
      if (this.animeId) {
        this.loadAnimeDetails();
      }
    });
  }

  loadAnimeDetails(): void {
    const url = `${this.animeDetailUrl}/${this.animeId}`;
    this.http.get<any>(url).subscribe((response) => {
      this.animeDetails = response.data;
    });
  }
}
