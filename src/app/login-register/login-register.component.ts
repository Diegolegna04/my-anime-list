import { Component, OnInit } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import * as CryptoJS from 'crypto-js';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

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
  
  toast: Toast = {
    message: '',
    type: 'info',
    show: false
  };

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

  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toast = { message, type, show: true };
    
    setTimeout(() => {
      this.toast.show = false;
    }, 4000);
  }

  closeToast(): void {
    this.toast.show = false;
  }

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
          
          this.showToast('Accesso effettuato con successo! Benvenuto.', 'success');
          
          this.accessoEffettuato = true;
          this.authService.notifyLogin();

          // Attendi che la notifica sia visibile prima di navigare
          setTimeout(async () => {
            await this.route.navigate(['/']);
          }, 1500);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.showToast('Credenziali non valide. Controlla email e password.', 'error');
        } else if (error.status === 500) {
          this.showToast('Errore del server. Riprova più tardi.', 'error');
        } else {
          this.showToast('Si è verificato un errore. Riprova.', 'error');
        }
      }
    });
  }

  onRegister(): void {
    this.isLoading = true;
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
        this.isLoading = false;
        
        if (response) {
          this.showToast('Registrazione completata! Benvenuto nella community.', 'success');

          localStorage.setItem('username', this.registerData.username);

          // Attendi un momento prima di passare al login
          setTimeout(() => {
            this.isRegistering = false;
            this.registerData = { username: '', email: '', password: '' };
          }, 1500);
        } else if (response && response.success) {
          this.showToast('Registrazione completata! Benvenuto nella community.', 'success');

          localStorage.setItem('username', this.registerData.username);

          setTimeout(() => {
            this.isRegistering = false;
            this.registerData = { username: '', email: '', password: '' };
          }, 1500);
        }
      },
      error: (error: { status: number; }) => {
        this.isLoading = false;
        if (error.status === 409) {
          this.showToast('Email già registrata. Prova con un\'altra email.', 'error');
        } else if (error.status === 500) {
          this.showToast('Errore del server. Riprova più tardi.', 'error');
        } else {
          this.showToast('Si è verificato un errore. Riprova.', 'error');
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
