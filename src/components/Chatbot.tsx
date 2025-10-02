"use client"

import { useState, useEffect, type FormEvent, useRef } from "react"
import ReactMarkdown from "react-markdown"
import styles from "./Chatbot.module.css"
import { postChatMessage } from "@/app/lib/api"
import type { Message } from "@/app/lib/types"

// The welcome message that appears IN the chat window
const welcomeMessage: Message = {
  text: "Hi! I'm Meo. Let's get healthy!",
  sender: "meo",
  sources: [],
}

export default function Chatbot() {
  // The chat now correctly starts with the welcome message
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
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
    // Always add the new user message to the history
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
  
  // The form is centered only if the conversation hasn't started yet.
  const isConversationStarted = messages.length > 1;

  return (
    <div className={styles.chatContainer}>
      {/* --- THIS HEADER IS NOW ALWAYS VISIBLE --- */}
      <div className={styles.headerGreeting}>
        <h1 className={styles.greetingText}>
          Hi, I&apos;m Me
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/droplet-logo.png" alt="O" className={styles.dropletLogo} />
          . Let&apos;s get healthy!
        </h1>
      </div>

      <div className={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div key={index} className={styles.messageWrapper}>
            {msg.sender === "user" ? (
              <div className={styles.userMessageBubble}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ) : (
              <div className={styles.aiMessageFlow}>
                <div className={styles.aiMessageContent}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  {msg.sources && msg.sources.length > 0 && (
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
            )}
          </div>
        ))}
        {isLoading && (
          <div className={styles.messageWrapper}>
             <div className={styles.aiMessageFlow}>
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

      <div className={!isConversationStarted ? styles.formCentered : styles.formBottom}>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}