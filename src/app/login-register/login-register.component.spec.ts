import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginRegisterComponent } from './login-register.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('LoginRegisterComponent', () => {
  let component: LoginRegisterComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register', 'resendVerification']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['show']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
      ]
    });
    component = TestBed.createComponent(LoginRegisterComponent).componentInstance;
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  it('il login chiama AuthService.login con i valori del form', () => {
    auth.login.and.returnValue(of({ username: 'mario' }));
    component.loginData = { email: 'mario@example.com', password: 'segreta', rememberMe: true };

    component.onLogin();

    expect(auth.login).toHaveBeenCalledOnceWith('mario@example.com', 'segreta', true);
    expect(toast.show).toHaveBeenCalledWith('Accesso effettuato con successo! Benvenuto.', 'success');
    expect(component.accessoEffettuato).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('il login fallito per credenziali errate mostra il messaggio di errore', () => {
    auth.login.and.returnValue(throwError(() => ({ status: 401 })));

    component.onLogin();

    expect(toast.show).toHaveBeenCalledWith('Credenziali non valide. Controlla email e password.', 'error');
    expect(component.isLoading).toBeFalse();
    expect(component.accessoEffettuato).toBeFalse();
  });

  it('il login fallito mostra il messaggio del server per 429', () => {
    auth.login.and.returnValue(throwError(() => ({ status: 429, error: { error: 'Troppi tentativi' } })));

    component.onLogin();

    expect(toast.show).toHaveBeenCalledWith('Troppi tentativi', 'error');
  });

  it('email non verificata propone il reinvio', () => {
    auth.login.and.returnValue(throwError(() => ({ status: 403, error: { code: 'EMAIL_NOT_VERIFIED' } })));

    component.onLogin();

    expect(component.showResendVerification).toBeTrue();
  });

  it('la registrazione chiama AuthService.register con i valori del form', () => {
    auth.register.and.returnValue(of({ message: 'ok' }));
    component.registerData = { username: 'mario', email: 'mario@example.com', password: 'segreta' };

    component.onRegister();

    expect(auth.register).toHaveBeenCalledOnceWith('mario', 'mario@example.com', 'segreta');
    expect(toast.show).toHaveBeenCalledWith(
      "Registrazione completata! Controlla la tua email per verificare l'account.", 'success');
  });

  it('la registrazione fallita mostra il messaggio del server', () => {
    auth.register.and.returnValue(throwError(() => ({ status: 409, error: { error: 'Nome utente già in uso' } })));
    component.registerData = { username: 'mario', email: 'mario@example.com', password: 'segreta' };

    component.onRegister();

    expect(toast.show).toHaveBeenCalledWith('Nome utente già in uso', 'error');
    expect(component.isLoading).toBeFalse();
  });

  it('la registrazione con password troppo corta non chiama il servizio', () => {
    component.registerData = { username: 'mario', email: 'mario@example.com', password: '123' };

    component.onRegister();

    expect(auth.register).not.toHaveBeenCalled();
    expect(toast.show).toHaveBeenCalledWith('La password deve avere almeno 6 caratteri.', 'error');
  });
});
