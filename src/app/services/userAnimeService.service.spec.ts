import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';

import { UserAnimeService } from './userAnimeService.service';

/** Il contratto con UserAnimeResource del backend: metodo, percorso, corpo e cookie di sessione */
describe('UserAnimeService', () => {
  let service: UserAnimeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserAnimeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const cases: {
    name: string;
    call: (s: UserAnimeService) => Observable<unknown>;
    method: string;
    url: string;
    body?: unknown;
  }[] = [
    {
      name: 'updateAnimeStatus',
      call: (s) => s.updateAnimeStatus(21, 'watching'),
      method: 'PUT',
      url: '/api/user-anime/21/status',
      body: { status: 'watching' },
    },
    {
      name: 'updateEpisodesWatched',
      call: (s) => s.updateEpisodesWatched(21, 7),
      method: 'PUT',
      url: '/api/user-anime/21/episodes',
      body: { episodesWatched: 7 },
    },
    {
      name: 'updateRating',
      call: (s) => s.updateRating(21, 9),
      method: 'PUT',
      url: '/api/user-anime/21/rating',
      body: { rating: 9 },
    },
    {
      name: 'toggleFavorite',
      call: (s) => s.toggleFavorite(21),
      method: 'PUT',
      url: '/api/user-anime/21/favorite',
      body: {},
    },
    {
      name: 'toggleInEvidenza',
      call: (s) => s.toggleInEvidenza(21),
      method: 'PUT',
      url: '/api/user-anime/21/evidenza',
      body: {},
    },
    {
      name: 'updateEvidenzaOrder',
      call: (s) => s.updateEvidenzaOrder([3, 1, 2]),
      method: 'PUT',
      url: '/api/user-anime/evidenza/order',
      body: { animeIds: [3, 1, 2] },
    },
    {
      name: 'getUserStats',
      call: (s) => s.getUserStats(),
      method: 'GET',
      url: '/api/user-anime/stats',
    },
    {
      name: 'getInEvidenza',
      call: (s) => s.getInEvidenza(),
      method: 'GET',
      url: '/api/user-anime/evidenza',
    },
    {
      name: 'getAnimeByStatus',
      call: (s) => s.getAnimeByStatus('completed'),
      method: 'GET',
      url: '/api/user-anime/status/completed',
    },
    {
      name: 'getLibrary',
      call: (s) => s.getLibrary(),
      method: 'GET',
      url: '/api/user-anime/library',
    },
    {
      name: 'getFavorites',
      call: (s) => s.getFavorites(),
      method: 'GET',
      url: '/api/user-anime/favorites',
    },
    {
      name: 'getAnimeStatus',
      call: (s) => s.getAnimeStatus(21),
      method: 'GET',
      url: '/api/user-anime/21',
    },
    {
      name: 'removeAnime',
      call: (s) => s.removeAnime(21),
      method: 'DELETE',
      url: '/api/user-anime/21',
    },
  ];

  for (const c of cases) {
    it(`${c.name}: ${c.method} ${c.url} con il cookie di sessione`, () => {
      c.call(service).subscribe();
      const req = httpMock.expectOne(c.url);
      expect(req.request.method).toBe(c.method);
      expect(req.request.withCredentials).toBeTrue();
      if (c.body !== undefined) expect(req.request.body).toEqual(c.body);
      req.flush({});
    });
  }

  it('getLibrary restituisce le voci così come arrivano, anche con anime null', () => {
    let library: unknown;
    service.getLibrary().subscribe((l) => (library = l));
    const entries = [
      {
        animeId: 21,
        status: 'watching',
        episodesWatched: 3,
        rating: 0,
        isFavorite: false,
        inEvidenza: false,
        anime: null,
      },
    ];
    httpMock.expectOne('/api/user-anime/library').flush(entries);

    expect(library).toEqual(entries);
  });
});
