import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AnimeService } from '../services/anime.service';
import { AuthService, DEFAULT_PROFILE_IMAGE } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { UserListService } from '../services/user-list.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let header: HeaderComponent;
  let router: Router;
  let searchPreview: jasmine.Spy;
  let loggedIn$: BehaviorSubject<boolean>;
  let userData$: BehaviorSubject<{ username?: string; profileImage?: string } | null>;
  let authStub: { onLogout: jasmine.Spy };

  const naruto = { mal_id: 20, title: 'Naruto' };
  const boruto = { mal_id: 34566, title: 'Boruto' };

  beforeEach(() => {
    loggedIn$ = new BehaviorSubject(false);
    userData$ = new BehaviorSubject<{ username?: string; profileImage?: string } | null>(null);
    searchPreview = jasmine.createSpy('searchPreview').and.returnValue(of([naruto, boruto]));
    authStub = { onLogout: jasmine.createSpy('onLogout') };

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AnimeService, useValue: { searchPreview } },
        {
          provide: AuthService,
          useValue: { ...authStub, accessoEffettuato$: loggedIn$, userData$ },
        },
        {
          provide: ThemeService,
          useValue: {
            getCurrentTheme: () => 'dark',
            toggleTheme: jasmine.createSpy('toggleTheme'),
          },
        },
        { provide: UserListService, useValue: { statusOf: () => null } },
      ],
    });
    fixture = TestBed.createComponent(HeaderComponent);
    header = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.clear();
    document.body.style.overflow = '';
  });

  /** Una battuta nel campo, poi la pausa dopo la quale parte l'anteprima */
  function type(value: string, wait = 350): void {
    header.onQueryChange(value);
    tick(wait);
  }

  const key = (k: string) => new KeyboardEvent('keydown', { key: k, cancelable: true });

  describe('anteprima della ricerca', () => {
    it('non cerca con meno di 3 lettere', fakeAsync(() => {
      type('na');
      expect(searchPreview).not.toHaveBeenCalled();
      expect(header.suggestOpen).toBeFalse();
    }));

    it('cerca una volta sola, dopo una pausa nella scrittura, con la parola senza spazi', fakeAsync(() => {
      header.onQueryChange('nar');
      tick(200);
      header.onQueryChange('naru ');
      tick(349);
      expect(searchPreview).not.toHaveBeenCalled();

      tick(1);
      expect(searchPreview).toHaveBeenCalledOnceWith('naru');
      expect(header.suggestOpen).toBeTrue();
      expect(header.suggestLoading).toBeFalse();
      expect(header.suggestions).toEqual([naruto, boruto]);
    }));

    it('ignora una risposta arrivata dopo che la parola è cambiata', fakeAsync(() => {
      const slow = new Subject<unknown[]>();
      searchPreview.and.returnValue(slow);
      type('naruto');
      header.query = 'bleach'; // l'utente ha già scritto altro (risposta non ancora arrivata)

      slow.next([naruto]);
      slow.complete();

      expect(header.suggestions).toEqual([]);
    }));

    it('se la ricerca fallisce mostra "nessun risultato" invece di restare in caricamento', fakeAsync(() => {
      searchPreview.and.returnValue(throwError(() => new Error('503')));
      type('naruto');

      expect(header.suggestOpen).toBeTrue();
      expect(header.suggestLoading).toBeFalse();
      expect(header.suggestions).toEqual([]);
    }));

    it('cancellando sotto le 3 lettere si chiude', fakeAsync(() => {
      type('naruto');
      header.onQueryChange('na');
      expect(header.suggestOpen).toBeFalse();
      tick(350);
    }));

    it('tornando sul campo con la stessa parola si riapre senza cercare di nuovo', fakeAsync(() => {
      type('naruto');
      header.closeSuggestions();
      header.onSearchFocus();

      expect(header.suggestOpen).toBeTrue();
      expect(searchPreview).toHaveBeenCalledTimes(1);
    }));
  });

  describe('tastiera sulla barra di ricerca', () => {
    beforeEach(fakeAsync(() => type('naruto')));

    it('le frecce scorrono i risultati, anche in giro', () => {
      header.onSearchKeydown(key('ArrowDown'));
      expect(header.activeIndex).toBe(0);
      header.onSearchKeydown(key('ArrowDown'));
      header.onSearchKeydown(key('ArrowDown'));
      expect(header.activeIndex).toBe(0);
      header.onSearchKeydown(key('ArrowUp'));
      expect(header.activeIndex).toBe(1);
    });

    it('Invio apre il risultato scelto e svuota la ricerca', () => {
      header.onSearchKeydown(key('ArrowDown'));
      header.onSearchKeydown(key('ArrowDown'));
      const enter = key('Enter');
      header.onSearchKeydown(enter);

      expect(enter.defaultPrevented).toBeTrue();
      expect(router.navigate).toHaveBeenCalledWith(['/anime', 34566]);
      expect(header.query).toBe('');
      expect(header.suggestOpen).toBeFalse();
    });

    it('Invio senza una scelta lascia fare al form (tutti i risultati)', () => {
      const enter = key('Enter');
      header.onSearchKeydown(enter);
      expect(enter.defaultPrevented).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('Esc chiude l’anteprima', () => {
      header.onSearchKeydown(key('Escape'));
      expect(header.suggestOpen).toBeFalse();
    });
  });

  it('inviare la ricerca apre la pagina dei risultati con la parola senza spazi', fakeAsync(() => {
    type('  one piece ');
    header.searchAnime();

    expect(router.navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'one piece' },
    });
    expect(header.query).toBe('');
  }));

  it('una ricerca vuota non naviga', () => {
    header.query = '   ';
    header.searchAnime();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  describe('utente', () => {
    it('mostra username e foto dai dati utente', () => {
      loggedIn$.next(true);
      userData$.next({ username: 'diego', profileImage: 'data:image/webp;base64,xyz' });

      expect(header.accessoEffettuato).toBeTrue();
      expect(header.username).toBe('diego');
      expect(header.profileImage).toBe('data:image/webp;base64,xyz');
    });

    it('senza foto usa l’avatar predefinito', () => {
      userData$.next({ username: 'diego' });
      expect(header.profileImage).toBe(DEFAULT_PROFILE_IMAGE);
    });

    it('senza dati utente legge lo specchio in localStorage', () => {
      localStorage.setItem('username', 'sara');
      localStorage.setItem('profileImage', 'sara.webp');
      userData$.next(null);

      expect(header.username).toBe('sara');
      expect(header.profileImage).toBe('sara.webp');
    });

    it('al logout torna ai valori predefiniti', () => {
      loggedIn$.next(true);
      userData$.next({ username: 'diego', profileImage: 'x.webp' });
      loggedIn$.next(false);

      expect(header.username).toBe('Username');
      expect(header.profileImage).toBe(DEFAULT_PROFILE_IMAGE);
    });

    it('logout chiama AuthService e chiude i menu', () => {
      header.showDropdown = true;
      header.toggleMobileMenu();
      header.logout();

      expect(authStub.onLogout).toHaveBeenCalled();
      expect(header.showDropdown).toBeFalse();
      expect(header.showMobileMenu).toBeFalse();
    });
  });

  describe('menu', () => {
    it('il menu mobile blocca lo scroll della pagina finché è aperto', () => {
      header.toggleMobileMenu();
      expect(document.body.style.overflow).toBe('hidden');
      header.toggleMobileMenu();
      expect(document.body.style.overflow).toBe('');
    });

    it('Esc chiude menu del profilo e menu mobile', () => {
      header.showDropdown = true;
      header.toggleMobileMenu();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(header.showDropdown).toBeFalse();
      expect(header.showMobileMenu).toBeFalse();
      expect(document.body.style.overflow).toBe('');
    });

    it('un clic fuori dal menu del profilo lo chiude, uno dentro no', () => {
      // Il menu del profilo c'è solo da loggati
      loggedIn$.next(true);
      header.showDropdown = true;
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector(
        '.profile-menu-container',
      ) as HTMLElement;
      expect(container).withContext('menu del profilo nel DOM').not.toBeNull();

      container.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(header.showDropdown).toBeTrue();

      document.body.click();
      expect(header.showDropdown).toBeFalse();
    });

    it('cambiare pagina chiude l’anteprima', fakeAsync(() => {
      type('naruto');
      router.navigateByUrl('/genres').catch(() => undefined);
      tick();
      expect(header.suggestOpen).toBeFalse();
    }));
  });
});
