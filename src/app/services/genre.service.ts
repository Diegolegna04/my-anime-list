import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export interface Genre {
    id: number;
    name: string;
}

@Injectable({ providedIn: 'root' })
export class GenreService {
    private genresUrl = '/api/anime-proxy/genres/anime';
    private genres$: Observable<Genre[]>;
  
    constructor(private http: HttpClient) {
      this.genres$ = this.http.get<any>(this.genresUrl).pipe(
        map(response => (response.data || []).map((g: any) => ({ id: g.mal_id, name: g.name }))),
        shareReplay(1)
      );
    }
  
    getAllGenres(): Observable<Genre[]> {
      return this.genres$;
    }
  
    getGenreName(id: number): Observable<string> {
      return this.genres$.pipe(
        map(genres => genres.find(g => g.id === id)?.name || 'Sconosciuto')
      );
    }
  }
