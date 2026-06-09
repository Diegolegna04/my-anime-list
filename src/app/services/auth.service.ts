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

  notifyLogin(): void {
    localStorage.setItem('accessoEffettuato', JSON.stringify(true));
    this.accessoEffettuatoSubject.next(true);

    this.getUserProfile().subscribe({
      next: (userData) => {
        console.log('Dati utente recuperati:', userData);
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

  onLogout(): void {
    this.http
      .delete(`${this.apiUrl}/logout`, { withCredentials: true })
      .subscribe({
        next: () => {
          localStorage.removeItem('accessoEffettuato');
          localStorage.removeItem('userData');
          localStorage.removeItem('username');
          localStorage.removeItem('profileImage');

          this.accessoEffettuatoSubject.next(false);
          this.userDataSubject.next(null);

          this.route.navigate(['/']);
        }
      });
  }

  getCurrentUserData(): any {
    return this.userDataSubject.value;
  }
}
