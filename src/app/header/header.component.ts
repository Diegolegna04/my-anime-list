import { Component, ElementRef, HostListener, NgZone, OnInit, OnDestroy } from '@angular/core';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnimeService } from '../services/anime.service';
import { CommonModule } from '@angular/common';
import { AuthService, DEFAULT_PROFILE_IMAGE } from '../services/auth.service';
import { Theme, ThemeService } from '../services/theme.service';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { SearchSuggestComponent } from './search-suggest/search-suggest.component';

/** Battute minime prima di chiedere l'anteprima, e attesa dopo l'ultima */
const SUGGEST_MIN_CHARS = 3;
const SUGGEST_DEBOUNCE_MS = 350;

/** Pausa nello scroll dopo la quale l'header a metà si aggancia aperto o chiuso */
const SCROLL_IDLE_MS = 120;

@Component({
  selector: 'app-header',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterLink,
    SearchSuggestComponent
  ],
  templateUrl: './header.component.html',
  standalone: true,
  styleUrls: ['./header.component.css'],
  host: {
    // Con il Tab si può entrare nell'header anche quando è nascosto: ricompare
    '(focusin)': 'reveal()'
  }
})
export class HeaderComponent implements OnInit, OnDestroy {
  query: string = '';
  currentTheme: Theme = 'light';
  accessoEffettuato: boolean = false;
  profileImage: string = DEFAULT_PROFILE_IMAGE;
  username: string = 'Username';
  showDropdown: boolean = false;
  showMobileMenu: boolean = false;

  // Anteprima dei risultati sotto la barra di ricerca
  suggestions: any[] = [];
  suggestOpen = false;
  suggestLoading = false;
  activeIndex = -1;
  private query$ = new Subject<string>();
  private suggestSubscription?: Subscription;
  private navigationSubscription?: Subscription;

  private authStatusSubscription!: Subscription;
  private userDataSubscription!: Subscription;

  /**
   * Pixel di header spinti fuori dallo schermo (0 = tutto visibile). Seguono lo
   * scroll uno a uno, come la barra del browser sul telefono: niente scatti a soglia.
   */
  private offset = 0;
  private lastScrollY = 0;
  private lastDirection = 0;
  private scrollFrame = 0;
  private idleTimer = 0;
  private touching = false;
  private readonly onScroll = () => {
    // Un solo aggiornamento per frame, fuori da Angular: si scrive solo lo stile dell'host
    if (!this.scrollFrame) {
      this.scrollFrame = requestAnimationFrame(() => {
        this.scrollFrame = 0;
        this.followScroll();
      });
    }
    clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => this.settle(), SCROLL_IDLE_MS);
  };
  private readonly onTouchStart = () => (this.touching = true);
  private readonly onTouchEnd = () => {
    this.touching = false;
    clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => this.settle(), SCROLL_IDLE_MS);
  };

  constructor(
    private router: Router,
    private animeService: AnimeService,
    private authService: AuthService,
    private themeService: ThemeService,
    private elementRef: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.setupSuggestions();
    this.lastScrollY = window.scrollY;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('touchstart', this.onTouchStart, { passive: true });
      window.addEventListener('touchend', this.onTouchEnd, { passive: true });
      window.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
    });
    // Cambiando pagina l'anteprima si chiude
    this.navigationSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.closeSuggestions());

    // Sottoscrivi all'Observable dello stato di login
    this.authStatusSubscription = this.authService.accessoEffettuato$.subscribe(
      (isLoggedIn: boolean) => {
        this.accessoEffettuato = isLoggedIn;
                
        // Se non è loggato, resetta i dati
        if (!isLoggedIn) {
          this.username = 'Username';
          this.profileImage = DEFAULT_PROFILE_IMAGE;
        }
      }
    );

    // Sottoscrivi ai dati dell'utente
    this.userDataSubscription = this.authService.userData$.subscribe(
      (userData) => {
        if (userData) {
          // Aggiorna i dati dell'utente dall'Observable
          this.username = userData.username || 'Username';
          this.profileImage = userData.profileImage || DEFAULT_PROFILE_IMAGE;
        } else {
          // Se userData è null, carica dal localStorage (fallback)
          this.loadProfileDetailsFromStorage();
        }
      }
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchcancel', this.onTouchEnd);
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
    clearTimeout(this.idleTimer);
    // Disiscriviti da entrambe le subscription
    if (this.authStatusSubscription) {
      this.authStatusSubscription.unsubscribe();
    }
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    this.suggestSubscription?.unsubscribe();
    this.navigationSubscription?.unsubscribe();
  }

  private setupSuggestions(): void {
    this.suggestSubscription = this.query$.pipe(
      map((q) => q.trim()),
      // Niente distinctUntilChanged: cancellando e riscrivendo la stessa parola
      // l'anteprima (chiusa nel frattempo) deve ricomparire
      debounceTime(SUGGEST_DEBOUNCE_MS),
      switchMap((q) => {
        if (q.length < SUGGEST_MIN_CHARS) return of({ q, list: null as any[] | null });
        this.suggestLoading = true;
        this.suggestOpen = true;
        return this.animeService.searchPreview(q).pipe(
          map((list) => ({ q, list })),
          catchError(() => of({ q, list: [] as any[] }))
        );
      })
    ).subscribe(({ q, list }) => {
      // Una risposta arrivata dopo che la parola è cambiata (o è stata inviata) non conta
      if (list === null || q !== this.query.trim()) return;
      this.suggestions = list;
      this.suggestLoading = false;
      this.activeIndex = -1;
    });
  }

  /** Ogni battuta: l'anteprima parte dopo una breve pausa */
  onQueryChange(value: string): void {
    this.query = value;
    if (value.trim().length < SUGGEST_MIN_CHARS) this.closeSuggestions();
    this.query$.next(value);
  }

  /** Frecce per scegliere, Invio per aprire quello scelto (o tutti i risultati), Esc per chiudere */
  onSearchKeydown(event: KeyboardEvent): void {
    if (!this.suggestOpen) return;
    const count = this.suggestions.length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % count;
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      this.activeIndex = this.activeIndex <= 0 ? count - 1 : this.activeIndex - 1;
    } else if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      this.openSuggestion(this.suggestions[this.activeIndex]);
    } else if (event.key === 'Escape') {
      this.closeSuggestions();
    }
  }

  /** Tornando sul campo, l'anteprima già caricata per la stessa parola si riapre */
  onSearchFocus(): void {
    if (this.query.trim().length >= SUGGEST_MIN_CHARS && this.suggestions.length) {
      this.suggestOpen = true;
    }
  }

  openSuggestion(anime: any): void {
    this.router.navigate(['/anime', anime.mal_id]);
    this.resetSearch();
  }

  closeSuggestions(): void {
    this.suggestOpen = false;
    this.suggestLoading = false;
    this.activeIndex = -1;
  }

  private resetSearch(): void {
    this.query = '';
    this.suggestions = [];
    this.closeSuggestions();
    this.query$.next('');
    this.closeMobileMenu();
    // Altrimenti il campo resta attivo e su telefono la tastiera copre i risultati
    (document.activeElement as HTMLElement | null)?.blur();
  }

  // Metodo fallback per caricare dal localStorage
  private loadProfileDetailsFromStorage(): void {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      this.profileImage = savedImage;
    }

    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      this.username = savedUsername;
    }
  }

  goToLoginRegister(): void {
    this.router.navigate(['/register-login']);
    this.showDropdown = false;
    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.onLogout();
    this.showDropdown = false;
    this.closeMobileMenu();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Scendendo l'header esce verso l'alto di quanto si è scrollato, salendo rientra
   * allo stesso modo. Resta fermo se c'è qualcosa di aperto o il focus è dentro.
   */
  private followScroll(): void {
    // Il rimbalzo di iOS oltre la cima o il fondo non conta come scroll
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y = Math.min(Math.max(0, window.scrollY), maxY);
    const delta = y - this.lastScrollY;
    this.lastScrollY = y;
    if (delta) this.lastDirection = Math.sign(delta);

    if (this.mustStayVisible()) {
      this.setOffset(0, true);
      return;
    }
    const height = this.elementRef.nativeElement.offsetHeight;
    // Vicino alla cima non si nasconde più di quanto la pagina è scesa: esce insieme al contenuto
    this.setOffset(Math.min(Math.max(this.offset + delta, 0), height, y), false);
  }

  /** A scroll fermo (e dito alzato) un header a metà si chiude o si riapre del tutto */
  private settle(): void {
    if (this.touching) return;
    const height = this.elementRef.nativeElement.offsetHeight;
    if (this.offset === 0 || this.offset >= height) return;
    // Vince la direzione dell'ultimo movimento: chi risale lo vuole vedere, chi scende no.
    // Un quarto di header fa da margine contro i pochi pixel di un dito appoggiato
    const threshold = this.lastDirection > 0 ? height / 4 : (height * 3) / 4;
    const hide = this.offset > threshold && this.lastScrollY >= height && !this.mustStayVisible();
    this.setOffset(hide ? height : 0, true);
  }

  /**
   * Scrive lo spostamento direttamente sull'host, senza change detection. Il transform
   * c'è solo da spostato: uno sempre attivo confinerebbe il menu mobile (position: fixed)
   * nell'header. La transizione serve solo all'aggancio finale, non mentre si segue il dito.
   */
  private setOffset(value: number, animate: boolean): void {
    const host = this.elementRef.nativeElement;
    host.classList.toggle('header-settling', animate);
    if (value === this.offset) return;
    this.offset = value;
    host.style.transform = value ? `translate3d(0, ${-value}px, 0)` : '';
  }

  private mustStayVisible(): boolean {
    // Solo il focus da tastiera (o il campo di ricerca): dopo un clic su un pulsante
    // il focus resta lì, ma l'header deve potersi nascondere lo stesso
    const focused = document.activeElement;
    const keyboardFocusInside = !!focused && this.elementRef.nativeElement.contains(focused)
      && focused.matches(':focus-visible');
    return this.showMobileMenu || this.showDropdown || this.suggestOpen || keyboardFocusInside;
  }

  reveal(animate = true): void {
    this.setOffset(0, animate);
  }

  /** Esc chiude menu del profilo e menu mobile */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showDropdown = false;
    this.closeSuggestions();
    if (this.showMobileMenu) this.closeMobileMenu();
  }

  /** Un clic fuori dal menu del profilo lo chiude */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.suggestOpen && !(target instanceof Element && target.closest('.search-form'))) {
      this.closeSuggestions();
    }
    if (!this.showDropdown) return;
    const container = this.elementRef.nativeElement.querySelector('.profile-menu-container');
    if (container && !container.contains(target)) this.showDropdown = false;
  }

  // Mobile menu methods
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    // Subito, senza transizione: durante l'animazione il transform confinerebbe l'overlay del menu
    this.reveal(false);

    // Prevent body scrolling when menu is open
    if (this.showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
    document.body.style.overflow = '';
  }

  searchAnime(): void {
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query.trim() } });
      this.resetSearch();
    }
  }

  goToGenres(): void {
    this.router.navigate(['/genres']);
    this.closeMobileMenu();
  }

  goToHome(): void {
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }
    
  goToProfile(): void {
    if (this.accessoEffettuato) {
      this.router.navigate(['/profile']);
    } else {
      alert('Devi essere loggato per accedere al profilo.');
    }
    this.showDropdown = false;
    this.closeMobileMenu();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.currentTheme = this.themeService.getCurrentTheme();
  }
}
