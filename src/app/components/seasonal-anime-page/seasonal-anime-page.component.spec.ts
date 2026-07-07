import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonalAnimeComponent } from './seasonal-anime-page.component';

describe('SeasonalAnimeComponent', () => {
  let component: SeasonalAnimeComponent;
  let fixture: ComponentFixture<SeasonalAnimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonalAnimeComponent]
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
