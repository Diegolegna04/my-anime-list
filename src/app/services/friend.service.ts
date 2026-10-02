import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LibraryEntry } from './userAnimeService.service';

/** Un amico accettato; id è quello dell'amicizia (serve per rimuoverla) */
export interface Friend {
  id: string;
  username: string;
  since: string | null;
}

/** Richiesta in sospeso, ricevuta o inviata */
export interface FriendRequestEntry {
  id: string;
  username: string;
  createdAt: string | null;
}

export interface FriendsOverview {
  friends: Friend[];
  incoming: FriendRequestEntry[];
  outgoing: FriendRequestEntry[];
}

export interface FriendStats {
  watchedCount: number;
  watchingCount: number;
  planToWatchCount: number;
  droppedCount: number;
  onHoldCount: number;
  favoritesCount: number;
}

/** Messaggio leggibile per un errore del backend, con un ripiego generico */
export function friendErrorMessage(error: HttpErrorResponse, fallback: string): string {
  return error?.error?.error || fallback;
}

@Injectable({ providedIn: 'root' })
export class FriendService {
  private readonly apiUrl = '/api/friends';

  constructor(private http: HttpClient) {}

  getOverview(): Observable<FriendsOverview> {
    return this.http.get<FriendsOverview>(this.apiUrl, { withCredentials: true });
  }

  sendRequest(username: string): Observable<FriendRequestEntry> {
    return this.http.post<FriendRequestEntry>(`${this.apiUrl}/requests`, { username }, { withCredentials: true });
  }

  accept(friendshipId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/requests/${friendshipId}/accept`, {}, { withCredentials: true });
  }

  /** Rifiuta, annulla o rimuove: per il backend è sempre cancellare l'amicizia */
  remove(friendshipId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${friendshipId}`, { withCredentials: true });
  }

  getLibrary(username: string): Observable<LibraryEntry[]> {
    return this.http.get<LibraryEntry[]>(`${this.apiUrl}/${encodeURIComponent(username)}/library`, { withCredentials: true });
  }

  getStats(username: string): Observable<FriendStats> {
    return this.http.get<FriendStats>(`${this.apiUrl}/${encodeURIComponent(username)}/stats`, { withCredentials: true });
  }
}
