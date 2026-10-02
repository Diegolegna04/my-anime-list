import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export type ListStatus = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

/** Etichetta, icona Font Awesome e token colore di ogni stato (segnalino sulle card) */
export const LIST_STATUS_META: Record<ListStatus, { label: string; icon: string; tone: string }> = {
  watching: { label: 'In visione', icon: 'fa-play', tone: 'var(--status-watching)' },
  completed: { label: 'Completato', icon: 'fa-check', tone: 'var(--status-completed)' },
  plan_to_watch: { label: 'Da vedere', icon: 'fa-bookmark', tone: 'var(--status-plan)' },
  on_hold: { label: 'In pausa', icon: 'fa-pause', tone: 'var(--status-on-hold)' },
  dropped: { label: 'Droppato', icon: 'fa-times', tone: 'var(--status-dropped)' }
};

/**
 * Quali anime sono nella lista dell'utente e con che stato, per mostrarlo
 * sulle card di tutto il sito. Si carica una volta al login (solo id e stato,
 * senza dettagli) e si aggiorna in locale quando lo stato cambia nel dettaglio.
 */
@Injectable({ providedIn: 'root' })
export class UserListService {
  private readonly statuses = signal<ReadonlyMap<number, ListStatus>>(new Map());

  constructor(private http: HttpClient, authService: AuthService) {
    authService.accessoEffettuato$.subscribe((loggedIn) => {
      if (loggedIn) {
        this.load();
      } else {
        this.statuses.set(new Map());
      }
    });
  }

  /** Stato dell'anime nella lista, oppure null se non c'è (letto da un signal: le card si aggiornano da sole) */
  statusOf(animeId: number | null | undefined): ListStatus | null {
    if (animeId == null) return null;
    return this.statuses().get(Number(animeId)) ?? null;
  }

  /** Da chiamare dopo un cambio di stato andato a buon fine; null = tolto dalla lista */
  setStatus(animeId: number, status: ListStatus | null): void {
    const next = new Map(this.statuses());
    if (status) {
      next.set(animeId, status);
    } else {
      next.delete(animeId);
    }
    this.statuses.set(next);
  }

  private load(): void {
    this.http.get<Array<{ animeId: number; status: ListStatus }>>('/api/user-anime/statuses', { withCredentials: true })
      .subscribe({
        next: (entries) => {
          const map = new Map<number, ListStatus>();
          for (const entry of entries ?? []) {
            if (entry.status in LIST_STATUS_META) map.set(Number(entry.animeId), entry.status);
          }
          this.statuses.set(map);
        },
        // Senza segnalini il sito funziona lo stesso: nessun messaggio all'utente
        error: () => this.statuses.set(new Map())
      });
  }
}
