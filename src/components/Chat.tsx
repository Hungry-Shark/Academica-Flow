import React, { useState } from 'react';
import { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  title?: string;
  placeholder?: string;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading, title = 'Assistant', placeholder = 'Type a message' }) => {
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="bg-white border border-black rounded-md p-3 h-full flex flex-col min-w-0">
      <div className="font-bold text-black mb-2 flex-shrink-0">{title}</div>
      <div className="flex-1 overflow-y-auto space-y-2 text-sm min-h-0 min-w-0">
        {messages.map((m, i) => (
          <div key={i} className={m.sender === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block px-3 py-2 rounded border border-black text-black bg-white">{m.text}</span>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <span className="inline-block px-3 py-2 rounded border border-black text-black bg-gray-100">
              Generating timetable...
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 flex space-x-2 flex-shrink-0 min-w-0">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder={placeholder} 
          className="flex-1 border border-black rounded px-3 py-2 bg-white text-black min-w-0" 
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button 
          onClick={send} 
          disabled={isLoading} 
          className="border border-black rounded px-3 py-2 bg-black text-white disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
        >
          Send
        </button>
      </div>
    </div>
  );
}; 