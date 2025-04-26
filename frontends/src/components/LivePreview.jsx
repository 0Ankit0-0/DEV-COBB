import { useState, useEffect } from "react"
import "../styles/LivePreview.css"

const LivePreview = ({ projectId, files, fileContent }) => {
  const [html, setHtml] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Find HTML, CSS, and JS files
    const htmlFile = files.find((f) => f.name.endsWith(".html"))
    const cssFiles = files.filter((f) => f.name.endsWith(".css"))
    const jsFiles = files.filter((f) => f.name.endsWith(".js") && !f.name.endsWith(".test.js"))

    if (htmlFile && fileContent[htmlFile._id]) {
      let htmlContent = fileContent[htmlFile._id]

      // Inject CSS
      let cssContent = ""
      cssFiles.forEach((cssFile) => {
        if (fileContent[cssFile._id]) {
          cssContent += fileContent[cssFile._id]
        }
      })

      if (cssContent) {
        htmlContent = htmlContent.replace("</head>", `<style>${cssContent}</style></head>`)
      }

      // Inject JS
      let jsContent = ""
      jsFiles.forEach((jsFile) => {
        if (fileContent[jsFile._id]) {
          jsContent += fileContent[jsFile._id]
        }
      })

      if (jsContent) {
        htmlContent = htmlContent.replace("</body>", `<script>${jsContent}</script></body>`)
      }

      setHtml(htmlContent)
    } else {
      // If no HTML file is found, create a basic preview with available CSS and JS
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .preview-message { text-align: center; margin-top: 40px; color: #666; }
            ${cssFiles.map((cssFile) => fileContent[cssFile._id] || "").join("\n")}
          </style>
        </head>
        <body>
          <div class="preview-message">
            <h2>Live Preview</h2>
            <p>Create an HTML file to see a full preview</p>
          </div>
          <script>
            ${jsFiles.map((jsFile) => fileContent[jsFile._id] || "").join("\n")}
          </script>
        </body>
        </html>
      `

      setHtml(htmlContent)
    }
  }, [files, fileContent, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="live-preview">
      <div className="preview-toolbar">
        <button className="preview-action" onClick={handleRefresh} title="Refresh preview">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>
      <div className="preview-frame-container">
        <iframe
          title="Live Preview"
          className="preview-frame"
          srcDoc={html}
          sandbox="allow-scripts allow-modals"
          key={refreshKey}
        ></iframe>
      </div>
    </div>
  )
}

export default LivePreview
