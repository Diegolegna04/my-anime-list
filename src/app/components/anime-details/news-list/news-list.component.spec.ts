import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsListComponent } from './news-list.component';

describe('NewsListComponent', () => {
  let component: NewsListComponent;
  let fixture: ComponentFixture<NewsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('durante il caricamento non dice che le news non ci sono', () => {
    fixture.componentRef.setInput('status', 'loading');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Cerco le news...');
    expect(text).not.toContain('Nessuna news disponibile');
  });

  it('con il servizio giù lo dice e permette di riprovare', () => {
    const retry = jasmine.createSpy('retry');
    component.retry.subscribe(retry);
    fixture.componentRef.setInput('status', 'error');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('MyAnimeList, che in questo momento non risponde');
    (fixture.nativeElement.querySelector('.state-error button') as HTMLButtonElement).click();
    expect(retry).toHaveBeenCalled();
  });
});
