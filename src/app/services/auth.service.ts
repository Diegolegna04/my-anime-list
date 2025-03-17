import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest} from '../loginrequest';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) {}

  register(username: string, password: string, email: string): Observable<any> {
    const user = { username, password, email };
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(username: string, password: string): Observable<any> {
    const loginRequest: LoginRequest = { username, password};
    return this.http.post(`${this.apiUrl}/login`, loginRequest);
  }
}
