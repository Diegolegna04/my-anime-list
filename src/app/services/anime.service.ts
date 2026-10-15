import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription, throwError, of, timer } from 'rxjs';
import { shareReplay, catchError, mergeMap, map, tap, finalize } from 'rxjs/operators';
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

  // Due corsie, entrambe in ordine di arrivo: la prioritaria si svuota per prima
  private priorityQueue: (() => void)[] = [];
  private requestQueue: (() => void)[] = [];
  private activeWorkers = 0;
  private readonly MAX_CONCURRENT_WORKERS = 2;

  private readonly BASE_INTERVAL_MS = 700;
  private currentIntervalMs = 700;
  private readonly MAX_INTERVAL_MS = 2500;
  private successStreak = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  private withRetry<T>(source: Observable<T>, maxRetries = 2): Observable<T> {
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
        }),
      );

    return tryOnce(source);
  }

  getPopularAnime(): Observable<any> {
    return this.withRetry(this.http.get(`${this.apiUrl}/top/anime`));
  }

  searchAnime(query: string, page = 1): Observable<any> {
    return this.withRetry(
      this.http.get(`${this.apiUrl}/anime?q=${encodeURIComponent(query)}&page=${page}`),
    );
  }

  /**
   * Anteprima mentre si scrive nella ricerca: pochi risultati, i più seguiti
   * prima. Niente retry: se la richiesta è lenta arriva comunque la prossima
   * battitura, e l'invio porta alla ricerca completa.
   */
  searchPreview(query: string, limit = 6): Observable<any[]> {
    const q = encodeURIComponent(query);
    return this.http
      .get<any>(`${this.apiUrl}/anime?q=${q}&limit=${limit}&order_by=members&sort=desc&sfw=true`)
      .pipe(map((response) => (response?.data ?? []).slice(0, limit)));
  }

  /** Una pagina dei top anime (home) */
  getTopAnime(page: number): Observable<JikanListResponse<AnimeData>> {
    return this.queuedGet(`/top/anime?page=${page}`, { priority: true });
  }

  /** Una pagina di anime di un genere, dai più votati */
  getAnimeByGenre(
    genreId: number,
    genreName: string,
    page: number,
  ): Observable<JikanListResponse<AnimeData>> {
    return this.queuedGet(
      `/anime?genres=${genreId}&genreName=${encodeURIComponent(genreName)}&page=${page}&order_by=score&sort=desc&limit=25`,
      { priority: true },
    );
  }

  /** Un anime a caso: mai in coda né in cache, ogni chiamata deve dare un risultato diverso */
  getRandomAnime(): Observable<JikanItemResponse<AnimeData>> {
    return this.withRetry(
      this.http.get<JikanItemResponse<AnimeData>>(`${this.apiUrl}/random/anime`),
      1,
    );
  }

  /** Dettaglio di un anime sempre fresco (senza cache): per la pagina di dettaglio */
  getAnimeDetails(id: number): Observable<JikanItemResponse<AnimeData>> {
    return this.queuedGet(`/anime/${id}`, { priority: true });
  }

  getRecommendations(id: number): Observable<JikanListResponse<AnimeRecommendation>> {
    return this.queuedGet(`/anime/${id}/recommendations`, { priority: true });
  }

  getStreaming(id: number): Observable<JikanListResponse<AnimeStreamingLink>> {
    return this.queuedGet(`/anime/${id}/streaming`, { priority: true });
  }

  getNews(id: number): Observable<JikanListResponse<AnimeNews>> {
    return this.queuedGet(`/anime/${id}/news`, { priority: true });
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
      return [...animeList].sort((a, b) => b.members - a.members);
    } else if (criteria === 'score') {
      return [...animeList].sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (criteria === 'date') {
      return [...animeList].sort((a, b) => {
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

    // refCount: quando l'ultimo sottoscrittore se ne va prima della risposta la
    // richiesta (in coda o in volo) viene annullata e la voce in memoria tolta,
    // cosi' chi chiede dopo ne avvia una nuova. A risposta arrivata la voce resta.
    let completed = false;
    const request$ = this.queuedGet<any>(`/anime/${id}`, { retryServerErrors: true }).pipe(
      tap((res) => this.writeToLocalStorage(id, res)),
      tap({ complete: () => (completed = true) }),
      finalize(() => {
        if (!completed) this.animeCache.delete(id);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError((err) => {
        this.animeCache.delete(id);
        return throwError(() => err);
      }),
    );

    this.animeCache.set(id, request$);
    return request$;
  }

  /**
   * GET sul proxy passando dalla coda (rispetta il rate limit di Jikan).
   * Su 429 ritenta e rallenta la coda; con `retryServerErrors` lo stesso vale
   * per 502/503/504 (solo per i dettagli in cache: gli altri endpoint non hanno
   * fallback e, con Jikan giu', devono fallire subito senza intasare la coda).
   * Con `priority` il lavoro passa davanti a quelli in attesa: le pagine non
   * aspettano l'arretrato delle liste (che chiedono un anime per voce).
   * Freddo: ogni sottoscrizione fa una richiesta; annullando la sottoscrizione
   * la richiesta in coda viene tolta e quella in volo annullata.
   */
  private queuedGet<T>(
    path: string,
    {
      retryServerErrors = false,
      priority = false,
    }: { retryServerErrors?: boolean; priority?: boolean } = {},
  ): Observable<T> {
    return new Observable<T>((observer) => {
      let pending: (() => void) | null = null;
      let inFlight: Subscription | null = null;

      const attempt = (retryCount = 0) => {
        const job = () => {
          pending = null;
          inFlight = this.http.get<T>(`${this.apiUrl}${path}`).subscribe({
            next: (res) => {
              this.onRequestSuccess();
              observer.next(res);
              observer.complete();
            },
            error: (err: HttpErrorResponse) => {
              const retryable =
                err.status === 429 || (retryServerErrors && [502, 503, 504].includes(err.status));
              if (retryable && retryCount < 4) {
                this.onRateLimitHit();
                attempt(retryCount + 1);
              } else {
                observer.error(err);
              }
            },
          });
        };
        pending = job;
        this.enqueue(job, priority);
      };

      attempt();

      return () => {
        if (pending) {
          const queue = priority ? this.priorityQueue : this.requestQueue;
          const i = queue.indexOf(pending);
          if (i >= 0) queue.splice(i, 1);
          pending = null;
        }
        inFlight?.unsubscribe();
      };
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
      localStorage.setItem(
        CACHE_PREFIX + id,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // localStorage pieno o non disponibile: non blocchiamo per questo
    }
  }

  private enqueue(fn: () => void, priority = false): void {
    (priority ? this.priorityQueue : this.requestQueue).push(fn);
    this.tryStartWorkers();
  }

  private tryStartWorkers(): void {
    while (
      this.activeWorkers < this.MAX_CONCURRENT_WORKERS &&
      this.priorityQueue.length + this.requestQueue.length > 0
    ) {
      this.activeWorkers++;
      this.runWorker();
    }
  }

  private runWorker(): void {
    const next = this.priorityQueue.shift() ?? this.requestQueue.shift();
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
