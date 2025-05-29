import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {Router} from '@angular/router';

@Component({
  selector: 'app-anime-list',
  templateUrl: './anime-list.component.html',
  styleUrls: ['./anime-list.component.css'],
  imports: [],
  standalone: true
})
export class AnimeListComponent implements OnInit {
  animeList: any[] = [];
  private apiUrl = 'https://api.jikan.moe/v4/top/anime';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.fetchAnime();
  }

  fetchAnime(): void {
    this.http.get<any>(this.apiUrl).subscribe((response) => {
      this.animeList = response.data;
    });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/anime', id]); // Naviga alla pagina dei dettagli con l'ID
  }
}
