import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SeasonalAnimePageComponent } from './seasonal-anime-page.component';

describe('SeasonalAnimePageComponent', () => {
  let component: SeasonalAnimePageComponent;
  let fixture: ComponentFixture<SeasonalAnimePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonalAnimePageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonalAnimePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
