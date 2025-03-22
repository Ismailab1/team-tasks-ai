// Authentication service

const TOKEN_KEY = 'user_token';

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

// Parse JWT
const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Get user data from token
const getUserData = (): any => {
  const token = getToken();
  if (!token) return null;
  
  const userData = parseJwt(token);
  return userData;
};

const login = async (email: string, password: string): Promise<any> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register user
const register = async (name: string, email: string, password: string): Promise<any> => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Save token to localStorage
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout user
const logout = (): void => {
  removeToken();
  // Reload or redirect to login page
  window.location.href = '/login';
};

// Auth service object
const authService = {
  login,
  register,
  logout,
  getToken,
  isAuthenticated,
  getUserData,
};

export default authService;