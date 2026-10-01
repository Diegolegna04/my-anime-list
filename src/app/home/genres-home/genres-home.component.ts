import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-genres-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './genres-home.component.html',
  styleUrl: './genres-home.component.css'
})
export class GenresHomeComponent {
  /** Id dei generi su MyAnimeList: portano alla pagina /genres/anime-by-genre/:id */
  readonly genres = [
    { id: 1, label: 'Azione', icon: 'fa-fist-raised' },
    { id: 22, label: 'Romance', icon: 'fa-heart' },
    { id: 14, label: 'Horror', icon: 'fa-ghost' },
    { id: 4, label: 'Commedia', icon: 'fa-laugh-beam' },
    { id: 24, label: 'Sci-Fi', icon: 'fa-rocket' },
    { id: 10, label: 'Fantasy', icon: 'fa-magic' },
    { id: 36, label: 'Slice of Life', icon: 'fa-school' }
  ];
}
