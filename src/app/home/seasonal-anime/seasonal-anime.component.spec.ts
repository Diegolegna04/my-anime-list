import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SeasonalAnimeComponent } from './seasonal-anime.component';

describe('SeasonalAnimeComponent', () => {
  let component: SeasonalAnimeComponent;
  let fixture: ComponentFixture<SeasonalAnimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonalAnimeComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonalAnimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
