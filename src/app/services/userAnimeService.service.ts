import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface UserAnime {
  id?: string;
  userId: string;
  animeId: number;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped' | 'on_hold';
  isFavorite: boolean;
  inEvidenza: boolean;
  evidenzaOrder: number;
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserAnimeService {
  private apiUrl = 'http://localhost:8080/api/user-anime';
  
  // BehaviorSubjects per cache reattiva
  private userStatsSubject = new BehaviorSubject<any>(null);
  public userStats$ = this.userStatsSubject.asObservable();
  
  private inEvidenzaSubject = new BehaviorSubject<any[]>([]);
  public inEvidenza$ = this.inEvidenzaSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Aggiorna stato anime
  updateAnimeStatus(animeId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/status`, { status }, { withCredentials: true });
  }

  // Toggle preferito
  toggleFavorite(animeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/favorite`, {}, { withCredentials: true });
  }

  // Toggle in evidenza
  toggleInEvidenza(animeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/evidenza`, {}, { withCredentials: true });
  }

  // Aggiorna ordine evidenza
  updateEvidenzaOrder(animeIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/evidenza/order`, { animeIds }, { withCredentials: true });
  }

  // Ottieni statistiche
  getUserStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`, { withCredentials: true });
  }

  // Ottieni anime in evidenza
  getInEvidenza(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evidenza`, { withCredentials: true });
  }

  // Ottieni anime per status
  getAnimeByStatus(status: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${status}`, { withCredentials: true });
  }

  // Ottieni preferiti
  getFavorites(): Observable<any> {
    return this.http.get(`${this.apiUrl}/favorites`, { withCredentials: true });
  }

  // Ottieni stato anime specifico
  getAnimeStatus(animeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${animeId}`, { withCredentials: true });
  }

  // Rimuovi anime
  removeAnime(animeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${animeId}`, { withCredentials: true });
  }

  // Metodi per aggiornare le cache locali
  refreshUserStats(): void {
    this.getUserStats().subscribe(stats => {
      this.userStatsSubject.next(stats);
    });
  }

  refreshInEvidenza(): void {
    this.getInEvidenza().subscribe(evidenza => {
      this.inEvidenzaSubject.next(evidenza);
    });
  }
}
