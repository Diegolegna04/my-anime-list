import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-anime-search',
  templateUrl: './anime-search.component.html',
  styleUrls: ['./anime-search.component.css'],
  imports: [FormsModule, NgIf, NgForOf],
  standalone: true,
})
export class AnimeSearchComponent implements OnInit {
  searchResults: any[] = [];
  query: string = '';
  private apiUrl = 'https://api.jikan.moe/v4/anime';

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.query = params['q'] || '';
      if (this.query) {
        this.performSearch(this.query);
      }
    });
  }

  performSearch(query: string): void {
    const url = `${this.apiUrl}?q=${query}`;
    this.http.get<any>(url).subscribe((response) => {
      this.searchResults = response.data;
    });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/anime', id]);
  }
}
