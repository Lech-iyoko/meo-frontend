'use client'; 

import { useState, useEffect, FormEvent, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Chatbot.module.css';
import { postChatMessage } from '../app/lib/api';
import { Message } from '../app/lib/types';

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let storedSessionId = localStorage.getItem('meo-session-id');
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem('meo-session-id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await postChatMessage(currentInput, sessionId);
      const meoMessage: Message = { 
        text: response.response, // <-- This was changed from response.answer
        sender: 'meo',
        sources: response.retrieved_sources 
      };
      setMessages((prev) => [...prev, meoMessage]);
    } catch (error) {
      const errorMessage: Message = { text: 'Sorry, I am having trouble connecting. Please try again.', sender: 'meo' };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === 'user' ? styles.userMessage : styles.meoMessage}>
            <ReactMarkdown className={styles.messageText}>{msg.text}</ReactMarkdown>
            
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
          placeholder="Ask a question about metabolic health..."
          disabled={isLoading}
        />
        <button type="submit" className={styles.button} disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}

