import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnimeService } from '../services/anime.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

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
  // ... (proprietà esistenti come showSearchBar, query, ecc.) ...
  showSearchBar: boolean = false;
  query: string = '';

  accessoEffettuato: boolean = false; // Sarà impostato a true in ngOnInit
  profileImage: string = 'assets/default-profile.png';
  username: string = 'Username';
  showDropdown: boolean = false;

  private authStatusSubscription: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private animeService: AnimeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.accessoEffettuato = true; // Forziamo l'accesso a true

    this.loadProfileDetails(); // Carica i dettagli dell'utente (username e immagine)
    /*if (this.authService) { // Assicurati di iniettare authService se lo usi
     this.authStatusSubscription = this.authService.getAuthStatus().subscribe(status => {
         this.accessoEffettuato = status.isLoggedIn;
         this.username = status.username;
         this.profileImage = status.profileImage;
         // this.cdr.detectChanges(); // Potrebbe servire se hai ChangeDetectionStrategy.OnPush
       });
    }*/
  }

  ngOnDestroy(): void {
    if (this.authStatusSubscription) {
      this.authStatusSubscription.unsubscribe();
    }
  }

  checkLoginStatus(): void {
  }

  loadProfileDetails(): void {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      this.profileImage = savedImage;
    } else {
      this.profileImage = 'https://via.placeholder.com/40/7c4dff/FFFFFF?text=JP';
      localStorage.setItem('profileImage', this.profileImage);
    }

    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      this.username = savedUsername;
    } else {
      this.username = 'AnimeFan'; // Username di default
      localStorage.setItem('username', this.username);
    }
  }


  goToLoginRegister(): void {
    alert('La pagina di Login/Registrazione non è ancora disponibile.');
    // this.router.navigate(['/login-register']); // Commenta questa riga
    this.showDropdown = false;
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn'); // Rimuove il flag, ma ngOnInit lo imposta di nuovo
    localStorage.removeItem('username');
    localStorage.removeItem('profileImage');
    this.accessoEffettuato = false; // Sarà reimpostato a true al ricaricamento del componente
    this.username = 'Username';
    this.profileImage = 'assets/default-profile.png';
    alert('Hai effettuato il logout (simulato). Al prossimo ricaricamento sarai di nuovo "loggato".');
    // this.router.navigate(['/']); // Reindirizza alla home
    this.showDropdown = false;
  }


  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  toggleSearchBar(): void {
    this.showSearchBar = !this.showSearchBar;
    if (!this.showSearchBar) {
      this.query = '';
    }
  }

  searchAnime(): void {
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query.trim() } });
      this.showSearchBar = false;
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

  // loadTopAnime(): void { } // Lasciato commentato
}