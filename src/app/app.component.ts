import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AnimeListComponent } from './components/anime-list/anime-list.component';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { AnimeService } from './services/anime.service';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    FormsModule,
    RouterLink,
    AnimeListComponent,
    RouterOutlet,
    HomeComponent,
    HeaderComponent,
    FooterComponent
],
})
export class AppComponent implements OnInit {
  isDarkTheme: boolean = false;
  accessoEffettuato: boolean = false;
  profileImage: string = 'assets/default-profile.png';
  username: string = 'Username';

  constructor(private animeService: AnimeService) {
    this.accessoEffettuato = true;
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) this.profileImage = savedImage;
  }

  goToLoginRegister(): void {
    this.animeService.goToLoginRegister();
  }

  goToHome(): void {
    this.animeService.goToHome();
  }
}
