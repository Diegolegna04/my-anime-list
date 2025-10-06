import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendedAnimeSidebarComponent } from './recommended-anime-sidebar.component';

describe('RecommendedAnimeSidebarComponent', () => {
  let component: RecommendedAnimeSidebarComponent;
  let fixture: ComponentFixture<RecommendedAnimeSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendedAnimeSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendedAnimeSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
