import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

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
  isRegistering: boolean = false;
  accessoEffettuato: boolean = false;
  isLoading: boolean = false;
  passwordType: string = 'password';

  // Mostrato quando il login fallisce perché l'email non è ancora stata verificata
  showResendVerification: boolean = false;
  isResending: boolean = false;

  constructor(
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

    this.authService
      .login(this.loginData.email, this.loginData.password, this.loginData.rememberMe)
      .subscribe({
      next: async (response: any) => {
        this.isLoading = false;

        if (response) {
          this.toastService.show('Accesso effettuato con successo! Benvenuto.', 'success');

          this.accessoEffettuato = true;

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
        } else if (error.status === 400 || error.status === 429) {
          this.toastService.show(this.serverMessage(error, 'Controlla i dati inseriti.'), 'error');
        } else if (error.status === 500) {
          this.toastService.show('Errore del server. Riprova più tardi.', 'error');
        } else {
          this.toastService.show('Si è verificato un errore. Riprova.', 'error');
        }
      }
    });
  }

  /** Il backend risponde con {"error": "..."}: il suo messaggio è già pensato per l'utente */
  private serverMessage(error: any, fallback: string): string {
    return error?.error?.error || fallback;
  }

  resendVerificationEmail(): void {
    if (!this.loginData.email || this.isResending) return;
    this.isResending = true;

    this.authService.resendVerification(this.loginData.email).subscribe({
      next: () => {
        this.isResending = false;
        this.toastService.show('Se l\'indirizzo non è ancora verificato, riceverai una nuova email a breve.', 'success');
      },
      error: (error: any) => {
        this.isResending = false;
        const fallback = 'Impossibile inviare l\'email in questo momento. Riprova più tardi.';
        this.toastService.show(error.status === 429 ? this.serverMessage(error, fallback) : fallback, 'error');
      }
    });
  }

  onRegister(): void {
    // Stessa regola del backend: così l'errore arriva subito, senza una richiesta
    if (this.registerData.password.length < 6) {
      this.toastService.show('La password deve avere almeno 6 caratteri.', 'error');
      return;
    }
    this.isLoading = true;

    this.authService
      .register(this.registerData.username, this.registerData.email, this.registerData.password)
      .subscribe({
        next: async (response: any) => {
          this.isLoading = false;

          if (response) {
            this.toastService.show('Registrazione completata! Controlla la tua email per verificare l\'account.', 'success');

            setTimeout(() => {
              this.isRegistering = false;
              this.registerData = { username: '', email: '', password: '' };
            }, 1500);
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          if (error.status === 409) {
            // "Email già registrata" oppure "Nome utente già in uso"
            this.toastService.show(this.serverMessage(error, 'Email già registrata. Prova con un\'altra email.'), 'error');
          } else if (error.status === 400 || error.status === 429) {
            this.toastService.show(this.serverMessage(error, 'Controlla i dati inseriti.'), 'error');
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
