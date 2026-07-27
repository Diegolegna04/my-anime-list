import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { shareReplay, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class AnimeService {
  private apiUrl = 'https://api.jikan.moe/v4';
  private backendUrl = environment.apiUrl;

  private animeCache = new Map<string, Observable<any>>();

  private requestQueue: (() => void)[] = [];
  private isProcessingQueue = false;
  private readonly MIN_REQUEST_INTERVAL_MS = 400; // ~2.5 richieste/secondo, con margine di sicurezza

  constructor(private http: HttpClient, private router: Router) {}

  getPopularAnime(): Observable<any> {
    return this.http.get(`${this.apiUrl}/top/anime`);
  }

  searchAnime(query: string, page: number = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/anime?q=${query}&page=${page}`);
  }

  goToDetails(id: number): void {
    this.router.navigate(['/anime', id]);
  }

  goToLoginRegister(): void {
    this.router.navigate(['/register-login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

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
    return animeList;
  }

  getAnimeById(id: string): Observable<any> {
    if (this.animeCache.has(id)) {
      return this.animeCache.get(id)!;
    }

    const request$ = new Observable<any>((observer) => {
      const execute = (attempt: number = 0) => {
        this.http.get(`${this.apiUrl}/anime/${id}`).subscribe({
          next: (res) => {
            observer.next(res);
            observer.complete();
          },
          error: (err: HttpErrorResponse) => {
            // Se Jikan risponde 429, ritentiamo invece di far sparire l'anime silenziosamente
            if (err.status === 429 && attempt < 3) {
              const retryAfterHeader = err.headers?.get('Retry-After');
              const retryAfterMs = retryAfterHeader
                ? parseInt(retryAfterHeader, 10) * 1000
                : 1000 * (attempt + 1);

              setTimeout(() => execute(attempt + 1), retryAfterMs);
            } else {
              observer.error(err);
            }
          }
        });
      };

      // La richiesta entra in coda invece di partire subito
      this.requestQueue.push(() => execute());
      this.processQueue();
    }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((err) => {
        this.animeCache.delete(id); // Non teniamo in cache i fallimenti definitivi
        return throwError(() => err);
      })
    );

    this.animeCache.set(id, request$);
    return request$;
  }

  private processQueue(): void {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    const runNext = () => {
      const next = this.requestQueue.shift();
      if (!next) {
        this.isProcessingQueue = false;
        return;
      }
      next();
      setTimeout(runNext, this.MIN_REQUEST_INTERVAL_MS);
    };

    runNext();
  }
}