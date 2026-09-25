import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading: boolean = false;
  submitted: boolean = false;
  errorMessage: string = '';

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.email) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.submitted = true;
      },
      error: (error: any) => {
        this.isLoading = false;
        // Troppe richieste: lo diciamo, non rivela se l'email esiste
        if (error.status === 429) {
          this.errorMessage = error?.error?.error || 'Troppi tentativi. Riprova più tardi.';
          return;
        }
        // Negli altri casi lo stesso messaggio generico del successo:
        // non vogliamo rivelare se l'email esiste o meno nel sistema.
        this.submitted = true;
      }
    });
  }
}
