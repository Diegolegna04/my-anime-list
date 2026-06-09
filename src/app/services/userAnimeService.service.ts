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
  episodesWatched: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserAnimeService {
  private apiUrl = '/api/user-anime';

  private userStatsSubject = new BehaviorSubject<any>(null);
  public userStats$ = this.userStatsSubject.asObservable();

  private inEvidenzaSubject = new BehaviorSubject<any[]>([]);
  public inEvidenza$ = this.inEvidenzaSubject.asObservable();

  constructor(private http: HttpClient) {}

  updateAnimeStatus(animeId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/status`, { status }, { withCredentials: true });
  }

  updateEpisodesWatched(animeId: number, episodesWatched: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/episodes`, { episodesWatched }, { withCredentials: true });
  }

  updateRating(animeId: number, rating: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/rating`, { rating }, { withCredentials: true });
  }

  toggleFavorite(animeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/favorite`, {}, { withCredentials: true });
  }

  toggleInEvidenza(animeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${animeId}/evidenza`, {}, { withCredentials: true });
  }

  updateEvidenzaOrder(animeIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/evidenza/order`, { animeIds }, { withCredentials: true });
  }

  getUserStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`, { withCredentials: true });
  }

  getInEvidenza(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evidenza`, { withCredentials: true });
  }

  getAnimeByStatus(status: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${status}`, { withCredentials: true });
  }

  getFavorites(): Observable<any> {
    return this.http.get(`${this.apiUrl}/favorites`, { withCredentials: true });
  }

  getAnimeStatus(animeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${animeId}`, { withCredentials: true });
  }

  removeAnime(animeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${animeId}`, { withCredentials: true });
  }

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
