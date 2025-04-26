# DEV-COBB: Developer Collaborative Online Browser-Based IDE

A powerful, collaborative online IDE built for developers, students, and teams — with real-time editing, AI assistant, project management, and multi-language support.

## Features

- 🧠 **AI Code Assistant**: Code suggestions, explanation, and bug-fixing via AI
- 📁 **File/Folder Explorer**: Create, rename, delete, and organize files/folders
- 🖥️ **Code Editor**: Monaco Editor with syntax highlighting, themes, and multi-language support
- ⚙️ **Code Execution**: Run code in-browser or via backend API
- 🌐 **Live Preview**: For HTML/CSS/JS projects — real-time preview panel
- 🧑‍🤝‍🧑 **Real-time Collaboration**: Invite users to rooms, sync cursor & code edits
- 🔐 **User Auth & Projects**: JWT auth, user profiles, save/load projects
- 📦 **Import/Export Projects**: Share your work easily

## Tech Stack

- **Frontend**: React.js + Monaco Editor + WebSockets + CSS Modules
- **Backend**: Node.js + Express + MongoDB + JWT + WebSocket (Socket.io)
- **AI Integration**: OpenAI API / Hugging Face (for AI assistant)
- **Code Execution**: API-based execution
- **Live Preview**: Iframe + sandboxed JS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/dev-cobb.git
   cd dev-cobb
   \`\`\`

2. Install dependencies for both frontend and backend:
   \`\`\`bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   \`\`\`

3. Create a `.env` file in the backend directory:
   \`\`\`
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dev-cobb
   JWT_SECRET=your-secret-key
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   OPENAI_API_KEY=your-openai-api-key
   \`\`\`

4. Create a `.env` file in the frontend directory:
   \`\`\`
   REACT_APP_API_URL=http://localhost:5000/api
   \`\`\`

### Running the Application

1. Start the backend server:
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

2. Start the frontend development server:
   \`\`\`bash
   cd frontend
   npm start
   \`\`\`

3. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Backend

1. Deploy to a Node.js hosting service like Heroku, Vercel, or DigitalOcean
2. Set up environment variables in your hosting provider

### Frontend

1. Build the frontend:
   \`\`\`bash
   cd frontend
   npm run build
   \`\`\`

2. Deploy the build folder to a static hosting service like Netlify, Vercel, or GitHub Pages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Monaco Editor for the powerful code editing capabilities
- Socket.io for real-time collaboration features
- OpenAI for AI assistance capabilities
\`\`\`

This completes the DEV-COBB project with all the requested features, including the frontend and backend code. The project follows the specified color scheme (#5e17eb, #5f6d89, #342e48) and includes animations for a polished user experience.

<Actions>
  <Action name="Add OpenAI integration" description="Implement full OpenAI API integration for the AI assistant" />
  <Action name="Add GitHub integration" description="Add ability to import/export projects from GitHub repositories" />
  <Action name="Implement user profiles" description="Create user profile pages with statistics and settings" />
  <Action name="Add custom themes" description="Implement theme customization options beyond light/dark mode" />
  <Action name="Create mobile responsive design" description="Optimize the UI for mobile devices and tablets" />
</Actions>

\`\`\`


```tsx file="app/page.tsx"
[v0-no-op-code-block-prefix]const Page = () => {
  return (
    <div>
      <h1>Welcome to DEV-COBB</h1>
      <p>Your collaborative online IDE.</p>
    </div>
  );
};

export default Page;
