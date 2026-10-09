import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { shareReplay, catchError, mergeMap, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AnimeData,
  AnimeNews,
  AnimeRecommendation,
  AnimeStreamingLink,
  JikanItemResponse,
  JikanListResponse,
} from './anime.models';

const CACHE_PREFIX = 'animeCache:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AnimeService {
  private apiUrl = '/api/anime-proxy';

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
    return this.withRetry(this.http.get(`${this.apiUrl}/anime?q=${encodeURIComponent(query)}&page=${page}`));
  }

  /**
   * Anteprima mentre si scrive nella ricerca: pochi risultati, i più seguiti
   * prima. Niente retry: se la richiesta è lenta arriva comunque la prossima
   * battitura, e l'invio porta alla ricerca completa.
   */
  searchPreview(query: string, limit: number = 6): Observable<any[]> {
    const q = encodeURIComponent(query);
    return this.http
      .get<any>(`${this.apiUrl}/anime?q=${q}&limit=${limit}&order_by=members&sort=desc&sfw=true`)
      .pipe(map((response) => (response?.data ?? []).slice(0, limit)));
  }

  /** Una pagina dei top anime (home) */
  getTopAnime(page: number): Observable<JikanListResponse<AnimeData>> {
    return this.queuedGet(`/top/anime?page=${page}`);
  }

  /** Una pagina di anime di un genere, dai più votati */
  getAnimeByGenre(genreId: number, genreName: string, page: number): Observable<JikanListResponse<AnimeData>> {
    return this.queuedGet(
      `/anime?genres=${genreId}&genreName=${encodeURIComponent(genreName)}&page=${page}&order_by=score&sort=desc&limit=25`
    );
  }

  /** Un anime a caso: mai in coda né in cache, ogni chiamata deve dare un risultato diverso */
  getRandomAnime(): Observable<JikanItemResponse<AnimeData>> {
    return this.withRetry(this.http.get<JikanItemResponse<AnimeData>>(`${this.apiUrl}/random/anime`), 1);
  }

  getRecommendations(id: number): Observable<JikanListResponse<AnimeRecommendation>> {
    return this.queuedGet(`/anime/${id}/recommendations`);
  }

  getStreaming(id: number): Observable<JikanListResponse<AnimeStreamingLink>> {
    return this.queuedGet(`/anime/${id}/streaming`);
  }

  getNews(id: number): Observable<JikanListResponse<AnimeNews>> {
    return this.queuedGet(`/anime/${id}/news`);
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

    const request$ = this.queuedGet<any>(`/anime/${id}`).pipe(
      tap((res) => this.writeToLocalStorage(id, res)),
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((err) => {
        this.animeCache.delete(id);
        return throwError(() => err);
      })
    );

    this.animeCache.set(id, request$);
    return request$;
  }

  /**
   * GET sul proxy passando dalla coda (rispetta il rate limit di Jikan), con
   * nuovi tentativi e rallentamento su 429/502/503/504. Freddo: ogni
   * sottoscrizione fa una richiesta.
   */
  private queuedGet<T>(path: string): Observable<T> {
    return new Observable<T>((observer) => {
      const attempt = (retryCount: number = 0) => {
        this.enqueue(() => {
          this.http.get<T>(`${this.apiUrl}${path}`).subscribe({
            next: (res) => {
              this.onRequestSuccess();
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
    });
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
