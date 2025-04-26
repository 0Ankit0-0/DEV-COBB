"use client"

import { useState, useRef, useEffect } from "react"
import api from "../services/api"
import "../styles/AIAssistant.css"

const AIAssistant = ({ projectId, activeFile, fileContent, editorInstance }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI coding assistant. How can I help you with your code today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("auto")
  const messagesEndRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (activeFile) {
      const extension = activeFile.name.split(".").pop().toLowerCase()
      const languageMap = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        py: "python",
        java: "java",
        cpp: "cpp",
        c: "c",
        cs: "csharp",
        go: "go",
        rb: "ruby",
        php: "php",
        html: "html",
        css: "css",
        json: "json",
      }

      if (languageMap[extension]) {
        setSelectedLanguage(languageMap[extension])
      }
    }
  }, [activeFile])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Get current file content if available
      let currentCode = ""
      let language = selectedLanguage

      if (activeFile && fileContent[activeFile._id]) {
        currentCode = fileContent[activeFile._id]

        // If language is set to auto, try to detect from file extension
        if (language === "auto" && activeFile.name) {
          const extension = activeFile.name.split(".").pop().toLowerCase()
          const languageMap = {
            js: "javascript",
            jsx: "javascript",
            ts: "typescript",
            tsx: "typescript",
            py: "python",
            java: "java",
            cpp: "cpp",
            c: "c",
            cs: "csharp",
            go: "go",
            rb: "ruby",
            php: "php",
            html: "html",
            css: "css",
            json: "json",
          }

          language = languageMap[extension] || "javascript"
        }
      }

      const response = await api.post("/ai/chat", {
        projectId,
        message: input,
        fileId: activeFile?._id,
        code: currentCode,
        language: language,
      })

      const assistantMessage = {
        role: "assistant",
        content: response.data.message,
        code: response.data.code,
        language: response.data.language || language,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // If the AI provided code and we have an active file and editor instance
      if (response.data.code && activeFile && editorInstance) {
        // Ask user if they want to apply the code
        const shouldApplyCode = window.confirm("Would you like to apply the suggested code to your file?")

        if (shouldApplyCode) {
          // Apply the code to the editor
          editorInstance.setValue(response.data.code)
        }
      }
    } catch (err) {
      console.error("Error sending message to AI:", err)

      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        error: true,
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content.split("\n").map((line, i) => {
      // Code blocks
      if (line.startsWith("```")) {
        return (
          <pre key={i} className="code-block">
            {line.replace(/```/g, "")}
          </pre>
        )
      }
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      line = line.replace(/\*(.*?)\*/g, "<em>$1</em>")

      return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
    })
  }

  return (
    <div className="ai-assistant">
      <div className="ai-assistant-header">
        <div className="language-selector">
          <label htmlFor="language-select">Language:</label>
          <select id="language-select" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
            <option value="auto">Auto-detect</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="csharp">C#</option>
            <option value="go">Go</option>
            <option value="ruby">Ruby</option>
            <option value="php">PHP</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="sql">SQL</option>
          </select>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role} ${message.error ? "error" : ""}`}>
            <div className="message-avatar">{message.role === "assistant" ? "AI" : "You"}</div>
            <div className="message-content">
              {formatMessage(message.content)}
              {message.code && (
                <div className="code-suggestion">
                  <div className="code-header">
                    <span>Suggested Code ({message.language || "code"})</span>
                    <button
                      className="copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(message.code)
                        alert("Code copied to clipboard!")
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="code-block">{message.code}</pre>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-avatar">AI</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your code..."
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default AIAssistant
