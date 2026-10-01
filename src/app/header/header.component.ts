import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnimeService } from '../services/anime.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Theme, ThemeService } from '../services/theme.service';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { LIST_STATUS_META, UserListService } from '../services/user-list.service';

/** Battute minime prima di chiedere l'anteprima, e attesa dopo l'ultima */
const SUGGEST_MIN_CHARS = 3;
const SUGGEST_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-header',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './header.component.html',
  standalone: true,
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  query: string = '';
  currentTheme: Theme = 'light';
  accessoEffettuato: boolean = false;
  profileImage: string = 'pfp-no-bg.png';
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private animeService: AnimeService,
    private authService: AuthService,
    private themeService: ThemeService,
    private elementRef: ElementRef<HTMLElement>,
    private userList: UserListService
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.setupSuggestions();
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
          this.profileImage = this.profileImage;
        }
      }
    );

    // Sottoscrivi ai dati dell'utente
    this.userDataSubscription = this.authService.userData$.subscribe(
      (userData) => {
        if (userData) {
          // Aggiorna i dati dell'utente dall'Observable
          this.username = userData.username || 'Username';
          this.profileImage = userData.profileImage || this.profileImage;
        } else {
          // Se userData è null, carica dal localStorage (fallback)
          this.loadProfileDetailsFromStorage();
        }
      }
    );
  }

  ngOnDestroy(): void {
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

  /** Titolo nella lingua scelta dall'utente nelle liste */
  suggestionTitle(anime: any): string {
    const english = localStorage.getItem('titleLanguage') === 'english';
    return (english ? anime.title_english : null) || anime.title || anime.title_english || '';
  }

  suggestionMeta(anime: any): string {
    const parts = [anime.type, anime.year || anime.aired?.prop?.from?.year].filter(Boolean);
    return parts.join(' · ');
  }

  suggestionBadge(anime: any) {
    const status = this.userList.statusOf(anime?.mal_id);
    return status ? LIST_STATUS_META[status] : null;
  }

  private resetSearch(): void {
    this.query = '';
    this.suggestions = [];
    this.closeSuggestions();
    this.query$.next('');
    this.closeMobileMenu();
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
