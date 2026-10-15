import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileComponent } from './profile.component';
import { ToastService } from '../services/toast.service';

describe('ProfileComponent - saveSettings', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let httpMock: HttpTestingController;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast }
      ]
    })
    .compileComponents();

    // Niente detectChanges: ngOnInit non parte, testiamo solo saveSettings
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('manda la nuova password in chiaro insieme alla password attuale', async () => {
    component.settingsData.currentPassword = 'vecchia-password';
    component.settingsData.newPassword = 'nuova-password';
    component.settingsData.confirmPassword = 'nuova-password';

    const saving = component.saveSettings();
    const req = httpMock.expectOne('/api/user/update');

    expect(req.request.method).toBe('PUT');
    expect(req.request.body.password).toBe('nuova-password');
    expect(req.request.body.currentPassword).toBe('vecchia-password');

    req.flush({ username: 'diego' });
    await saving;
    expect(toast.show).toHaveBeenCalledWith('Impostazioni aggiornate con successo!', 'success');
  });

  it('non chiama il backend se manca la password attuale', async () => {
    component.settingsData.newPassword = 'nuova-password';
    component.settingsData.confirmPassword = 'nuova-password';

    await component.saveSettings();

    httpMock.expectNone('/api/user/update');
    expect(toast.show).toHaveBeenCalledWith('Inserisci la password attuale per cambiarla.', 'error');
  });

  it('mostra un errore chiaro se la password attuale è sbagliata (403)', async () => {
    component.settingsData.currentPassword = 'sbagliata';
    component.settingsData.newPassword = 'nuova-password';
    component.settingsData.confirmPassword = 'nuova-password';

    const saving = component.saveSettings();
    httpMock.expectOne('/api/user/update').flush(
      { error: 'Password attuale errata' },
      { status: 403, statusText: 'Forbidden' }
    );
    await saving;

    expect(toast.show).toHaveBeenCalledWith('Password attuale errata.', 'error');
  });

  it('Esc chiude il dialog del profilo e scarta le modifiche non salvate', () => {
    component.openSettings();
    component.settingsData.newPassword = 'non-salvata';

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.showOverlay).toBeFalse();
    expect(component.settingsData.newPassword).toBe('');
  });

  it('Esc premuto dentro un campo delle impostazioni chiude il dialog', async () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/user-anime/stats').flush({});
    httpMock.expectOne('/api/user-anime/evidenza').flush([]);
    await fixture.whenStable();

    component.openSettings();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#settings-password');
    expect(input).not.toBeNull();
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(component.showOverlay).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    // Pannello amici della pagina: non interessa qui
    httpMock.match('/api/friends').forEach((req) => req.flush([]));
  });

  it('Esc a dialog chiuso non tocca i dati', () => {
    const close = spyOn(component, 'closeOverlay');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(close).not.toHaveBeenCalled();
  });
});
