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

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.email) return;
    this.isLoading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.submitted = true;
      },
      error: () => {
        // Anche in caso di errore mostriamo lo stesso messaggio generico:
        // non vogliamo rivelare se l'email esiste o meno nel sistema.
        this.isLoading = false;
        this.submitted = true;
      }
    });
  }
}
