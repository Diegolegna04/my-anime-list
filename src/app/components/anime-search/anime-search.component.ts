import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimeService } from '../../services/anime.service';


@Component({
  selector: 'app-anime-search',
  templateUrl: './anime-search.component.html',
  styleUrls: ['./anime-search.component.css'],
  imports: [],
  standalone: true,
})
export class AnimeSearchComponent implements OnInit {
  searchResults: any[] = [];
  query: string = '';
  isGridView: boolean = true;

  constructor(
    private animeService: AnimeService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Recupera il termine di ricerca dalla query string
    this.route.queryParams.subscribe((params) => {
      this.query = params['q'] || '';
      if (this.query) {
        this.performSearch(this.query);
      }
    });
  }

  // Esegue la ricerca tramite il servizio
  performSearch(query: string): void {
    this.animeService.searchAnime(query).subscribe((response: { data: any[]; }) => {
      this.searchResults = response.data;
    });
  }

  // Naviga alla pagina dei dettagli
  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleView(): void {
    this.isGridView = !this.isGridView; // Cambia la modalità di visualizzazione
  }

  // Torna alla home tramite il servizio
  goBackToHome(): void {
    this.animeService.goToHome();
  }

  sortAnime(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const criteria = target.value;

    this.searchResults = this.animeService.sortAnime(this.searchResults, criteria);
  }
}
