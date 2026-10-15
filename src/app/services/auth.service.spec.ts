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
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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

  it('deleteAccount manda la password e, se va a buon fine, pulisce lo stato come il logout', async () => {
    const deleting = firstValueFrom(service.deleteAccount('segreta1'));
    const req = httpMock.expectOne('/api/user/delete');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ currentPassword: 'segreta1' });
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ message: 'Account eliminato' });
    await deleting;

    expect(await firstValueFrom(service.accessoEffettuato$)).toBeFalse();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('deleteAccount con un errore non tocca lo stato locale', async () => {
    const deleting = firstValueFrom(service.deleteAccount('sbagliata'));
    httpMock
      .expectOne('/api/user/delete')
      .flush({ error: 'Password attuale errata' }, { status: 403, statusText: 'Forbidden' });
    await expectAsync(deleting).toBeRejected();

    expect(await firstValueFrom(service.accessoEffettuato$)).toBeTrue();
    expect(localStorage.getItem('userData')).not.toBeNull();
  });

  it('updateLocalUserData senza foto toglie anche quella salvata', () => {
    localStorage.setItem('profileImage', 'data:image/jpeg;base64,vecchia');
    service.updateLocalUserData({ username: 'diego', profileImage: null });
    expect(localStorage.getItem('profileImage')).toBeNull();
    expect(service.getCurrentUserData().profileImage).toBeNull();
  });
});

describe('AuthService - login e registrazione', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login invia email, password e rememberMe con i cookie e aggiorna lo stato locale', async () => {
    let result: any;
    service.login('mario@example.com', 'segreta', true).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'mario@example.com',
      password: 'segreta',
      rememberMe: true,
    });
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ username: 'mario', email: 'mario@example.com' });

    expect(result).toEqual({ username: 'mario', email: 'mario@example.com' });
    expect(localStorage.getItem('username')).toBe('mario');
    expect(localStorage.getItem('email')).toBe('mario@example.com');
    expect(localStorage.getItem('accessoEffettuato')).toBe('true');
    expect(await firstValueFrom(service.accessoEffettuato$)).toBeTrue();

    // notifyLogin() recupera il profilo
    const profile = httpMock.expectOne('/api/auth/profile');
    profile.flush({ username: 'mario', profileImage: 'img.png' });
    expect(localStorage.getItem('profileImage')).toBe('img.png');
    expect(service.getCurrentUserData().username).toBe('mario');
  });

  it('login non scrive nulla e non notifica se il backend risponde con un errore', async () => {
    let status = 0;
    service
      .login('mario@example.com', 'sbagliata', false)
      .subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne('/api/auth/login')
      .flush({ error: 'no' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(localStorage.length).toBe(0);
    expect(await firstValueFrom(service.accessoEffettuato$)).toBeFalse();
    httpMock.expectNone('/api/auth/profile');
  });

  it('register invia username, email e password con i cookie e salva lo username', () => {
    let result: any;
    service.register('mario', 'mario@example.com', 'segreta').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'mario',
      email: 'mario@example.com',
      password: 'segreta',
    });
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ message: 'ok' });

    expect(result).toEqual({ message: 'ok' });
    expect(localStorage.getItem('username')).toBe('mario');
  });

  it('register non scrive nulla se il backend risponde con un errore', () => {
    let status = 0;
    service
      .register('mario', 'mario@example.com', 'segreta')
      .subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne('/api/auth/register')
      .flush({ error: 'dup' }, { status: 409, statusText: 'Conflict' });

    expect(status).toBe(409);
    expect(localStorage.getItem('username')).toBeNull();
  });
});

describe('Route del profilo', () => {
  it('tutte le pagine del profilo richiedono il login', () => {
    const profileRoutes = routes.filter((r) => r.path?.startsWith('profile'));
    // profilo, libreria, preferiti, lista di un amico
    expect(profileRoutes.length).toBe(4);
    for (const route of profileRoutes) {
      expect(route.canActivate).withContext(route.path!).toContain(authGuard);
    }
  });
});
