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
});
