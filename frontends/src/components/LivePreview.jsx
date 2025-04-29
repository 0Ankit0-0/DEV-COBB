import { useState, useEffect, useRef } from "react";
import "../styles/LivePreview.css";

const LivePreview = ({ projectId, files, fileContent, cssLinks = {} }) => {
  const [activeHtmlFile, setActiveHtmlFile] = useState(null);
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);

  // Find HTML files
  useEffect(() => {
    if (!files || files.length === 0) return;

    // Find the first HTML file
    const htmlFiles = files.filter((file) => file.name.endsWith(".html"));
    if (htmlFiles.length > 0 && !activeHtmlFile) {
      setActiveHtmlFile(htmlFiles[0]);
    }
  }, [files, activeHtmlFile]);

  // Update preview when file content changes
  useEffect(() => {
    try {
      if (!activeHtmlFile || !fileContent[activeHtmlFile._id]) return;
      setError(null);

      let htmlContent = fileContent[activeHtmlFile._id];

      // Find all CSS files
      const cssFiles = files.filter((file) => file.name.endsWith(".css"));

      // Collect all CSS content
      let allCssContent = "";
      cssFiles.forEach((cssFile) => {
        if (fileContent[cssFile._id]) {
          allCssContent += fileContent[cssFile._id] + "\n";
        }
      });

      // Inject CSS directly into HTML
      if (allCssContent) {
        // Check if HTML has a head tag
        if (!htmlContent.includes("<head>")) {
          // Add head tag if it doesn't exist
          htmlContent = htmlContent.replace(
            /<html[^>]*>/i,
            "$&\n<head>\n</head>"
          );
        }

        // Check if there's already a style tag in the head
        if (!htmlContent.includes("<style>")) {
          // Add style tag with CSS content
          htmlContent = htmlContent.replace(
            "</head>",
            `  <style>\n${allCssContent}\n  </style>\n</head>`
          );
        }
      }

      // Inject JS content
      const jsFiles = files.filter(
        (file) => file.name.endsWith(".js") && !file.name.endsWith(".test.js")
      );
      let jsContent = "";
      jsFiles.forEach((jsFile) => {
        if (fileContent[jsFile._id]) {
          jsContent += fileContent[jsFile._id] + "\n";
        }
      });

      if (jsContent) {
        // Check if there's already a script tag at the end of body
        if (
          !htmlContent.includes("<script>") &&
          htmlContent.includes("</body>")
        ) {
          htmlContent = htmlContent.replace(
            "</body>",
            `  <script>\n${jsContent}\n  </script>\n</body>`
          );
        }
      }

      // Set the iframe content safely
      if (iframeRef.current) {
        try {
          const iframe = iframeRef.current;
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          doc.open();
          doc.write(htmlContent);
          doc.close();
        } catch (err) {
          console.error("Error updating iframe content:", err);
          setError(
            "Failed to update preview due to security restrictions. Try running your code instead."
          );
        }
      }
    } catch (err) {
      console.error("Error in LivePreview:", err);
      setError(`Preview error: ${err.message}`);
    }
  }, [activeHtmlFile, fileContent, files, cssLinks]);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file.name.endsWith(".html")) {
      setActiveHtmlFile(file);
    }
  };

  return (
    <div className="live-preview">
      {files && files.some((file) => file.name.endsWith(".html")) ? (
        <>
          <div className="preview-tabs">
            {files
              .filter((file) => file.name.endsWith(".html"))
              .map((file) => (
                <button
                  key={file._id}
                  className={`preview-tab ${
                    activeHtmlFile && activeHtmlFile._id === file._id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  {file.name}
                </button>
              ))}
          </div>
          <div className="preview-iframe-container">
            {error ? (
              <div className="preview-error">
                <p>{error}</p>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                title="Live Preview"
                className="preview-iframe"
                sandbox="allow-scripts allow-same-origin"
              ></iframe>
            )}
          </div>
        </>
      ) : (
        <div className="no-preview">
          <p>No HTML files found</p>
          <p>Create an HTML file to see a live preview</p>
        </div>
      )}
    </div>
  );
};

export default LivePreview;
