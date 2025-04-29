"use client";

const File = require("../models/File");
const FileContent = require("../models/FileContent");

// Create default files for a new project based on template
const createDefaultFiles = async (projectId, template) => {
  try {
    let files = [];

    switch (template) {
      case "blank":
        files = [
          {
            name: "main.js",
            type: "file",
            content:
              "// Welcome to DEV-COBB!\n// Start coding here...\n\nconsole.log('Hello, world!');",
          },
        ];
        break;

      case "html-css-js":
        files = [
          {
            name: "index.html",
            type: "file",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to DEV-COBB!</h1>
    <p>Start building your web project here.</p>
    <button id="demo-button">Click Me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
          },
          {
            name: "styles.css",
            type: "file",
            content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #5e17eb;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 2rem;
}

button {
  background-color: #5e17eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #4a11c0;
}`,
          },
          {
            name: "script.js",
            type: "file",
            content: `// JavaScript for the web project

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('demo-button');
  
  button.addEventListener('click', () => {
    alert('Hello from DEV-COBB!');
  });
});`,
          },
        ];
        break;

      case "react":
        files = [
          {
            name: "index.js",
            type: "file",
            content: `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
          },
          {
            name: "App.js",
            type: "file",
            content: `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to DEV-COBB React</h1>
        <p>Edit App.js and save to see changes</p>
      </header>
      <main>
        <div className="counter">
          <p>You clicked {count} times</p>
          <button onClick={() => setCount(count + 1)}>
            Click me
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;`,
          },
          {
            name: "styles.css",
            type: "file",
            content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

.app {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  margin-bottom: 2rem;
}

h1 {
  color: #5e17eb;
}

.counter {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

button {
  background-color: #5e17eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #4a11c0;
}`,
          },
        ];
        break;

      case "node-express":
        files = [
          {
            name: "server.js",
            type: "file",
            content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DEV-COBB API!' });
});

app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' }
  ];
  
  res.json(users);
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
          },
          {
            name: "package.json",
            type: "file",
            content: `{
  "name": "node-express-api",
  "version": "1.0.0",
  "description": "A simple Node.js Express API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.17.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.15"
  }
}`,
          },
          {
            name: "README.md",
            type: "file",
            content: `# Node.js Express API

A simple API built with Node.js and Express.

## Getting Started

1. Install dependencies: \`npm install\`
2. Start the server: \`npm start\`
3. For development with auto-reload: \`npm run dev\`

## API Endpoints

- GET / - Welcome message
- GET /api/users - List of users`,
          },
        ];
        break;

      case "python":
        files = [
          {
            name: "main.py",
            type: "file",
            content: `# Welcome to DEV-COBB Python!

def greet(name):
    """
    A simple greeting function
    """
    return f"Hello, {name}! Welcome to DEV-COBB."

def main():
    name = input("Enter your name: ")
    greeting = greet(name)
    print(greeting)
    
    # Simple calculator
    print("\\nSimple Calculator")
    num1 = float(input("Enter first number: "))
    num2 = float(input("Enter second number: "))
    
    print(f"Addition: {num1 + num2}")
    print(f"Subtraction: {num1 - num2}")
    print(f"Multiplication: {num1 * num2}")
    print(f"Division: {num1 / num2 if num2 != 0 else 'Cannot divide by zero'}")

if __name__ == "__main__":
    main()`,
          },
          {
            name: "README.md",
            type: "file",
            content: `# Python Project

A simple Python project to get you started.

## Running the Project

To run this project, use the following command:

\`\`\`
python main.py
\`\`\`

## Features

- Simple greeting function
- Basic calculator functionality`,
          },
        ];
        break;

      default:
        files = [
          {
            name: "main.js",
            type: "file",
            content:
              "// Welcome to DEV-COBB!\n// Start coding here...\n\nconsole.log('Hello, world!');",
          },
        ];
    }

    // Create files in the database
    for (const fileData of files) {
      const file = new File({
        name: fileData.name,
        type: fileData.type,
        project: projectId,
        parentId: null,
        isMain:
          fileData.name === "index.html" ||
          fileData.name === "main.js" ||
          fileData.name === "server.js" ||
          fileData.name === "main.py",
      });

      const savedFile = await file.save();

      // Create file content
      if (fileData.type === "file") {
        const fileContent = new FileContent({
          file: savedFile._id,
          content: fileData.content,
        });

        await fileContent.save();
      }
    }

    return true;
  } catch (error) {
    console.error("Error creating default files:", error);
    throw error;
  }
};

module.exports = {
  createDefaultFiles,
};
