import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../services/auth.service';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['forgotPassword']);
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }]
    }).compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    component.email = 'diego@example.com';
  });

  it('con troppi tentativi mostra il messaggio del server e resta sul form', () => {
    authService.forgotPassword.and.returnValue(throwError(() => ({
      status: 429, error: { error: 'Troppi tentativi. Riprova tra 60 minuti.' }
    })));

    component.onSubmit();
    fixture.detectChanges();

    expect(component.submitted).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Troppi tentativi. Riprova tra 60 minuti.');
  });

  it('con altri errori mostra la conferma generica (non rivela se l\'email esiste)', () => {
    authService.forgotPassword.and.returnValue(throwError(() => ({ status: 500 })));

    component.onSubmit();

    expect(component.submitted).toBeTrue();
    expect(component.errorMessage).toBe('');
  });
});
