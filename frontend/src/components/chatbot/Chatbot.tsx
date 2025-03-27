// src/components/Chatbot/Chatbot.tsx
import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I assist you with your tasks today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Make API call to backend
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage.content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }
      
      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Chat trigger button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50"
          aria-label="Open chat assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div className={`fixed ${isMinimized ? 'bottom-6 right-6 w-auto h-auto' : 'bottom-6 right-6 w-96 h-[500px]'} bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50 overflow-hidden transition-all duration-200`}>
          {/* Chat header */}
          <div className="bg-indigo-600 text-white p-3 flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Team Tasks Assistant</h3>
            </div>
            <div className="flex space-x-2">
              {isMinimized ? (
                <button onClick={() => setIsMinimized(false)} className="text-white hover:text-gray-200">
                  <Maximize2 className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => setIsMinimized(true)} className="text-white hover:text-gray-200">
                  <Minimize2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              {/* Messages container */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.map(msg => (
                  <div key={msg.id} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block rounded-lg p-3 max-w-[80%] ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="text-left mb-4">
                    <div className="inline-block rounded-lg p-3 max-w-[80%] bg-white border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isTyping}
                  />
                  <button 
                    type="submit"
                    className={`${isTyping ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white p-2 rounded transition-colors`}
                    disabled={isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default Chatbot;