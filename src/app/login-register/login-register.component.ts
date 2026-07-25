import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-login-register',
  imports: [
    FormsModule,
    NgClass,
    NgIf,
    RouterLink,
  ],
  templateUrl: './login-register.component.html',
  standalone: true,
  styleUrl: './login-register.component.css'
})
export class LoginRegisterComponent implements OnInit {
  private apiUrl = '/api/auth';
  isRegistering: boolean = false;
  accessoEffettuato: boolean = false;
  isLoading: boolean = false;
  passwordType: string = 'password';

  // Mostrato quando il login fallisce perché l'email non è ancora stata verificata
  showResendVerification: boolean = false;
  isResending: boolean = false;

  constructor(
    private http: HttpClient,
    private route: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.accessoEffettuato = JSON.parse(localStorage.getItem('accessoEffettuato') || 'false');
  }

  loginData = {
    email: '',
    password: '',
    rememberMe: false,
  };

  registerData = {
    username: '',
    email: '',
    password: '',
  };

  toggleRegister(): void {
    this.isRegistering = !this.isRegistering;
    this.showResendVerification = false;
  }

  togglePasswordVisibility(): void {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  onLogin(): void {
    this.isLoading = true;
    this.showResendVerification = false;
    const hashedPassword = CryptoJS.SHA256(this.loginData.password).toString();

    const requestBody = {
      email: this.loginData.email,
      password: hashedPassword,
      rememberMe: this.loginData.rememberMe
    };

    this.http.post(`${this.apiUrl}/login`, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    })
    .subscribe({
      next: async (response: any) => {
        this.isLoading = false;

        if (response) {
          if (response.username) localStorage.setItem('username', response.username);
          if (response.email) localStorage.setItem('email', response.email);

          this.toastService.show('Accesso effettuato con successo! Benvenuto.', 'success');

          this.accessoEffettuato = true;
          this.authService.notifyLogin();

          setTimeout(async () => {
            await this.route.navigate(['/']);
          }, 1500);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.toastService.show('Credenziali non valide. Controlla email e password.', 'error');
        } else if (error.status === 403 && error?.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.toastService.show('Devi verificare la tua email prima di accedere.', 'error');
          this.showResendVerification = true;
        } else if (error.status === 500) {
          this.toastService.show('Errore del server. Riprova più tardi.', 'error');
        } else {
          this.toastService.show('Si è verificato un errore. Riprova.', 'error');
        }
      }
    });
  }

  resendVerificationEmail(): void {
    if (!this.loginData.email || this.isResending) return;
    this.isResending = true;

    this.authService.resendVerification(this.loginData.email).subscribe({
      next: () => {
        this.isResending = false;
        this.toastService.show('Se l\'indirizzo non è ancora verificato, riceverai una nuova email a breve.', 'success');
      },
      error: () => {
        this.isResending = false;
        this.toastService.show('Impossibile inviare l\'email in questo momento. Riprova più tardi.', 'error');
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

    this.http
      .post(`${this.apiUrl}/register`, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .subscribe({
        next: async (response: any) => {
          this.isLoading = false;

          if (response) {
            this.toastService.show('Registrazione completata! Controlla la tua email per verificare l\'account.', 'success');
            localStorage.setItem('username', this.registerData.username);

            setTimeout(() => {
              this.isRegistering = false;
              this.registerData = { username: '', email: '', password: '' };
            }, 1500);
          }
        },
        error: (error: { status: number }) => {
          this.isLoading = false;
          if (error.status === 409) {
            this.toastService.show('Email già registrata. Prova con un\'altra email.', 'error');
          } else if (error.status === 500) {
            this.toastService.show('Errore del server. Riprova più tardi.', 'error');
          } else {
            this.toastService.show('Si è verificato un errore. Riprova.', 'error');
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
