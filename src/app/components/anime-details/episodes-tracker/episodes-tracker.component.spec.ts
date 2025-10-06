import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodesTrackerComponent } from './episodes-tracker.component';

describe('EpisodesTrackerComponent', () => {
  let component: EpisodesTrackerComponent;
  let fixture: ComponentFixture<EpisodesTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodesTrackerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpisodesTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
