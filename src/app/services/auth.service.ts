import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AdminUser {
  username: string;
  password: string;
  name: string;
}

export interface StoredUserData {
  username: string;
  name: string;
  loginTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Simple hardcoded admin credentials (in production, use proper authentication)
  private readonly ADMIN_CREDENTIALS: AdminUser = {
    username: 'admin',
    password: 'admin123', // In production, use environment variables
    name: 'Quản trị viên'
  };

  private readonly AUTH_KEY = 'voting_app_admin_auth';
  
  // Signals for reactive state management
  isAuthenticated = signal(false);
  currentUser = signal<StoredUserData | null>(null);

  constructor(private router: Router) {
    this.checkStoredAuth();
  }

  /**
   * Check if there's stored authentication data
   */
  private checkStoredAuth(): void {
    const storedAuth = localStorage.getItem(this.AUTH_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.username === this.ADMIN_CREDENTIALS.username) {
          this.isAuthenticated.set(true);
          this.currentUser.set(authData);
        } else {
          this.clearAuth();
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        this.clearAuth();
      }
    }
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (username === this.ADMIN_CREDENTIALS.username && password === this.ADMIN_CREDENTIALS.password) {
        const userData = {
          username: this.ADMIN_CREDENTIALS.username,
          name: this.ADMIN_CREDENTIALS.name,
          loginTime: new Date().toISOString()
        };

        // Store authentication data
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(userData));
        
        // Update signals
        this.isAuthenticated.set(true);
        this.currentUser.set(userData);

        return {
          success: true,
          message: 'Đăng nhập thành công!'
        };
      } else {
        return {
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng!'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi đăng nhập: ${error.message}`
      };
    }
  }

  /**
   * Logout and clear authentication
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/admin/login']);
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem(this.AUTH_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get current user info
   */
  getCurrentUser(): StoredUserData | null {
    return this.currentUser();
  }

  /**
   * Check if current session is still valid
   */
  isSessionValid(): boolean {
    const storedAuth = localStorage.getItem(this.AUTH_KEY);
    if (!storedAuth) return false;

    try {
      const authData = JSON.parse(storedAuth);
      const loginTime = new Date(authData.loginTime);
      const now = new Date();
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours

      return (now.getTime() - loginTime.getTime()) < sessionDuration;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh session if needed
   */
  refreshSession(): void {
    if (!this.isSessionValid()) {
      this.logout();
    }
  }

  /**
   * Get login time for display
   */
  getLoginTime(): string | null {
    const user = this.currentUser();
    if (user && 'loginTime' in user) {
      return new Date((user as any).loginTime).toLocaleString('vi-VN');
    }
    return null;
  }
}