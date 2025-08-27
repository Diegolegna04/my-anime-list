import { Component, OnInit } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-login-register',
  imports: [
    FormsModule,
    NgClass,
    NgIf
],
  templateUrl: './login-register.component.html',
  standalone: true,
  styleUrl: './login-register.component.css'
})
export class LoginRegisterComponent implements OnInit {
  private apiUrl = 'http://localhost:8080/api/auth';
  isRegistering: boolean = false;
  accessoEffettuato: boolean = false;
  isLoading: boolean = false;
  passwordType: string = 'password';

  constructor(private http: HttpClient, private route: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.accessoEffettuato = JSON.parse(localStorage.getItem('accessoEffettuato') || 'false');
  }

  loginData = {
    email: '',
    password: '',
  };

  registerData = {
    username: '',
    email: '',
    password: '',
  };

  toggleRegister(): void {
    this.isRegistering = !this.isRegistering;
  }

  togglePasswordVisibility(): void {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  onLogin(): void {
    this.isLoading = true;
    const hashedPassword = CryptoJS.SHA256(this.loginData.password).toString();

    const requestBody = {
      email: this.loginData.email,
      password: hashedPassword
    };
    
    this.http.post(`${this.apiUrl}/login`, requestBody, {
      headers: {'Content-Type': 'application/json'},
      withCredentials: true
    })
    .subscribe({
      next: async (response: any) => {
        this.isLoading = false;
        
        if (response) {
          // Salva i dati dell'utente dal backend
          if (response.username) {
            localStorage.setItem('username', response.username);
          }
          if (response.email) {
            localStorage.setItem('email', response.email);
          }
          
          await alert("Login avvenuto con successo");
          
          this.accessoEffettuato = true;
          this.authService.notifyLogin();

          await this.route.navigate(['/']);
        }
      },
      error: async (error: any) => {
        this.isLoading = false;
        if (error.status === 401) {
          alert("Credenziali non valide");
        } else if (error.status === 500) {
          alert("Errore del server, prova più tardi");
        } else {
          alert("Errore sconosciuto");
        }
      }
    });
  }

  onRegister(): void {
    const hashedPassword = CryptoJS.SHA256(this.registerData.password).toString();

    const requestBody = {
      username: this.registerData.username,
      email: this.registerData.email,
      password: hashedPassword
    };

    console.log('Dati registrazione inviati:', requestBody);

    this.http
      .post(`${this.apiUrl}/register`, requestBody, {
      headers: {'Content-Type': 'application/json'},
      withCredentials: true,
    })
    .subscribe({
      next: async (response: any) => {
        if (response) {
          await alert("Registrazione avvenuta con successo");

          localStorage.setItem('username', this.registerData.username);

          this.isRegistering = false;
          this.registerData = { username: '', email: '', password: '' };
        } else if (response && response.success) {
          await alert("Registrazione avvenuta con successo");

          localStorage.setItem('username', this.registerData.username);

          this.isRegistering = false;
          this.registerData = { username: '', email: '', password: '' };
        }
      },
      error: async (error: { status: number; }) => {
        if (error.status === 409) {
          alert("Email già in uso, prova un'altra email");
        } else if (error.status === 500) {
          alert("Errore del server, prova più tardi");
        } else {
          alert("Errore sconosciuto");
        }
      }
    });
  }

  get emailModel(): string {
    return this.isRegistering ? this.registerData.email : this.loginData.email;
  }

  set emailModel(value: string) {
    if (this.isRegistering) {
      this.registerData.email = value;
    } else {
      this.loginData.email = value;
    }
  }

  get passwordModel(): string {
    return this.isRegistering ? this.registerData.password : this.loginData.password;
  }

  set passwordModel(value: string) {
    if (this.isRegistering) {
      this.registerData.password = value;
    } else {
      this.loginData.password = value;
    }
  }
}
