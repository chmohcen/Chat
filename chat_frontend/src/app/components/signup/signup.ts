import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  profilePicture?: File;
  errors: Record<string, string> = {};
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.profilePicture = file;
    }
  }

  clearFieldError(field: string): void {
    delete this.errors[field];
  }

  private validateForm(): boolean {

    const requiredFields: Array<{ key: 'name' | 'email' | 'password' | 'confirmPassword'; label: string }> = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'password', label: 'Password' },
      { key: 'confirmPassword', label: 'Confirm password' }
    ];

    for (const field of requiredFields) {
      const value = this[field.key].trim();
      if (!value) {
        this.errors[field.key] = `${field.label} cannot be blank.`;
      }
    }

    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      this.errors['confirmPassword'] = 'Passwords do not match.';
    }

    return Object.keys(this.errors).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    this.authService.signup({
      name: this.name,
      email: this.email,
      password: this.password,
      picture: this.profilePicture
    }).pipe(
      switchMap(() => this.authService.login({
        email: this.email,
        password: this.password
      })),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        const backendError = error?.error ?? {};

        for (const [field, message] of Object.entries(backendError)) {
          const errorMessage = Array.isArray(message) ? message[0] : message;
          this.errors[field] = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
        }
      }
    });
  }
}
