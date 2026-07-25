import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

type VerifyStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  status: VerifyStatus = 'loading';
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      this.message = 'Link di verifica non valido: token mancante.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (res: any) => {
        this.status = 'success';
        this.message = res?.message || 'Email verificata con successo!';
        setTimeout(() => this.router.navigate(['/register-login']), 3000);
      },
      error: (err: any) => {
        this.status = 'error';
        this.message = err?.error?.error || 'Il link di verifica non è valido o è scaduto.';
      }
    });
  }
}
