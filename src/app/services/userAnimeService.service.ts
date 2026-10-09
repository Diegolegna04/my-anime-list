import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

/** Riassunto dell'anime incluso nella libreria (forma di Jikan, solo i campi usati dalle pagine) */
export interface LibraryAnimeSummary {
  mal_id: number;
  title?: string;
  title_english?: string | null;
  episodes?: number | null;
  type?: string;
  status?: string;
  images?: { jpg?: { image_url?: string | null; large_image_url?: string | null } };
}

export interface LibraryEntry {
  animeId: number;
  status: UserAnime['status'];
  episodesWatched: number;
  rating: number;
  isFavorite: boolean;
  inEvidenza: boolean;
  /** null se il backend non è riuscito a recuperarlo */
  anime: LibraryAnimeSummary | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserAnimeService {
  private apiUrl = '/api/user-anime';

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

  /**
   * Tutta la libreria in una richiesta, con titolo, copertina ed episodi già
   * inclusi in "anime" (forma di Jikan; null se il backend non l'ha trovato)
   */
  getLibrary(): Observable<LibraryEntry[]> {
    return this.http.get<LibraryEntry[]>(`${this.apiUrl}/library`, { withCredentials: true });
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
}
