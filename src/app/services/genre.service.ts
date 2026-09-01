import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type GenreCategory = 'genres' | 'explicit_genres' | 'themes' | 'demographics';

export interface Genre {
  id: number;
  name: string;
  category: GenreCategory;
}

@Injectable({ providedIn: 'root' })
export class GenreService {
  private genresUrl = '/api/anime-proxy/genres/anime';
  private genres$: Observable<Genre[]>;

  constructor(private http: HttpClient) {
    const categories: GenreCategory[] = ['genres', 'explicit_genres', 'themes', 'demographics'];

    const requests = categories.map(category =>
      this.http.get<any>(`${this.genresUrl}?filter=${category}`).pipe(
        map(response => (response.data || []).map((g: any) => ({
          id: g.mal_id,
          name: g.name,
          category
        } as Genre)))
      )
    );

    this.genres$ = forkJoin(requests).pipe(
      map(results => results.flat()),
      shareReplay(1)
    );
  }

  getAllGenres(): Observable<Genre[]> {
    return this.genres$;
  }

  getGenresByCategory(category: GenreCategory): Observable<Genre[]> {
    return this.genres$.pipe(map(genres => genres.filter(g => g.category === category)));
  }

  getGenreName(id: number): Observable<string> {
    return this.genres$.pipe(
      map(genres => genres.find(g => g.id === id)?.name || 'Sconosciuto')
    );
  }
}
