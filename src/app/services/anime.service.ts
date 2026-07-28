import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { shareReplay, catchError, mergeMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';

const CACHE_PREFIX = 'animeCache:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AnimeService {
  private apiUrl = '/api/anime-proxy';
  private backendUrl = environment.apiUrl;

  private animeCache = new Map<string, Observable<any>>();

  private requestQueue: (() => void)[] = [];
  private activeWorkers = 0;
  private readonly MAX_CONCURRENT_WORKERS = 2;

  private readonly BASE_INTERVAL_MS = 700;
  private currentIntervalMs = 700;
  private readonly MAX_INTERVAL_MS = 2500;
  private successStreak = 0;

  constructor(private http: HttpClient, private router: Router) {}

  private withRetry<T>(source: Observable<T>, maxRetries: number = 2): Observable<T> {
    let attempts = 0;

    const tryOnce = (obs: Observable<T>): Observable<T> =>
      obs.pipe(
        catchError((err: HttpErrorResponse) => {
          const isRetryable = [502, 503, 504].includes(err.status);
          if (isRetryable && attempts < maxRetries) {
            attempts++;
            return timer(600 * attempts).pipe(mergeMap(() => tryOnce(obs)));
          }
          return throwError(() => err);
        })
      );

    return tryOnce(source);
  }

  getPopularAnime(): Observable<any> {
    return this.withRetry(this.http.get(`${this.apiUrl}/top/anime`));
  }

  searchAnime(query: string, page: number = 1): Observable<any> {
    return this.withRetry(this.http.get(`${this.apiUrl}/anime?q=${query}&page=${page}`));
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

    const cached = this.readFromLocalStorage(id);
    if (cached) {
      const cached$ = of(cached);
      this.animeCache.set(id, cached$);
      return cached$;
    }

    const request$ = new Observable<any>((observer) => {
      const attempt = (retryCount: number = 0) => {
        this.enqueue(() => {
          this.http.get(`${this.apiUrl}/anime/${id}`).subscribe({
            next: (res) => {
              this.onRequestSuccess();
              this.writeToLocalStorage(id, res);
              observer.next(res);
              observer.complete();
            },
            error: (err: HttpErrorResponse) => {
              if ((err.status === 429 || [502, 503, 504].includes(err.status)) && retryCount < 4) {
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

  private readFromLocalStorage(id: string): any | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + id);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_PREFIX + id);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  private writeToLocalStorage(id: string, data: any): void {
    try {
      localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {
      // localStorage pieno o non disponibile: non blocchiamo per questo
    }
  }

  private enqueue(fn: () => void): void {
    this.requestQueue.push(fn);
    this.tryStartWorkers();
  }

  private tryStartWorkers(): void {
    while (this.activeWorkers < this.MAX_CONCURRENT_WORKERS && this.requestQueue.length > 0) {
      this.activeWorkers++;
      this.runWorker();
    }
  }

  private runWorker(): void {
    const next = this.requestQueue.shift();
    if (!next) {
      this.activeWorkers--;
      return;
    }

    next();

    setTimeout(() => {
      this.activeWorkers--;
      this.tryStartWorkers();
    }, this.currentIntervalMs);
  }

  private onRateLimitHit(): void {
    this.currentIntervalMs = Math.min(this.currentIntervalMs * 2, this.MAX_INTERVAL_MS);
    this.successStreak = 0;
  }

  private onRequestSuccess(): void {
    this.successStreak++;
    if (this.successStreak >= 5 && this.currentIntervalMs > this.BASE_INTERVAL_MS) {
      this.currentIntervalMs = Math.max(this.BASE_INTERVAL_MS, this.currentIntervalMs / 2);
      this.successStreak = 0;
    }
  }
}
