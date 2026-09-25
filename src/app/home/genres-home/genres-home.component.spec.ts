import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GenresHomeComponent } from './genres-home.component';

describe('GenresHomeComponent', () => {
  let component: GenresHomeComponent;
  let fixture: ComponentFixture<GenresHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenresHomeComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenresHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
