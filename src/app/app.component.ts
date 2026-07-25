import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { AnimeService } from './services/anime.service';
import { FooterComponent } from './footer/footer.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastComponent
  ],
})
export class AppComponent implements OnInit {

  constructor(private animeService: AnimeService, private authService: AuthService) {
    if (localStorage.getItem('accessoEffettuato')) {
      this.authService.validateSession();
    }
  }

  ngOnInit(): void {
  }

  isDarkTheme: boolean = false;
}