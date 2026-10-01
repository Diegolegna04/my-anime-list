import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import {
  SeasonRef,
  currentSeason,
  fallbackSeasonStarted,
  isSeasonStarted,
  previousSeason,
  sameSeason,
  seasonOfList,
  seasonTransition,
  toIsoDate
} from './anime-utils';

export interface SeasonPage {
  data: any[];
  hasNextPage: boolean;
  /** true se la pagina arriva da seasons/now: le pagine successive vanno chieste lì */
  viaNow: boolean;
}

export interface ActiveSeason {
  season: SeasonRef;
  /** Prima pagina della stagione, già scaricata per decidere */
  list: any[];
}

@Injectable({ providedIn: 'root' })
export class SeasonService {
  private readonly baseUrl = '/api/anime-proxy/seasons';
  private active: { day: string; season$: Observable<ActiveSeason> } | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Una pagina di una stagione. Per la stagione in corso (o quella appena
   * finita) si prova prima seasons/now, che Jikan tiene in cache e risponde
   * anche quando le richieste anno/stagione danno 504. Ma seasons/now non
   * cambia esattamente il primo del mese, quindi si controlla di che stagione
   * sono davvero i dati e, se non è quella chiesta, si passa a
   * seasons/{anno}/{stagione} (che nel backend ha il fallback AniList).
   */
  getSeasonPage(target: SeasonRef, page: number = 1, viaNow?: boolean, today: Date = new Date()): Observable<SeasonPage> {
    const explicit$ = this.http
      .get<any>(`${this.baseUrl}/${target.year}/${target.season}?page=${page}`)
      .pipe(map(res => this.toPage(res, false)));

    const calendar = currentSeason(today);
    const tryNow = viaNow ?? (sameSeason(target, calendar) || sameSeason(target, previousSeason(calendar)));
    if (!tryNow) return explicit$;

    return this.http.get<any>(`${this.baseUrl}/now?page=${page}`).pipe(
      switchMap(res => {
        if (viaNow) return of(this.toPage(res, true));
        const listSeason = seasonOfList(res?.data || []);
        // Senza season/year nei dati (vecchio fallback AniList del backend) la
        // lista è quella del calendario
        const matches = listSeason ? sameSeason(listSeason, target) : sameSeason(target, calendar);
        return matches ? of(this.toPage(res, true)) : explicit$;
      }),
      catchError(() => explicit$)
    );
  }

  /**
   * La stagione da mostrare in home, con la sua prima pagina. Fuori dalla
   * finestra di cambio stagione è quella del calendario; dentro, quella nuova
   * solo quando i suoi titoli più attesi sono usciti davvero (isSeasonStarted).
   */
  resolveActiveSeason(today: Date = new Date()): Observable<ActiveSeason> {
    const day = toIsoDate(today);
    if (this.active?.day !== day) {
      this.active = { day, season$: this.computeActiveSeason(today).pipe(shareReplay(1)) };
    }
    return this.active.season$;
  }

  private computeActiveSeason(today: Date): Observable<ActiveSeason> {
    const transition = seasonTransition(today);
    if (!transition) {
      return this.firstPage(currentSeason(today), today);
    }

    const { incoming, outgoing } = transition;
    return this.getSeasonPage(incoming, 1, undefined, today).pipe(
      map(page => ({ ok: true as const, page })),
      catchError(() => of({ ok: false as const })),
      switchMap(result => {
        const started = result.ok ? isSeasonStarted(result.page.data, today) : fallbackSeasonStarted(today);
        if (!started) return this.firstPage(outgoing, today);
        return result.ok ? of({ season: incoming, list: result.page.data }) : this.firstPage(incoming, today);
      })
    );
  }

  private firstPage(season: SeasonRef, today: Date): Observable<ActiveSeason> {
    return this.getSeasonPage(season, 1, undefined, today).pipe(
      map(page => ({ season, list: page.data })),
      catchError(() => of({ season, list: [] }))
    );
  }

  private toPage(res: any, viaNow: boolean): SeasonPage {
    return {
      data: Array.isArray(res?.data) ? res.data : [],
      hasNextPage: res?.pagination?.has_next_page || false,
      viaNow
    };
  }
}
