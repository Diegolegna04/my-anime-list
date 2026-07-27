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

  // Intervallo base tra una richiesta e l'altra (~2 richieste/secondo)
  private readonly BASE_INTERVAL_MS = 500;
  // Se arriva un 429, rallentiamo temporaneamente l'intera coda invece
  // di lasciare che i singoli retry facciano di testa loro
  private currentIntervalMs = 500;
  private readonly MAX_INTERVAL_MS = 2000;

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
      const attempt = (retryCount: number = 0) => {
        // Ogni tentativo, incluso un retry dopo un 429, passa dalla STESSA coda:
        // niente più richieste "libere" che sfuggono al rate limit
        this.enqueue(() => {
          this.http.get(`${this.apiUrl}/anime/${id}`).subscribe({
            next: (res) => {
              this.onRequestSuccess();
              observer.next(res);
              observer.complete();
            },
            error: (err: HttpErrorResponse) => {
              if (err.status === 429 && retryCount < 4) {
                this.onRateLimitHit();
                attempt(retryCount + 1);
              } else {
                observer.error(err);
              }
            }
          });
        });
      };

      attempt();
    }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((err) => {
        this.animeCache.delete(id);
        return throwError(() => err);
      })
    );

    this.animeCache.set(id, request$);
    return request$;
  }

  private enqueue(fn: () => void): void {
    this.requestQueue.push(fn);
    this.processQueue();
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
      setTimeout(runNext, this.currentIntervalMs);
    };

    runNext();
  }

  private onRateLimitHit(): void {
    this.currentIntervalMs = Math.min(this.currentIntervalMs * 2, this.MAX_INTERVAL_MS);
  }

  private successStreak = 0;
  private onRequestSuccess(): void {
    this.successStreak++;
    if (this.successStreak >= 5 && this.currentIntervalMs > this.BASE_INTERVAL_MS) {
      this.currentIntervalMs = Math.max(this.BASE_INTERVAL_MS, this.currentIntervalMs / 2);
      this.successStreak = 0;
    }
  }
}
