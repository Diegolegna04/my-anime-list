import {Component} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {AnimeListComponent} from './components/anime-list/anime-list.component';
import {HomeComponent} from './home/home.component';
import {HeaderComponent} from './header/header.component';
import {AnimeService} from './services/anime.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    RouterLink,
    AnimeListComponent,
    RouterOutlet,
    HomeComponent,
    HeaderComponent
  ],
})
export class AppComponent {
  isDarkTheme: boolean = false; // Variabile per il tema

  constructor(private animeService: AnimeService) {
  }

  goToLoginRegister(): void{
    this.animeService.goToLoginRegister();
  }

  goToHome(): void{
    this.animeService.goToHome();
  }
}
