import React, { useState, useRef, useEffect } from 'react';
// FIX: Correct import path for types
import { ChatMessage } from './../types';
import { Icon } from './Icons';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  title: string;
  placeholder: string;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading, title, placeholder }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-black">
      <div className="p-4 border-b border-black">
        <h2 className="text-lg font-bold text-black">{title}</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-black text-white' : 'bg-white border border-black text-black'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg border border-black text-black">
                <Icon name="spinner" className="w-5 h-5 text-black" />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-black bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 p-2 border border-black rounded-md focus:ring-2 focus:ring-black focus:border-transparent outline-none transition placeholder:text-black/50"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-black text-white rounded-md disabled:opacity-50 hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <Icon name="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};