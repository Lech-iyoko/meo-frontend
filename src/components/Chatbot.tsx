"use client"

import { useState, useEffect, type FormEvent, useRef } from "react"
import ReactMarkdown from "react-markdown"
import styles from "./Chatbot.module.css"
import { postChatMessage } from "@/app/lib/api"
import type { Message } from "@/app/lib/types"

// NOTE: The initial welcome message is now handled by the UI's header greeting,
// so the 'welcomeMessage' constant is no longer needed here.

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]) // Starts with an empty array
  const [input, setInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [openSourcesIndex, setOpenSourcesIndex] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedSessionId = localStorage.getItem("meo-session-id") || crypto.randomUUID()
    setSessionId(storedSessionId)
    localStorage.setItem("meo-session-id", storedSessionId)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage: Message = { text: input, sender: "user" }
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)
    setOpenSourcesIndex(null)

    try {
      const response = await postChatMessage(currentInput, sessionId)
      const meoMessage: Message = {
        text: response.response,
        sender: "meo",
        sources: response.retrieved_sources,
      }
      setMessages((prev) => [...prev, meoMessage])
    } catch (error) {
      const errorMessage: Message = { text: "Sorry, I am having trouble connecting. Please try again.", sender: "meo" }
      setMessages((prev) => [...prev, errorMessage])
      console.error("Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSources = (index: number) => {
    setOpenSourcesIndex(openSourcesIndex === index ? null : index)
  }

  const isFormDisabled = isLoading || !sessionId
  const showGreeting = messages.length === 0 && !isLoading;

  return (
    <div className={styles.chatContainer}>
      {showGreeting && (
        <div className={styles.headerGreeting}>
          <h1 className={styles.greetingText}>Hi, I'm MeO. How can I assist you today?</h1>
        </div>
      )}
      
      <div className={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div key={index} className={styles.messageWrapper}>
            <div className={msg.sender === "user" ? styles.userAvatar : styles.meoAvatar}>
              {msg.sender === "user" ? "You" : "Meo"}
            </div>
            <div className={styles.messageContent}>
              <div className={styles.messageText}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              {msg.sender === "meo" && msg.sources && msg.sources.length > 0 && (
                <div className={styles.sourcesWrapper}>
                  <button onClick={() => toggleSources(index)} className={styles.sourcesButton}>
                    Sources ({msg.sources.length})
                  </button>
                  {openSourcesIndex === index && (
                    <div className={styles.sourcesContainer}>
                      <ul className={styles.sourcesList}>
                        {msg.sources.map((source, idx) => (
                          <li key={idx} className={styles.sourceItem}>
                            <span>{source.source_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={styles.messageWrapper}>
            <div className={styles.meoAvatar}>Meo</div>
            <div className={styles.messageContent}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={showGreeting ? styles.formCentered : styles.formBottom}>
        <form onSubmit={handleSendMessage} className={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.input}
            placeholder={sessionId ? "Ask a question about metabolic health..." : "Initializing session..."}
            disabled={isFormDisabled}
          />
          <button type="submit" className={styles.button} disabled={isFormDisabled}>
            {/* CORRECTED: Paper Plane SVG Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sendIcon}>
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}