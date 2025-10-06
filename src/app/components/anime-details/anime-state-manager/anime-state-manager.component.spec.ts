import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimeStateManagerComponent } from './anime-state-manager.component';

describe('AnimeStateManagerComponent', () => {
  let component: AnimeStateManagerComponent;
  let fixture: ComponentFixture<AnimeStateManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeStateManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnimeStateManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
