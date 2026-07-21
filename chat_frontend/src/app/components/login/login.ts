import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  errors: Record<string, string> = {};
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  clearFieldError(field: string): void {
    delete this.errors[field];
  }

  private validateForm(): boolean {
    this.errors = {};

    const requiredFields: Array<{ key: 'email' | 'password'; label: string }> = [
      { key: 'email', label: 'Email' },
      { key: 'password', label: 'Password' }
    ];

    for (const field of requiredFields) {
      const value = this[field.key].trim();
      if (!value) {
        this.errors[field.key] = `${field.label} cannot be blank.`;
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        const backendError = error?.error ?? {};
        const message = Array.isArray(backendError.error)
          ? backendError.error[0]
          : backendError.error || 'Unable to sign in.';

        this.errors['email'] = message;
      }
    });
  }
}
