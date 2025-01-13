import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AnimeService {
  private apiUrl = 'https://api.jikan.moe/v4';

  constructor(private http: HttpClient, private router: Router) {}

  // Ottieni una lista di anime popolari
  getPopularAnime(): Observable<any> {
    return this.http.get(`${this.apiUrl}/top/anime`);
  }

  // Cerca un anime
  searchAnime(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/anime?q=${query}`);
  }

  // Naviga alla pagina dei dettagli di un anime
  goToDetails(id: number): void {
    this.router.navigate(['/anime', id]);
  }

  // Naviga alla pagina di login/registrazione
  goToLoginRegister(): void {
    this.router.navigate(['/register-login']);
  }

  // Naviga alla home
  goToHome(): void {
    this.router.navigate(['/']);
  }

  // Ordina la lista degli anime
  sortAnime(animeList: any[], criteria: string): any[] {
    if (criteria === 'members') {
      return animeList.sort((a, b) => b.members - a.members);
    } else if (criteria === 'score') {
      return animeList.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (criteria === 'date') {
      return animeList.sort((a, b) => {
        const dateA = new Date(a.aired.from).getTime();
        const dateB = new Date(b.aired.from).getTime();
        return dateB - dateA;
      });
    }
    return animeList; // Ritorna la lista originale se il criterio non è valido
  }

  getAnimeById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/anime/${id}`);
  }
}
