import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

test('renders main application component', () => {
    render(<App />);
    const linkElement = screen.getByText(/welcome to the app/i);
    expect(linkElement).toBeInTheDocument();
});

test('handles user interaction', () => {
    render(<App />);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(buttonElement);
    const resultElement = screen.getByText(/you clicked the button/i);
    expect(resultElement).toBeInTheDocument();
});