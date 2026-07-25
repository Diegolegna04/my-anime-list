import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  tokenMissing: boolean = false;

  password: string = '';
  confirmPassword: string = '';
  passwordType: string = 'password';

  isLoading: boolean = false;
  success: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.tokenMissing = !this.token;
  }

  togglePasswordVisibility(): void {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  get passwordsMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  onSubmit(): void {
    if (!this.token || this.passwordsMismatch || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';
    const hashedPassword = CryptoJS.SHA256(this.password).toString();

    this.authService.resetPassword(this.token, hashedPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.success = true;
        this.toastService.show('Password reimpostata con successo!', 'success');
        setTimeout(() => this.router.navigate(['/register-login']), 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'Il link non è valido o è scaduto. Richiedine uno nuovo.';
      }
    });
  }
}
