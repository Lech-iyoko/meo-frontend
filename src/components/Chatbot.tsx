"use client"

import { useState, useRef, useEffect, FormEvent } from "react"
import ReactMarkdown from "react-markdown"
import styles from "./Chatbot.module.css"
import { postChatMessage } from "@/app/lib/api"
import { Message } from "@/app/lib/types"

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = "auto"
  el.style.height = `${el.scrollHeight}px`
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [openSourcesIndex, setOpenSourcesIndex] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const storedSessionId = localStorage.getItem("meo-session-id") || crypto.randomUUID()
    setSessionId(storedSessionId)
    localStorage.setItem("meo-session-id", storedSessionId)
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    autoResizeTextarea(inputRef.current)
  }, [])

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
      const errorMessage: Message = {
        text: "Sorry, I am having trouble connecting. Please try again.",
        sender: "meo",
      }
      setMessages((prev) => [...prev, errorMessage])
      console.error("Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as unknown as FormEvent)
    }
  }

  const toggleSources = (index: number) => {
    setOpenSourcesIndex(openSourcesIndex === index ? null : index)
  }

  const isFormDisabled = isLoading || !sessionId
  const isConversationStarted = messages.length > 0

  return (
    <div className={styles.chatContainer}>
      <div className={styles.headerBadge}>
        <span className={styles.limitedPreviewBadge}>Limited Preview</span>
      </div>

      {/* Welcome section with branding and input - like Perplexity */}
      {!isConversationStarted && (
        <div className={styles.welcomeSection}>
          <div className={styles.meoBranding}>
            <h1 className={styles.meoTitle}>
              Me<span className={styles.dropletO}>🩸</span>
            </h1>
          </div>
          
          <form onSubmit={handleSendMessage} className={styles.form}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.input}
              placeholder={
                sessionId
                  ? "Ask a question about metabolic health..."
                  : "Initializing session..."
              }
              disabled={isFormDisabled}
              rows={1}
              onInput={(e) => autoResizeTextarea(e.currentTarget)}
            />
            <button type="submit" className={styles.button} disabled={isFormDisabled}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Chat window - only shown after conversation starts */}
      {isConversationStarted && (
        <>
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
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className={styles.sourcesSection}>
                        <button
                          className={styles.sourcesToggle}
                          onClick={() => toggleSources(index)}
                          aria-expanded={openSourcesIndex === index}
                        >
                          Sources ({msg.sources.length})
                          <span
                            className={`${styles.chevron} ${openSourcesIndex === index ? styles.chevronOpen : ""}`}
                          >
                            ▼
                          </span>
                        </button>
                        {openSourcesIndex === index && (
                          <ul className={styles.sourcesList}>
                            {msg.sources.map((source, idx) => (
                              <li key={idx} className={styles.sourceItem}>
                                <span>{source.source_name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
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

          {/* Bottom input form - after conversation starts */}
          <div className={styles.formBottom}>
            <form onSubmit={handleSendMessage} className={styles.form}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.input}
                placeholder="Ask a follow-up question..."
                disabled={isFormDisabled}
                rows={1}
                onInput={(e) => autoResizeTextarea(e.currentTarget)}
              />
              <button type="submit" className={styles.button} disabled={isFormDisabled}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}