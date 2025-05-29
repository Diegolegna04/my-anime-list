import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { AnimeService } from './services/anime.service';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent
  ],
})
export class AppComponent implements OnInit {

  constructor(private animeService: AnimeService) {
  }

  ngOnInit(): void {
  }

  isDarkTheme: boolean = false; // Mantieni se vuoi un toggle del tema globale qui
}