import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ActiveSeason, SeasonService } from './season.service';

const BASE = '/api/anime-proxy/seasons';

function anime(id: number, season: string, from: string, members: number) {
  return { mal_id: id, type: 'TV', season, year: 2026, members, aired: { from: `${from}T00:00:00+00:00` } };
}

/** Autunno 2026: il titolo più atteso esce il 2/10, gli altri dopo */
const fallList = [
  anime(1, 'fall', '2026-10-02', 76000),
  anime(2, 'fall', '2026-10-03', 66000),
  anime(3, 'fall', '2026-10-04', 36000),
  anime(4, 'fall', '2026-10-01', 22000)
];
const summerList = [anime(10, 'summer', '2026-07-06', 270000), anime(11, 'summer', '2026-07-08', 240000)];

describe('SeasonService', () => {
  let service: SeasonService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SeasonService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('1 ottobre: seasons/now è ancora l\'estate e l\'autunno non è partito -> estate', () => {
    let result: ActiveSeason | undefined;
    service.resolveActiveSeason(new Date(2026, 9, 1)).subscribe(r => result = r);

    // L'autunno è la stagione del calendario: prima seasons/now, che però dà l'estate
    http.expectOne(`${BASE}/now?page=1`).flush({ data: summerList });
    http.expectOne(`${BASE}/2026/fall?page=1`).flush({ data: fallList });
    // Autunno non ancora partito: si mostra l'estate, che seasons/now ha già
    http.expectOne(`${BASE}/now?page=1`).flush({ data: summerList });

    expect(result?.season).toEqual({ season: 'summer', year: 2026 });
    expect(result?.list.map(a => a.mal_id)).toEqual([10, 11]);
  });

  it('2 ottobre: esce il titolo più atteso -> autunno, riusando la lista già scaricata', () => {
    let result: ActiveSeason | undefined;
    service.resolveActiveSeason(new Date(2026, 9, 2)).subscribe(r => result = r);

    http.expectOne(`${BASE}/now?page=1`).flush({ data: fallList });

    expect(result?.season).toEqual({ season: 'fall', year: 2026 });
    expect(result?.list.length).toBe(4);
  });

  it('fuori dalla finestra usa la stagione del calendario', () => {
    let result: ActiveSeason | undefined;
    service.resolveActiveSeason(new Date(2026, 10, 10)).subscribe(r => result = r);

    http.expectOne(`${BASE}/now?page=1`).flush({ data: fallList });

    expect(result?.season).toEqual({ season: 'fall', year: 2026 });
  });

  it('se la stagione nuova non si carica ripiega sulla data (prima del giorno 5 -> vecchia)', () => {
    let result: ActiveSeason | undefined;
    service.resolveActiveSeason(new Date(2026, 9, 3)).subscribe(r => result = r);

    http.expectOne(`${BASE}/now?page=1`).flush({}, { status: 504, statusText: 'Gateway Timeout' });
    http.expectOne(`${BASE}/2026/fall?page=1`).flush({}, { status: 504, statusText: 'Gateway Timeout' });
    http.expectOne(`${BASE}/now?page=1`).flush({ data: summerList });

    expect(result?.season).toEqual({ season: 'summer', year: 2026 });
  });

  it('stagioni passate vanno diritte su anno/stagione', () => {
    service.getSeasonPage({ season: 'spring', year: 2024 }, 2, undefined, new Date(2026, 9, 1)).subscribe();
    http.expectOne(`${BASE}/2024/spring?page=2`).flush({ data: [] });
  });
});
