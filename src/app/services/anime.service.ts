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
}
