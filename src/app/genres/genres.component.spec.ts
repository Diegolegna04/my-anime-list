import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { GenresComponent } from './genres.component';
import { Genre, GenreService } from '../services/genre.service';
import { GENRE_SHORT_DESCRIPTIONS } from '../services/constants/anime-genre-descriptions';

describe('GenresComponent', () => {
  const genres: Genre[] = [
    { id: 1, name: 'Action', category: 'genres', count: 4900 },
    { id: 4, name: 'Comedy', category: 'genres', count: 7800 },
    { id: 23, name: 'School', category: 'themes', count: 2400 },
    { id: 62, name: 'Isekai', category: 'themes', count: 1000 },
    { id: 27, name: 'Shounen', category: 'demographics', count: 2100 },
    { id: 12, name: 'Hentai', category: 'explicit_genres', count: 1500 }
  ];

  let fixture: ComponentFixture<GenresComponent>;
  let component: GenresComponent;
  let genreService: jasmine.SpyObj<GenreService>;

  beforeEach(async () => {
    genreService = jasmine.createSpyObj<GenreService>('GenreService', ['getAllGenres']);
    genreService.getAllGenres.and.returnValue(of(genres));

    await TestBed.configureTestingModule({
      imports: [GenresComponent],
      providers: [provideRouter([]), { provide: GenreService, useValue: genreService }]
    }).compileComponents();

    fixture = TestBed.createComponent(GenresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const sectionIds = () => component.sections().map(s => s.id);
  const names = () => component.sections().flatMap(s => s.items.map(g => g.name));

  it('mostra le sezioni nell\'ordine generi, temi, demografie, espliciti', () => {
    expect(component.status()).toBe('ready');
    expect(sectionIds()).toEqual(['genres', 'themes', 'demographics', 'explicit_genres']);
    expect(fixture.nativeElement.querySelectorAll('a.genre-row').length).toBe(6);
  });

  it('cerca anche nelle descrizioni in italiano, ignorando gli accenti', () => {
    component.onSearch('scuola');
    expect(names()).toEqual(['School']);

    component.onSearch('ADOLESCENTI');
    expect(names()).toEqual(['Shounen']);
  });

  it('filtra per categoria e conta i risultati di ogni categoria', () => {
    component.activeCategory.set('themes');
    expect(names()).toEqual(['Isekai', 'School']);
    expect(component.countByCategory()).toEqual({ genres: 2, themes: 2, demographics: 1, explicit_genres: 1 });
  });

  it('ordina per numero di anime', () => {
    component.activeCategory.set('genres');
    component.sortOrder.set('count');
    expect(names()).toEqual(['Comedy', 'Action']);
  });

  it('senza risultati mostra un messaggio con il pulsante per cancellare la ricerca', () => {
    component.onSearch('parolacheNonEsiste');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Nessun genere per');
    expect(text).toContain('Cancella la ricerca');
  });

  it('se il caricamento fallisce mostra l\'errore e permette di riprovare', () => {
    genreService.getAllGenres.and.returnValue(throwError(() => new Error('504')));
    component.loadGenres();
    fixture.detectChanges();

    expect(component.status()).toBe('error');
    expect(fixture.nativeElement.textContent).toContain('Riprova');
  });

  it('ogni genere di MyAnimeList ha una descrizione breve', () => {
    // Tutti gli id della lista /genres/anime di Jikan (78)
    const malIds = [1, 2, 5, 46, 28, 4, 8, 10, 26, 47, 14, 7, 22, 24, 36, 30, 37, 41, 9, 49, 12, 50, 51, 52,
      53, 54, 81, 55, 39, 56, 57, 58, 35, 59, 13, 60, 61, 62, 63, 64, 65, 66, 17, 18, 67, 38, 19, 6, 68, 69,
      20, 70, 71, 40, 3, 72, 73, 74, 21, 23, 75, 29, 11, 31, 76, 77, 78, 32, 79, 80, 48, 82, 83, 43, 15, 42,
      25, 27];
    expect(malIds.length).toBe(78);
    expect(malIds.filter(id => !GENRE_SHORT_DESCRIPTIONS[id])).toEqual([]);
  });
});
