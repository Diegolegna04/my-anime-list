import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { authGuard } from '../auth.guard';
import { routes } from '../app.routes';

describe('AuthService - logout', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.setItem('accessoEffettuato', 'true');
    localStorage.setItem('username', 'diego');
    localStorage.setItem('userData', JSON.stringify({ username: 'diego' }));

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('pulisce lo stato locale quando il logout va a buon fine', async () => {
    service.onLogout();
    httpMock.expectOne('/api/auth/logout').flush({});

    expect(await firstValueFrom(service.accessoEffettuato$)).toBeFalse();
    expect(localStorage.getItem('username')).toBeNull();
  });

  it('pulisce lo stato locale anche se il backend non risponde', async () => {
    service.onLogout();
    httpMock.expectOne('/api/auth/logout').flush({}, { status: 502, statusText: 'Bad Gateway' });

    expect(await firstValueFrom(service.accessoEffettuato$)).toBeFalse();
    expect(localStorage.getItem('accessoEffettuato')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});

describe('Route del profilo', () => {
  it('tutte le pagine del profilo richiedono il login', () => {
    const profileRoutes = routes.filter(r => r.path?.startsWith('profile'));
    expect(profileRoutes.length).toBe(3);
    for (const route of profileRoutes) {
      expect(route.canActivate).withContext(route.path!).toContain(authGuard);
    }
  });
});
