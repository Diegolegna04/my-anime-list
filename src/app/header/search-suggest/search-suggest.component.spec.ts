import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SearchSuggestComponent } from './search-suggest.component';
import { UserListService } from '../../services/user-list.service';

describe('SearchSuggestComponent', () => {
  let fixture: ComponentFixture<SearchSuggestComponent>;
  let el: HTMLElement;
  const statuses = new Map<number, string>();

  const naruto = {
    mal_id: 20,
    title: 'Naruto',
    title_english: 'Naruto (EN)',
    type: 'TV',
    year: 2002,
    score: 8.01,
    images: { jpg: { small_image_url: 'naruto-small.jpg', image_url: 'naruto.jpg' } },
  };
  const boruto = {
    mal_id: 34566,
    title: 'Boruto',
    type: 'TV',
    aired: { prop: { from: { year: 2017 } } },
    images: { jpg: {} },
  };

  function render(inputs: Record<string, unknown>): void {
    fixture.componentRef.setInput('listId', 'search-suggest');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
  }

  const items = () => Array.from(el.querySelectorAll<HTMLAnchorElement>('.suggest-item'));

  beforeEach(() => {
    statuses.clear();
    localStorage.removeItem('titleLanguage');
    TestBed.configureTestingModule({
      imports: [SearchSuggestComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserListService,
          useValue: { statusOf: (id: number) => statuses.get(id) ?? null },
        },
      ],
    });
    fixture = TestBed.createComponent(SearchSuggestComponent);
    el = fixture.nativeElement;
  });

  afterEach(() => localStorage.removeItem('titleLanguage'));

  it('mostra titolo, tipo, anno, voto e copertina di ogni risultato', () => {
    render({ suggestions: [naruto, boruto], query: 'naru' });

    expect(items().length).toBe(2);
    expect(items()[0].querySelector('.suggest-title')?.textContent?.trim()).toBe('Naruto');
    expect(items()[0].querySelector('.suggest-meta')?.textContent).toContain('TV · 2002');
    expect(items()[0].querySelector('.suggest-score')?.textContent).toContain('8.01');
    expect(items()[0].querySelector('img')?.getAttribute('src')).toBe('naruto-small.jpg');
    expect(items()[0].getAttribute('href')).toBe('/anime/20');
    // Anno dalla data di messa in onda; senza immagini resta l'icona
    expect(items()[1].querySelector('.suggest-meta')?.textContent).toContain('TV · 2017');
    expect(items()[1].querySelector('img')).toBeNull();
    expect(items()[1].querySelector('.fa-image')).not.toBeNull();
  });

  it('usa il titolo inglese se è la lingua scelta, con ripiego sul titolo originale', () => {
    localStorage.setItem('titleLanguage', 'english');
    render({ suggestions: [naruto, boruto], query: 'naru' });

    expect(items()[0].querySelector('.suggest-title')?.textContent?.trim()).toBe('Naruto (EN)');
    expect(items()[1].querySelector('.suggest-title')?.textContent?.trim()).toBe('Boruto');
  });

  it("segna gli anime già nella lista dell'utente", () => {
    statuses.set(20, 'completed');
    render({ suggestions: [naruto, boruto], query: 'naru' });

    expect(items()[0].querySelector('.suggest-badge')?.textContent?.trim()).toBe('Completato');
    expect(items()[1].querySelector('.suggest-badge')).toBeNull();
  });

  it('durante il caricamento dice che sta cercando, senza risultati dice che non ce ne sono', () => {
    render({ suggestions: [], loading: true, query: 'xyz ' });
    expect(el.querySelector('.suggest-status')?.textContent).toContain('Cerco...');

    render({ loading: false });
    expect(el.querySelector('.suggest-status')?.textContent).toContain(
      'Nessun anime trovato per “xyz”.',
    );
    expect(el.querySelector('.suggest-all')?.textContent).toContain('Tutti i risultati per “xyz”');
  });

  it('la voce attiva è evidenziata e annunciata, il mouse la cambia', () => {
    render({ suggestions: [naruto, boruto], query: 'naru', activeIndex: 1 });
    expect(items()[1].classList).toContain('active');
    expect(items()[1].getAttribute('aria-selected')).toBe('true');
    expect(items()[1].id).toBe('search-suggest-1');

    items()[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(fixture.componentInstance.activeIndex()).toBe(0);
    expect(items()[0].classList).toContain('active');
  });

  it("un clic su un risultato lo passa all'header invece di navigare da solo", () => {
    render({ suggestions: [naruto], query: 'naru' });
    const chosen: unknown[] = [];
    fixture.componentInstance.chosen.subscribe((a) => chosen.push(a));

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    items()[0].dispatchEvent(click);

    expect(chosen).toEqual([naruto]);
    expect(click.defaultPrevented).toBeTrue();
  });
});
