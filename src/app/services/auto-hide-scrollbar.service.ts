import { Injectable, NgZone } from '@angular/core';

/**
 * Scrollbar della pagina in stile macOS: sottile e invisibile da ferma,
 * compare quando si scorre o quando il mouse arriva sul bordo destro e
 * sparisce dopo HIDE_DELAY_MS di inattività. Qui si mettono solo le classi
 * su <html>; l'aspetto è in styles.css (.autohide-scrollbar).
 */
@Injectable({ providedIn: 'root' })
export class AutoHideScrollbarService {
  static readonly HIDE_DELAY_MS = 1200;
  /** Larghezza della fascia sul bordo destro che conta come "sopra la scrollbar" */
  static readonly EDGE_PX = 16;

  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private pointerOnEdge = false;

  constructor(private zone: NgZone) {}

  init(): void {
    const root = document.documentElement;
    root.classList.add('autohide-scrollbar');

    // Fuori da Angular: scroll e mousemove arrivano di continuo e non
    // cambiano nulla nei componenti
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', () => this.show(), { passive: true });

      window.addEventListener('mousemove', (event: MouseEvent) => {
        const onEdge = event.clientX >= root.clientWidth - AutoHideScrollbarService.EDGE_PX;
        if (onEdge === this.pointerOnEdge) {
          if (onEdge) this.show();
          return;
        }
        this.pointerOnEdge = onEdge;
        onEdge ? this.show() : this.scheduleHide();
      }, { passive: true });

      document.documentElement.addEventListener('mouseleave', () => {
        this.pointerOnEdge = false;
        this.scheduleHide();
      });
    });
  }

  private show(): void {
    document.documentElement.classList.add('scrollbar-visible');
    // Finché il mouse resta sulla scrollbar non si nasconde
    if (this.pointerOnEdge) {
      clearTimeout(this.hideTimer);
    } else {
      this.scheduleHide();
    }
  }

  private scheduleHide(): void {
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      if (!this.pointerOnEdge) document.documentElement.classList.remove('scrollbar-visible');
    }, AutoHideScrollbarService.HIDE_DELAY_MS);
  }
}
