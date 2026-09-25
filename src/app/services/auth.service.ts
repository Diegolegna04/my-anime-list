import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoginRequest} from '../loginrequest';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '/api/auth';
  private userApiUrl = '/api/user';
  private accessoEffettuatoSubject = new BehaviorSubject<boolean>(this.checkInitialAuthState());
  accessoEffettuato$ = this.accessoEffettuatoSubject.asObservable();

  private userDataSubject = new BehaviorSubject<any>(this.getUserDataFromStorage());
  userData$ = this.userDataSubject.asObservable();

  constructor(private http: HttpClient, private route: Router) {}

  private checkInitialAuthState(): boolean {
    const storedState = localStorage.getItem('accessoEffettuato');
    return storedState ? JSON.parse(storedState) : false;
  }

  private getUserDataFromStorage(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  register(username: string, password: string, email: string): Observable<any> {
    const user = { username, password, email };
    return this.http.post(`${this.apiUrl}/register`, user, { withCredentials: true });
  }

  login(username: string, password: string): Observable<any> {
    const loginRequest: LoginRequest = { username, password };
    return this.http.post(`${this.apiUrl}/login`, loginRequest, { withCredentials: true });
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { withCredentials: true });
  }

  updateProfile(payload: { username?: string; password?: string; currentPassword?: string; profileImage?: string }): Observable<any> {
    return this.http.put(`${this.userApiUrl}/update`, payload, { withCredentials: true });
  }

  // ---- Verifica email ----
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-email`, { params: { token } });
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email });
  }

  // ---- Recupero password ----
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, password: password });
  }

  notifyLogin(): void {
    localStorage.setItem('accessoEffettuato', JSON.stringify(true));
    this.accessoEffettuatoSubject.next(true);

    this.getUserProfile().subscribe({
      next: (userData) => {
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('username', userData.username);

        if (userData.profileImage) {
          localStorage.setItem('profileImage', userData.profileImage);
        }

        this.userDataSubject.next(userData);
      },
      error: (error) => {
        console.error('Errore nel recupero dati utente:', error);
      }
    });
  }

  validateSession(): void {
    this.getUserProfile().subscribe({
      next: (userData) => {
        localStorage.setItem('accessoEffettuato', JSON.stringify(true));
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('username', userData.username);
        this.accessoEffettuatoSubject.next(true);
        this.userDataSubject.next(userData);
      },
      error: () => {
        localStorage.removeItem('accessoEffettuato');
        localStorage.removeItem('userData');
        localStorage.removeItem('username');
        localStorage.removeItem('profileImage');
        this.accessoEffettuatoSubject.next(false);
        this.userDataSubject.next(null);
      }
    });
  }

  // Aggiorna lo stato locale con i dati freschi tornati dal backend
  // dopo un salvataggio riuscito delle impostazioni
  updateLocalUserData(userData: any): void {
    const merged = { ...this.userDataSubject.value, ...userData };
    localStorage.setItem('userData', JSON.stringify(merged));
    if (merged.username) localStorage.setItem('username', merged.username);
    if (merged.profileImage) localStorage.setItem('profileImage', merged.profileImage);
    this.userDataSubject.next(merged);
  }

  onLogout(): void {
    // Lo stato locale si pulisce comunque: se il backend non risponde l'utente
    // non deve restare "loggato" nell'interfaccia (la sessione scade da sola)
    const clearLocalSession = () => {
      localStorage.removeItem('accessoEffettuato');
      localStorage.removeItem('userData');
      localStorage.removeItem('username');
      localStorage.removeItem('profileImage');

      this.accessoEffettuatoSubject.next(false);
      this.userDataSubject.next(null);

      this.route.navigate(['/']);
    };

    this.http
      .delete(`${this.apiUrl}/logout`, { withCredentials: true })
      .subscribe({ next: clearLocalSession, error: clearLocalSession });
  }

  getCurrentUserData(): any {
    return this.userDataSubject.value;
  }
}
