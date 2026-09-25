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
});
