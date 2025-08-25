import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopAnimeComponent } from './top-anime.component';

describe('TopAnimeComponent', () => {
  let component: TopAnimeComponent;
  let fixture: ComponentFixture<TopAnimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopAnimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopAnimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
