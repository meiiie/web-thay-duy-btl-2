import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class AdminLoginComponent implements OnInit, AfterViewInit {
  username: string = '';
  password: string = '';
  isLoading = false;
  errorMessage: string = '';
  returnUrl: string = '/admin';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
    
    // If already logged in, redirect to admin
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  async onSubmit() {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.login(this.username.trim(), this.password);
      
      if (result.success) {
        // Login successful, redirect to admin or return URL
        this.router.navigate([this.returnUrl]);
      } else {
        this.errorMessage = result.message;
      }
    } catch (error: any) {
      this.errorMessage = `Lỗi đăng nhập: ${error.message}`;
    } finally {
      this.isLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSubmit();
    }
  }

  clearError() {
    this.errorMessage = '';
  }

  onInputFocus(field: string) {
    // Add focus effects if needed
  }

  onInputBlur(field: string) {
    // Add blur effects if needed
  }

  fillUsername() {
    this.username = 'admin';
    this.clearError();
  }

  fillPassword() {
    this.password = 'admin123';
    this.clearError();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Auto-focus username field when component loads
  ngAfterViewInit() {
    // Focus on username field after view initialization
    setTimeout(() => {
      const usernameField = document.getElementById('username');
      if (usernameField) {
        usernameField.focus();
      }
    }, 100);
  }
}