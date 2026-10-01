import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { WatchedAnimeComponent } from './watched-anime.component';

function summary(id: number, title: string) {
  return { mal_id: id, title, episodes: 12, images: { jpg: { large_image_url: `${id}.jpg` } } };
}

describe('WatchedAnimeComponent', () => {
  let fixture: ComponentFixture<WatchedAnimeComponent>;
  let component: WatchedAnimeComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [WatchedAnimeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        // Pagina aperta dal profilo con il filtro già scelto
        { provide: ActivatedRoute, useValue: { queryParams: of({ filter: 'in visione' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WatchedAnimeComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('aperta col filtro mostra subito gli anime di quello stato, senza aspettare gli altri', () => {
    http.expectOne('/api/user-anime/library').flush([
      { animeId: 1, status: 'watching', episodesWatched: 3, anime: summary(1, 'Beta') },
      { animeId: 2, status: 'completed', episodesWatched: 12, anime: summary(2, 'Gamma') },
      { animeId: 3, status: 'watching', episodesWatched: 1, anime: summary(3, 'Alfa') },
      // Senza riassunto: i dettagli si chiedono a parte, la pagina non li aspetta
      { animeId: 4, status: 'watching', episodesWatched: 0, anime: null }
    ]);

    expect(component.isLoading).toBeFalse();
    expect(component.filteredAnime.map(a => a.details.data.title)).toEqual(['Alfa', 'Beta']);
    expect(component.pendingDetails).toBe(1);

    http.expectOne('/api/anime-proxy/anime/4').flush({ data: summary(4, 'Delta') });
    expect(component.filteredAnime.map(a => a.details.data.title)).toEqual(['Alfa', 'Beta', 'Delta']);
    expect(component.pendingDetails).toBe(0);
  });

  it('se il backend non ha /library ripiega sulle liste per stato', () => {
    http.expectOne('/api/user-anime/library').flush({}, { status: 404, statusText: 'Not Found' });

    for (const status of ['completed', 'watching', 'plan_to_watch', 'on_hold', 'dropped']) {
      http.expectOne(`/api/user-anime/status/${status}`).flush(status === 'watching' ? [{ animeId: 7, episodesWatched: 2 }] : []);
    }

    expect(component.isLoading).toBeFalse();
    http.expectOne('/api/anime-proxy/anime/7').flush({ data: summary(7, 'Solo') });
    expect(component.filteredAnime.map(a => a.details.data.title)).toEqual(['Solo']);
  });
});
