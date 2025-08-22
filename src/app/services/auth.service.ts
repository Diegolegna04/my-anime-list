import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoginRequest} from '../loginrequest';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private accessoEffettuatoSubject = new BehaviorSubject<boolean>(this.checkInitialAuthState());
  accessoEffettuato$ = this.accessoEffettuatoSubject.asObservable();

  // Nuovo BehaviorSubject per i dati dell'utente
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
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(username: string, password: string): Observable<any> {
    const loginRequest: LoginRequest = { username, password};
    return this.http.post(`${this.apiUrl}/login`, loginRequest);
  }

  // Nuovo metodo per recuperare i dati del profilo utente dal backend
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { withCredentials: true });
  }

  notifyLogin(): void {
    localStorage.setItem('accessoEffettuato', JSON.stringify(true));
    this.accessoEffettuatoSubject.next(true);
    
    // Dopo il login, recupera i dati dell'utente dal backend
    this.getUserProfile().subscribe({
      next: (userData) => {
        console.log('Dati utente recuperati:', userData);
        // Salva i dati nel localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('username', userData.username);
        
        // Se hai altre proprietà come profileImage
        if (userData.profileImage) {
          localStorage.setItem('profileImage', userData.profileImage);
        }
        
        // Notifica i componenti che i dati sono cambiati
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
        // Rimuovi tutti i dati dell'utente
        localStorage.removeItem('accessoEffettuato');
        localStorage.removeItem('userData');
        localStorage.removeItem('username');
        localStorage.removeItem('profileImage');
        
        // Aggiorna gli Observable
        this.accessoEffettuatoSubject.next(false);
        this.userDataSubject.next(null);
        
        this.route.navigate(['/']);
      }
    });
  }

  // Metodo per ottenere i dati utente correnti
  getCurrentUserData(): any {
    return this.userDataSubject.value;
  }
}
