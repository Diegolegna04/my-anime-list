import { Injectable, NgZone } from '@angular/core';

/**
 * Scrollbar della pagina in stile macOS, sovrapposta al contenuto.
 *
 * La scrollbar nativa di Windows/Linux occupa sempre una colonna a destra
 * (anche se trasparente), e header e footer si fermano prima lasciando una
 * striscia di sfondo. Quindi la nativa si nasconde (html.custom-scrollbar)
 * e qui si disegna un cursore in position: fixed che non prende spazio.
 * Compare quando si scorre o col mouse sul bordo destro e sparisce dopo
 * HIDE_DELAY_MS di inattività. Si trascina come quella nativa.
 *
 * Solo con mouse/trackpad: sui touch la scrollbar nativa è già sovrapposta.
 * L'aspetto è in styles.css (.page-scrollbar).
 */
@Injectable({ providedIn: 'root' })
export class AutoHideScrollbarService {
  static readonly HIDE_DELAY_MS = 1200;
  /** Altezza minima del cursore, per poterlo prendere anche su pagine lunghe */
  static readonly MIN_THUMB_PX = 32;
  /** Margine del binario dai bordi alto e basso della finestra */
  static readonly RAIL_INSET_PX = 4;

  private rail!: HTMLDivElement;
  private thumb!: HTMLDivElement;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private frame = 0;
  private hovering = false;
  private dragging = false;
  private thumbHeight = 0;
  private dragStartY = 0;
  private dragStartScroll = 0;

  constructor(private zone: NgZone) {}

  init(): void {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const root = document.documentElement;
    root.classList.add('custom-scrollbar');

    this.rail = document.createElement('div');
    this.rail.className = 'page-scrollbar';
    // Decorativa: tastiera e lettori di schermo scorrono con la pagina nativa
    this.rail.setAttribute('aria-hidden', 'true');
    this.thumb = document.createElement('div');
    this.thumb.className = 'page-scrollbar-thumb';
    this.rail.appendChild(this.thumb);
    // In testa al body: gli overlay dell'app con lo stesso z-index le passano sopra
    document.body.prepend(this.rail);

    // Fuori da Angular: scroll e movimenti del puntatore arrivano di continuo
    // e non cambiano nulla nei componenti
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', () => {
        this.scheduleUpdate();
        this.show();
      }, { passive: true });
      window.addEventListener('resize', () => this.scheduleUpdate());
      // Il contenuto cambia altezza a ogni navigazione e caricamento
      new ResizeObserver(() => this.scheduleUpdate()).observe(document.body);

      this.rail.addEventListener('pointerenter', () => {
        this.hovering = true;
        this.show();
      });
      this.rail.addEventListener('pointerleave', () => {
        this.hovering = false;
        this.scheduleHide();
      });

      this.thumb.addEventListener('pointerdown', (event) => this.startDrag(event));
      this.thumb.addEventListener('pointermove', (event) => this.drag(event));
      this.thumb.addEventListener('pointerup', (event) => this.endDrag(event));
      this.thumb.addEventListener('pointercancel', (event) => this.endDrag(event));

      // Clic sul binario fuori dal cursore: una schermata su o giù
      this.rail.addEventListener('pointerdown', (event) => {
        if (event.target !== this.rail) return;
        const direction = event.clientY < this.thumb.getBoundingClientRect().top ? -1 : 1;
        window.scrollBy({ top: direction * window.innerHeight * 0.9, behavior: 'smooth' });
      });
    });

    this.update();
  }

  private scheduleUpdate(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  }

  private update(): void {
    const scrollHeight = document.documentElement.scrollHeight;
    const viewHeight = window.innerHeight;
    const scrollable = scrollHeight > viewHeight + 1;
    this.rail.classList.toggle('is-inactive', !scrollable);
    if (!scrollable) return;

    const railHeight = viewHeight - AutoHideScrollbarService.RAIL_INSET_PX * 2;
    this.thumbHeight = Math.max(
      AutoHideScrollbarService.MIN_THUMB_PX,
      railHeight * (viewHeight / scrollHeight)
    );
    const progress = window.scrollY / (scrollHeight - viewHeight);
    const offset = Math.min(1, Math.max(0, progress)) * (railHeight - this.thumbHeight);

    this.thumb.style.height = `${this.thumbHeight}px`;
    this.thumb.style.transform = `translateY(${offset}px)`;
  }

  private startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.dragging = true;
    this.dragStartY = event.clientY;
    this.dragStartScroll = window.scrollY;
    this.thumb.setPointerCapture(event.pointerId);
    document.documentElement.classList.add('scrollbar-dragging');
    this.show();
  }

  private drag(event: PointerEvent): void {
    if (!this.dragging) return;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const trackRange =
      window.innerHeight - AutoHideScrollbarService.RAIL_INSET_PX * 2 - this.thumbHeight;
    if (trackRange <= 0) return;
    const delta = (event.clientY - this.dragStartY) * (scrollRange / trackRange);
    window.scrollTo({ top: this.dragStartScroll + delta, behavior: 'instant' });
  }

  private endDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.thumb.releasePointerCapture(event.pointerId);
    document.documentElement.classList.remove('scrollbar-dragging');
    this.scheduleHide();
  }

  private show(): void {
    this.rail.classList.add('is-visible');
    // Finché il mouse è sulla scrollbar o la si trascina non si nasconde
    if (this.hovering || this.dragging) {
      clearTimeout(this.hideTimer);
    } else {
      this.scheduleHide();
    }
  }

  private scheduleHide(): void {
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      if (!this.hovering && !this.dragging) this.rail.classList.remove('is-visible');
    }, AutoHideScrollbarService.HIDE_DELAY_MS);
  }
}
