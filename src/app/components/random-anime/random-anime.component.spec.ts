import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RandomAnimeComponent } from './random-anime.component';

describe('RandomAnimeComponent', () => {
  let component: RandomAnimeComponent;
  let fixture: ComponentFixture<RandomAnimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RandomAnimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RandomAnimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
