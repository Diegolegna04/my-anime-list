import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AnimeInfoCardComponent, AnimeInfo } from './anime-info-card.component';

describe('AnimeInfoCardComponent', () => {
  let component: AnimeInfoCardComponent;
  let fixture: ComponentFixture<AnimeInfoCardComponent>;

  const animeDetails: AnimeInfo = {
    episodes: 12,
    score: 8.5,
    status: 'Finished Airing',
    genres: [{ mal_id: 1, name: 'Action' }],
    type: 'TV'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeInfoCardComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnimeInfoCardComponent);
    component = fixture.componentInstance;
    // animeDetails è un input obbligatorio
    fixture.componentRef.setInput('animeDetails', animeDetails);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('separa i servizi che dall\'Italia non si possono usare', () => {
    fixture.componentRef.setInput('streamingServices', [
      { name: 'Crunchyroll', url: 'https://cr/x' },
      { name: 'Hulu', url: 'https://hulu/x' },
      { name: 'YouTube (Muse Asia)', url: 'https://yt/x' },
      { name: 'Tubi TV', url: 'https://tubi/x' },
      { name: 'Netflix', url: 'https://netflix/x' }
    ]);
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.streaming-link') as NodeListOf<HTMLElement>)
      .map((link) => link.textContent!.trim());
    expect(links).toEqual(['Crunchyroll', 'Netflix']);
    expect(fixture.nativeElement.textContent).toContain('Solo all\'estero: Hulu, YouTube (Muse Asia), Tubi TV.');
  });

  it('dice che non c\'è niente in Italia se restano solo servizi esteri', () => {
    fixture.componentRef.setInput('streamingServices', [{ name: 'Hulu', url: 'https://hulu/x' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.streaming-link')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Nessun servizio di streaming disponibile in Italia.');
  });
});
