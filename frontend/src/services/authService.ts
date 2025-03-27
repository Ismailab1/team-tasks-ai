// Auth service for managing authentication state

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

const TOKEN_KEY = 'team_tasks_auth_token';
const USER_KEY = 'team_tasks_user';

const authService = {
  // Login user
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register user
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  },

  // Get token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get user data
  getUserData(): User | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Update user profile
  async updateProfile(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      // Update stored user data
      const currentUser = this.getUserData();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      return data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = this.getUserData();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Reset password request (forgot password)
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return true;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  // Confirm password reset with token and new password
  async confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset confirmation failed');
      }

      return true;
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw error;
    }
  },

  // Refresh authentication token
  async refreshToken(): Promise<string> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }

      return data.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
};

export default authService;