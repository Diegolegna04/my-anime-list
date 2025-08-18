import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnimeService } from '../services/anime.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Theme, ThemeService } from '../services/theme.service';
import { Subscription } from 'rxjs';

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
  profileImage: string = 'assets/default-profile.png';
  username: string = 'Username';
  showDropdown: boolean = false;

  private authStatusSubscription!: Subscription;
  private userDataSubscription!: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private animeService: AnimeService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();

    // Sottoscrivi all'Observable dello stato di login
    this.authStatusSubscription = this.authService.accessoEffettuato$.subscribe(
      (isLoggedIn: boolean) => {
        this.accessoEffettuato = isLoggedIn;
        
        // Se non è loggato, resetta i dati
        if (!isLoggedIn) {
          this.username = 'Username';
          this.profileImage = 'assets/default-profile.png';
        }
      }
    );

    // Sottoscrivi ai dati dell'utente
    this.userDataSubscription = this.authService.userData$.subscribe(
      (userData) => {
        if (userData) {
          // Aggiorna i dati dell'utente dall'Observable
          this.username = userData.username || 'Username';
          this.profileImage = userData.profileImage || 'assets/default-profile.png';
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
  }

  logout(): void {
    this.authService.onLogout();
    this.showDropdown = false;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  searchAnime(): void {
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query.trim() } });
      this.query = '';
    }
  }

  goToGenres(): void {
    this.router.navigate(['/genres']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
  
  goToProfile(): void {
    if (this.accessoEffettuato) {
      this.router.navigate(['/profile']);
    } else {
      alert('Devi essere loggato per accedere al profilo.');
    }
    this.showDropdown = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.currentTheme = this.themeService.getCurrentTheme();
  }
}
