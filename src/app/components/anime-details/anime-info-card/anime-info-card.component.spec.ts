import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimeInfoCardComponent } from './anime-info-card.component';

describe('AnimeInfoCardComponent', () => {
  let component: AnimeInfoCardComponent;
  let fixture: ComponentFixture<AnimeInfoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeInfoCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnimeInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
