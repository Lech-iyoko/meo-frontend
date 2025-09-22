'use client'; 

import { useState, useEffect, FormEvent, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Chatbot.module.css';
// Using absolute path aliases defined in tsconfig.json for robustness
import { postChatMessage } from '@/app/lib/api';
import { Message } from '@/app/lib/types';

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Initialize sessionId as null to be more explicit about its initial state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Handles Session ID Management
  useEffect(() => {
    // This effect runs only once on the client side after the component mounts
    const storedSessionId = localStorage.getItem('meo-session-id') || crypto.randomUUID();
    setSessionId(storedSessionId);
    localStorage.setItem('meo-session-id', storedSessionId);
    console.log('Session ID Initialized:', storedSessionId);
  }, []);

  // Auto-scrolls the chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    // Add a log to see why a message might not be sending
    if (!input.trim() || isLoading || !sessionId) {
        console.log('Send message blocked:', { input: input.trim(), isLoading, sessionId });
        return;
    }

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await postChatMessage(currentInput, sessionId);
      const meoMessage: Message = { 
        text: response.response, 
        sender: 'meo',
        sources: response.retrieved_sources 
      };
      setMessages((prev) => [...prev, meoMessage]);
    } catch (error) {
      const errorMessage: Message = { text: 'Sorry, I am having trouble connecting. Please try again.', sender: 'meo' };
      setMessages((prev) => [...prev, errorMessage]);
      
      if (error instanceof Error) {
        console.error("Failed to send message:", error.message);
      } else {
        console.error("An unknown error occurred:", error);
      }
      
    } finally {
      setIsLoading(false);
    }
  };
  
  const isFormDisabled = isLoading || !sessionId;

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === 'user' ? styles.userMessage : styles.meoMessage}>
            <div className={styles.messageText}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
            
            {msg.sender === 'meo' && msg.sources && msg.sources.length > 0 && (
              <div className={styles.sourcesContainer}>
                <strong>Sources:</strong>
                <ul className={styles.sourcesList}>
                  {msg.sources.map((source, idx) => (
                    <li key={idx} className={styles.sourceItem}>
                      {source.original_url ? (
                        <a href={source.original_url} target="_blank" rel="noopener noreferrer">
                          {source.source_name}{source.page_number ? ` (p. ${source.page_number})` : ''}
                        </a>
                      ) : (
                        <span>{source.source_name}{source.page_number ? ` (p. ${source.page_number})` : ''}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {isLoading && <div className={styles.meoMessage}><p className={styles.messageText}><i>Meo is thinking...</i></p></div>}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={styles.input}
          placeholder={isFormDisabled ? "Initializing session..." : "Ask a question about metabolic health..."}
          disabled={isFormDisabled}
        />
        <button type="submit" className={styles.button} disabled={isFormDisabled}>Send</button>
      </form>
    </div>
  );
}

