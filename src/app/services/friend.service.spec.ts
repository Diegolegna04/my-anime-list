import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FriendService, friendErrorMessage } from './friend.service';

describe('FriendService', () => {
  let service: FriendService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FriendService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getOverview legge amici e richieste con il cookie di sessione', () => {
    let overview: unknown;
    service.getOverview().subscribe((o) => (overview = o));
    const req = httpMock.expectOne('/api/friends');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    const body = {
      friends: [{ id: 'f1', username: 'Sara', since: null }],
      incoming: [],
      outgoing: [],
    };
    req.flush(body);

    expect(overview).toEqual(body);
  });

  it('sendRequest manda lo username nel corpo', () => {
    service.sendRequest('Sara').subscribe();
    const req = httpMock.expectOne('/api/friends/requests');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'Sara' });
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ id: 'r1', username: 'Sara', createdAt: null });
  });

  it("accept usa l'id dell'amicizia", () => {
    service.accept('abc123').subscribe();
    const req = httpMock.expectOne('/api/friends/requests/abc123/accept');
    expect(req.request.method).toBe('PUT');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null);
  });

  it("remove cancella l'amicizia (rifiuto, annullamento e rimozione sono la stessa chiamata)", () => {
    service.remove('abc123').subscribe();
    const req = httpMock.expectOne('/api/friends/abc123');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null);
  });

  it('libreria e statistiche di un amico codificano lo username nel percorso', () => {
    service.getLibrary('Mario Rossi/2').subscribe();
    service.getStats('Mario Rossi/2').subscribe();

    const library = httpMock.expectOne('/api/friends/Mario%20Rossi%2F2/library');
    const stats = httpMock.expectOne('/api/friends/Mario%20Rossi%2F2/stats');
    expect(library.request.withCredentials).toBeTrue();
    expect(stats.request.withCredentials).toBeTrue();
    library.flush([]);
    stats.flush({});
  });
});

describe('friendErrorMessage', () => {
  it('usa il messaggio del backend quando c’è', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { error: 'Siete già amici', code: 'ALREADY_FRIENDS' },
    });
    expect(friendErrorMessage(error, 'Errore generico')).toBe('Siete già amici');
  });

  it('altrimenti usa il ripiego (backend giù, risposta non JSON)', () => {
    expect(friendErrorMessage(new HttpErrorResponse({ status: 0 }), 'Errore generico')).toBe(
      'Errore generico',
    );
    expect(
      friendErrorMessage(new HttpErrorResponse({ status: 502, error: '<html>' }), 'Riprova'),
    ).toBe('Riprova');
  });
});
