import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/';
import React from 'react';
import { Provider } from "react-redux";
import store from "../store/store";
import { StrictMode } from "react";
import 'jest';
import App from '../src/App';
import { AuthProvider } from '../src/context/authContext';
import * as authContext from '../src/context/authContext';
import { MemoryRouter } from 'react-router-dom';

// Mock the auth context
const mockLogout = jest.fn();
const mockLogin = jest.fn();
const mockRegister = jest.fn();

// Define a complete mock for reuse
const createAuthMock = (overrides = {}) => ({
  isAuthenticated: true,
  isLoading: false,
  logout: mockLogout,
  login: mockLogin,
  register: mockRegister,
  user: { 
    id: 'test-user-id', 
    name: 'Test User', 
    email: 'test@example.com' 
  },
  ...overrides
});

// Apply the mock before each test
beforeEach(() => {
  jest.spyOn(authContext, 'useAuth').mockImplementation(() => createAuthMock());
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
});

// Option 1: If your App component has a Router inside it, use memory history instead
// Import the App without the Router wrapper
import AppContent  from '../src/App'; // This would be a hypothetical export of App's content without Router

// Fix the renderApp function
const renderApp = (initialRoute = '/') => {
  return render(
    <StrictMode>
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </MemoryRouter>
      </Provider>
    </StrictMode>
  );
};

// Option 2: If you can't modify App.tsx, mock the router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <>{children}</>, // Mock the BrowserRouter to just render children
}));

// Alternative renderApp if you can't modify App.tsx
const renderAppAlternative = (initialRoute = '/') => {
  // Mock the window location to simulate navigation
  window.history.pushState({}, 'Test page', initialRoute);
  
  return render(
    <StrictMode>
      <Provider store={store}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    </StrictMode>
  );
};

// Tests remain the same
test('renders header when authenticated', () => {
  renderApp(); // or renderAppAlternative() if using Option 2
  expect(screen.getByText('Team Tasks AI - Dashboard')).toBeInTheDocument();
});

test('renders navigation links when authenticated', () => {
  renderApp();
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Check-ins')).toBeInTheDocument();
  expect(screen.getByText('Tasks')).toBeInTheDocument();
  expect(screen.getByText('Profile')).toBeInTheDocument();
});

test('displays user name when authenticated', () => {
  renderApp();
  expect(screen.getByText('Test User')).toBeInTheDocument();
});

test('logout button calls logout function when clicked', () => {
  const testMockLogout = jest.fn();
  
  // Override the default mock for this specific test
  jest.spyOn(authContext, 'useAuth').mockImplementation(() => 
    createAuthMock({ logout: testMockLogout })
  );
  
  renderApp();
  fireEvent.click(screen.getByText('Logout'));
  expect(testMockLogout).toHaveBeenCalled();
});

test('routes to not found page for invalid routes', () => {
  renderApp('/invalid-route');
  expect(screen.getByText('Not Found')).toBeInTheDocument();
});