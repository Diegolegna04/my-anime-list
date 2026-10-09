import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AnimeService } from './anime.service';

const API = '/api/anime-proxy';
const TOO_MANY = { status: 429, statusText: 'Too Many Requests' };

describe('AnimeService', () => {
  let service: AnimeService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnimeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  describe('getAnimeById', () => {
    it('fa una sola richiesta e riusa la risposta alla seconda chiamata', fakeAsync(() => {
      const results: any[] = [];
      service.getAnimeById('1').subscribe((r) => results.push(r));
      http.expectOne(`${API}/anime/1`).flush({ data: { mal_id: 1 } });

      service.getAnimeById('1').subscribe((r) => results.push(r));
      http.expectNone(`${API}/anime/1`);

      expect(results).toEqual([{ data: { mal_id: 1 } }, { data: { mal_id: 1 } }]);
      tick(700);
    }));

    it('salva la risposta in localStorage', fakeAsync(() => {
      service.getAnimeById('2').subscribe();
      http.expectOne(`${API}/anime/2`).flush({ data: { mal_id: 2 } });

      const saved = JSON.parse(localStorage.getItem('animeCache:2')!);
      expect(saved.data).toEqual({ data: { mal_id: 2 } });
      tick(700);
    }));

    it("usa localStorage senza richiesta se la voce e' fresca", () => {
      localStorage.setItem('animeCache:3', JSON.stringify({ data: { data: { mal_id: 3 } }, timestamp: Date.now() }));

      let result: any;
      service.getAnimeById('3').subscribe((r) => (result = r));

      http.expectNone(`${API}/anime/3`);
      expect(result).toEqual({ data: { mal_id: 3 } });
    });

    it('ignora la voce di localStorage scaduta e rifa la richiesta', fakeAsync(() => {
      const old = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem('animeCache:4', JSON.stringify({ data: { stale: true }, timestamp: old }));

      let result: any;
      service.getAnimeById('4').subscribe((r) => (result = r));
      http.expectOne(`${API}/anime/4`).flush({ fresh: true });

      expect(result).toEqual({ fresh: true });
      tick(700);
    }));

    it('su 429 riprova la richiesta e poi consegna il risultato', fakeAsync(() => {
      let result: any;
      service.getAnimeById('5').subscribe((r) => (result = r));

      http.expectOne(`${API}/anime/5`).flush('', TOO_MANY);
      // Il secondo worker e' libero: il nuovo tentativo parte subito
      http.expectOne(`${API}/anime/5`).flush({ ok: true });

      expect(result).toEqual({ ok: true });
      tick(2500);
    }));

    it('dopo un 429 rallenta la coda: il tentativo successivo aspetta il worker libero', fakeAsync(() => {
      service.getAnimeById('6').subscribe();

      http.expectOne(`${API}/anime/6`).flush('', TOO_MANY);
      http.expectOne(`${API}/anime/6`).flush('', TOO_MANY);

      // Entrambi i worker sono occupati: il terzo tentativo e' in coda
      tick(699);
      http.expectNone(`${API}/anime/6`);
      // Il primo worker si libera a 700 ms
      tick(1);
      http.expectOne(`${API}/anime/6`).flush({ ok: true });

      tick(2500);
    }));

    it("dopo 5 tentativi falliti (429) propaga l'errore e libera la cache", fakeAsync(() => {
      let error: any;
      service.getAnimeById('7').subscribe({ error: (e) => (error = e) });

      for (let i = 0; i < 5; i++) {
        tick(2500);
        http.expectOne(`${API}/anime/7`).flush('', TOO_MANY);
      }
      expect(error?.status).toBe(429);

      // Cache svuotata: una nuova chiamata rifa la richiesta
      tick(2500);
      service.getAnimeById('7').subscribe();
      http.expectOne(`${API}/anime/7`).flush({ ok: true });
      tick(2500);
    }));

    it('su un errore non ritentabile (404) fallisce subito', fakeAsync(() => {
      let error: any;
      service.getAnimeById('8').subscribe({ error: (e) => (error = e) });

      http.expectOne(`${API}/anime/8`).flush('', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
      http.expectNone(`${API}/anime/8`);
      tick(700);
    }));
  });

  describe('searchAnime', () => {
    it('codifica la query e passa la pagina', () => {
      service.searchAnime('one piece & co', 2).subscribe();
      http.expectOne(`${API}/anime?q=${encodeURIComponent('one piece & co')}&page=2`).flush({ data: [] });
    });

    it('riprova una volta su 503', fakeAsync(() => {
      let result: any;
      service.searchAnime('naruto').subscribe((r) => (result = r));

      http.expectOne(`${API}/anime?q=naruto&page=1`).flush('', { status: 503, statusText: 'Service Unavailable' });
      tick(600);
      http.expectOne(`${API}/anime?q=naruto&page=1`).flush({ data: [1] });

      expect(result).toEqual({ data: [1] });
    }));
  });

  describe('searchPreview', () => {
    it('chiede i piu seguiti e tronca al limite', () => {
      let result: any[] = [];
      service.searchPreview('bleach', 2).subscribe((r) => (result = r));

      http
        .expectOne(`${API}/anime?q=bleach&limit=2&order_by=members&sort=desc&sfw=true`)
        .flush({ data: [{ mal_id: 1 }, { mal_id: 2 }, { mal_id: 3 }] });

      expect(result).toEqual([{ mal_id: 1 }, { mal_id: 2 }]);
    });
  });

  describe('sortAnime', () => {
    const list = [
      { mal_id: 1, members: 10, score: 7, aired: { from: '2000-01-01' } },
      { mal_id: 2, members: 30, score: 9, aired: { from: '2020-01-01' } },
      { mal_id: 3, members: 20, score: null, aired: { from: '2010-01-01' } },
    ];

    it('non modifica la lista originale', () => {
      const input = [...list];
      const sorted = service.sortAnime(input, 'members');

      expect(sorted).not.toBe(input);
      expect(input.map((a) => a.mal_id)).toEqual([1, 2, 3]);
      expect(sorted.map((a) => a.mal_id)).toEqual([2, 3, 1]);
    });

    it('ordina per punteggio (null come 0) e per data piu recente', () => {
      expect(service.sortAnime(list, 'score').map((a) => a.mal_id)).toEqual([2, 1, 3]);
      expect(service.sortAnime(list, 'date').map((a) => a.mal_id)).toEqual([2, 3, 1]);
    });
  });

  describe('endpoint del proxy', () => {
    it('getTopAnime chiede la pagina richiesta', fakeAsync(() => {
      service.getTopAnime(3).subscribe();
      http.expectOne(`${API}/top/anime?page=3`).flush({ data: [] });
      tick(700);
    }));

    it('getAnimeByGenre costruisce la query con nome codificato', fakeAsync(() => {
      service.getAnimeByGenre(22, 'Slice of Life', 2).subscribe();
      http
        .expectOne(`${API}/anime?genres=22&genreName=Slice%20of%20Life&page=2&order_by=score&sort=desc&limit=25`)
        .flush({ data: [] });
      tick(700);
    }));

    it('getRecommendations, getStreaming e getNews usano i path dell anime', fakeAsync(() => {
      service.getRecommendations(9).subscribe();
      service.getStreaming(9).subscribe();
      http.expectOne(`${API}/anime/9/recommendations`).flush({ data: [] });
      http.expectOne(`${API}/anime/9/streaming`).flush({ data: [] });
      tick(700);

      service.getNews(9).subscribe();
      http.expectOne(`${API}/anime/9/news`).flush({ data: [] });
      tick(700);
    }));

    it('getAnimeDetails non usa ne scrive la cache', fakeAsync(() => {
      localStorage.setItem('animeCache:11', JSON.stringify({ data: { stale: true }, timestamp: Date.now() }));

      let result: any;
      service.getAnimeDetails(11).subscribe((r) => (result = r));
      http.expectOne(`${API}/anime/11`).flush({ data: { fresh: true } });
      tick(700);

      expect(result).toEqual({ data: { fresh: true } });
      expect(JSON.parse(localStorage.getItem('animeCache:11')!).data).toEqual({ stale: true });

      service.getAnimeDetails(11).subscribe();
      http.expectOne(`${API}/anime/11`).flush({ data: {} });
      tick(700);
    }));

    it('getAnimeDetails riprova su 429 ma non su 503', fakeAsync(() => {
      let error: any;
      service.getAnimeDetails(12).subscribe({ error: (e) => (error = e) });
      http.expectOne(`${API}/anime/12`).flush('', TOO_MANY);
      http.expectOne(`${API}/anime/12`).flush('', { status: 503, statusText: 'Service Unavailable' });

      expect(error?.status).toBe(503);
      tick(2500);
    }));

    it('un 503 su getRecommendations fallisce subito e non rallenta la coda', fakeAsync(() => {
      let error: any;
      service.getRecommendations(1).subscribe({ error: (e) => (error = e) });
      http.expectOne(`${API}/anime/1/recommendations`).flush('', { status: 503, statusText: 'Service Unavailable' });

      expect(error?.status).toBe(503);
      http.expectNone(`${API}/anime/1/recommendations`);
      tick(700);

      // Intervallo ancora a 700 ms: due richieste partono subito, la terza dopo 700 ms
      service.getTopAnime(1).subscribe();
      service.getTopAnime(2).subscribe();
      service.getTopAnime(3).subscribe();
      http.expectOne(`${API}/top/anime?page=1`).flush({ data: [] });
      http.expectOne(`${API}/top/anime?page=2`).flush({ data: [] });
      tick(699);
      http.expectNone(`${API}/top/anime?page=3`);
      tick(1);
      http.expectOne(`${API}/top/anime?page=3`).flush({ data: [] });
      tick(700);
    }));

    it('annullando prima che parta, la richiesta in coda non viene fatta', fakeAsync(() => {
      service.getTopAnime(1).subscribe();
      service.getTopAnime(2).subscribe();
      const sub = service.getNews(5).subscribe();
      sub.unsubscribe();

      http.expectOne(`${API}/top/anime?page=1`).flush({ data: [] });
      http.expectOne(`${API}/top/anime?page=2`).flush({ data: [] });
      tick(1500);
      http.expectNone(`${API}/anime/5/news`);
    }));

    it('annullando una richiesta in volo la richiesta HTTP viene annullata', fakeAsync(() => {
      const sub = service.getStreaming(6).subscribe();
      const req = http.expectOne(`${API}/anime/6/streaming`);
      sub.unsubscribe();

      expect(req.cancelled).toBeTrue();
      tick(700);
    }));

    it('getRandomAnime non e in cache: ogni chiamata fa una richiesta', () => {
      service.getRandomAnime().subscribe();
      http.expectOne(`${API}/random/anime`).flush({ data: { mal_id: 1 } });

      service.getRandomAnime().subscribe();
      http.expectOne(`${API}/random/anime`).flush({ data: { mal_id: 2 } });
    });

    it('getRandomAnime riprova una volta su 502', fakeAsync(() => {
      let result: any;
      service.getRandomAnime().subscribe((r) => (result = r));

      http.expectOne(`${API}/random/anime`).flush('', { status: 502, statusText: 'Bad Gateway' });
      tick(600);
      http.expectOne(`${API}/random/anime`).flush({ data: { mal_id: 5 } });

      expect(result).toEqual({ data: { mal_id: 5 } });
    }));
  });
});
