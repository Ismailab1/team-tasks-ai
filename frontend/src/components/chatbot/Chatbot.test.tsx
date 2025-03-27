import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/';
import Chatbot from './Chatbot';

// Mock the API client
jest.mock('../../services/apiClient', () => ({
  post: jest.fn().mockResolvedValue({ response: "Mock response" })
}));

describe('Chatbot Component', () => {
  beforeEach(() => {
    // Reset any runtime timers
    jest.useRealTimers();
  });

  test('renders chatbot button when closed', () => {
    render(<Chatbot />);
    
    // Check that the initial button is shown
    const chatbotButton = screen.getByRole('button', { name: /open chat assistant/i });
    expect(chatbotButton).toBeInTheDocument();
    
    // And the chat window is not present
    const chatWindow = screen.queryByText('Team Tasks Assistant');
    expect(chatWindow).not.toBeInTheDocument();
  });

  test('opens chat window when button is clicked', () => {
    render(<Chatbot />);
    
    // Click the chatbot button
    const chatbotButton = screen.getByRole('button', { name: /open chat assistant/i });
    fireEvent.click(chatbotButton);
    
    // Now the chat window should be visible
    const chatHeader = screen.getByText('Team Tasks Assistant');
    expect(chatHeader).toBeInTheDocument();
    
    // And the initial message should be displayed
    const welcomeMessage = screen.getByText('Hello! How can I assist you with your tasks today?');
    expect(welcomeMessage).toBeInTheDocument();
  });

  test('sends message and receives response', async () => {
    // Use fake timers for controlling setTimeout
    jest.useFakeTimers();
    
    render(<Chatbot />);
    
    // Open the chatbot
    const chatbotButton = screen.getByRole('button', { name: /open chat assistant/i });
    fireEvent.click(chatbotButton);
    
    // Type a message
    const inputField = screen.getByPlaceholderText('Type a message...');
    await userEvent.type(inputField, 'What are my tasks?');
    
    // Send the message
    const sendButton = screen.getByRole('button', {name: /send/i});
    fireEvent.click(sendButton);
    
    // Verify that the message was sent
    expect(screen.getByText('What are my tasks?')).toBeInTheDocument();
    
    // Advance timers to simulate API response delay
    jest.advanceTimersByTime(1000);
    
    // Wait for the bot response
    await waitFor(() => {
      expect(screen.getByText("You have 3 active tasks assigned to you. Would you like me to list them?")).toBeInTheDocument();
    });
  });

  test('minimizes and maximizes the chat window', () => {
    render(<Chatbot />);
    
    // Open the chatbot
    const chatbotButton = screen.getByRole('button', { name: /open chat assistant/i });
    fireEvent.click(chatbotButton);
    
    // Click minimize button (using the icon title or a data attribute would be more robust)
    const minimizeButton = screen.getByRole('button', { 
      name: /minimize/i 
    });
    fireEvent.click(minimizeButton);
    
    // Check that the chat content is not visible
    const inputField = screen.queryByPlaceholderText('Type a message...');
    expect(inputField).not.toBeInTheDocument();
    
    // Click maximize button
    const maximizeButton = screen.getByRole('button', {
      name: /maximize/i
    });
    fireEvent.click(maximizeButton);
    
    // Now the input should be visible again
    const visibleInputField = screen.getByPlaceholderText('Type a message...');
    expect(visibleInputField).toBeInTheDocument();
  });

  test('closes the chat window', () => {
    render(<Chatbot />);
    
    // Open the chatbot
    const chatbotButton = screen.getByRole('button', { name: /open chat assistant/i });
    fireEvent.click(chatbotButton);
    
    // Click close button (using the icon appearance)
    const closeButton = screen.getByRole('button', {
      name: /close/i
    });
    fireEvent.click(closeButton);
    
    // The chat window should be closed and the button should be visible again
    const newChatbotButton = screen.getByRole('button', { name: /open chat assistant/i });
    expect(newChatbotButton).toBeInTheDocument();
    
    const chatHeader = screen.queryByText('Team Tasks Assistant');
    expect(chatHeader).not.toBeInTheDocument();
  });
});
