import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { Genre, GenreService } from './genre.service';

describe('GenreService', () => {
  let service: GenreService;
  let httpMock: HttpTestingController;

  // Estratto della risposta reale di Jikan /genres/anime (senza filtro)
  const jikanGenres = {
    data: [
      { mal_id: 1, name: 'Action', count: 4901 },
      { mal_id: 41, name: 'Suspense' },
      { mal_id: 9, name: 'Ecchi' },
      { mal_id: 12, name: 'Hentai' },
      { mal_id: 62, name: 'Isekai' },
      { mal_id: 83, name: 'Villainess' },
      { mal_id: 27, name: 'Shounen' },
      { mal_id: 43, name: 'Josei' }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(GenreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fa una sola richiesta, senza filtro (Jikan risponde 504 alle richieste filtrate)', async () => {
    const genres = firstValueFrom(service.getAllGenres());

    const req = httpMock.expectOne('/api/anime-proxy/genres/anime');
    expect(req.request.method).toBe('GET');
    req.flush(jikanGenres);

    expect((await genres).length).toBe(8);
  });

  it('assegna la categoria giusta a ogni genere', async () => {
    const genres = firstValueFrom(service.getAllGenres());
    httpMock.expectOne('/api/anime-proxy/genres/anime').flush(jikanGenres);

    const byName = new Map((await genres).map((g: Genre) => [g.name, g.category]));
    expect(byName.get('Action')).toBe('genres');
    expect(byName.get('Suspense')).toBe('genres');
    expect(byName.get('Ecchi')).toBe('explicit_genres');
    expect(byName.get('Hentai')).toBe('explicit_genres');
    expect(byName.get('Shounen')).toBe('demographics');
    expect(byName.get('Josei')).toBe('demographics');
    // Tutto il resto (anche generi aggiunti in futuro) finisce nei temi
    expect(byName.get('Isekai')).toBe('themes');
    expect(byName.get('Villainess')).toBe('themes');
  });

  it('riporta il numero di anime per genere (0 se Jikan non lo manda)', async () => {
    const genres = firstValueFrom(service.getAllGenres());
    httpMock.expectOne('/api/anime-proxy/genres/anime').flush(jikanGenres);

    const list = await genres;
    expect(list.find(g => g.name === 'Action')?.count).toBe(4901);
    expect(list.find(g => g.name === 'Isekai')?.count).toBe(0);
  });

  it('riusa la risposta per chi si iscrive dopo (una richiesta sola)', async () => {
    const first = firstValueFrom(service.getAllGenres());
    httpMock.expectOne('/api/anime-proxy/genres/anime').flush(jikanGenres);
    await first;

    expect(await firstValueFrom(service.getGenreName(62))).toBe('Isekai');
    httpMock.expectNone('/api/anime-proxy/genres/anime');
  });

  it('dopo un errore riprova alla successiva iscrizione', async () => {
    const failed = firstValueFrom(service.getAllGenres());
    httpMock.expectOne('/api/anime-proxy/genres/anime').flush({}, { status: 504, statusText: 'Gateway Timeout' });
    await expectAsync(failed).toBeRejected();

    const retry = firstValueFrom(service.getAllGenres());
    httpMock.expectOne('/api/anime-proxy/genres/anime').flush(jikanGenres);
    expect((await retry).length).toBe(8);
  });
});
