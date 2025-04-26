"use client"

const File = require("../models/File")
const FileContent = require("../models/FileContent")

exports.createTemplateFiles = async (projectId, template) => {
  switch (template) {
    case "blank":
      await createBlankTemplate(projectId)
      break
    case "html-css-js":
      await createHtmlCssJsTemplate(projectId)
      break
    case "react":
      await createReactTemplate(projectId)
      break
    case "node-express":
      await createNodeExpressTemplate(projectId)
      break
    case "python":
      await createPythonTemplate(projectId)
      break
    default:
      await createBlankTemplate(projectId)
  }
}

async function createFile(projectId, name, content, parentId = null, isMain = false) {
  const file = await File.create({
    name,
    project: projectId,
    parentId,
    type: "file",
    isMain,
  })

  await FileContent.create({
    file: file._id,
    content,
  })

  return file
}

async function createFolder(projectId, name, parentId = null) {
  return await File.create({
    name,
    project: projectId,
    parentId,
    type: "folder",
  })
}

async function createBlankTemplate(projectId) {
  await createFile(projectId, "main.js", "// Write your code here", null, true)
}

async function createHtmlCssJsTemplate(projectId) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Welcome to My Web Page</h1>
    <nav>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section class="hero">
      <h2>Hello, World!</h2>
      <p>This is a simple web page created with HTML, CSS, and JavaScript.</p>
      <button id="changeColorBtn">Change Color</button>
    </section>
    
    <section class="content">
      <h2>Features</h2>
      <ul>
        <li>Responsive design</li>
        <li>Interactive elements</li>
        <li>Clean code structure</li>
      </ul>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2023 My Web Page. All rights reserved.</p>
  </footer>
  
  <script src="script.js"></script>
</body>
</html>`

  const cssContent = `/* Reset some default styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

header {
  background-color: #5e17eb;
  color: white;
  padding: 1rem 2rem;
}

nav ul {
  display: flex;
  list-style: none;
  margin-top: 0.5rem;
}

nav ul li {
  margin-right: 1rem;
}

nav ul li a {
  color: white;
  text-decoration: none;
}

nav ul li a:hover {
  text-decoration: underline;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  text-align: center;
}

.hero h2 {
  color: #5e17eb;
  margin-bottom: 1rem;
}

.hero p {
  margin-bottom: 1.5rem;
}

button {
  background-color: #5e17eb;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #4a12c0;
}

.content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content h2 {
  color: #5e17eb;
  margin-bottom: 1rem;
}

.content ul {
  list-style-position: inside;
  margin-left: 1rem;
}

footer {
  text-align: center;
  padding: 1rem;
  background-color: #5e17eb;
  color: white;
  margin-top: 2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  header {
    padding: 1rem;
  }
  
  nav ul {
    flex-direction: column;
  }
  
  nav ul li {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
  
  main {
    padding: 1rem;
  }
}`

  const jsContent = `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get the button element
  const changeColorBtn = document.getElementById('changeColorBtn');
  
  // Add click event listener to the button
  changeColorBtn.addEventListener('click', function() {
    // Generate a random color
    const randomColor = getRandomColor();
    
    // Change the hero section background color
    document.querySelector('.hero').style.backgroundColor = randomColor;
  });
  
  // Function to generate a random color
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
});`

  await createFile(projectId, "index.html", htmlContent, null, true)
  await createFile(projectId, "styles.css", cssContent)
  await createFile(projectId, "script.js", jsContent)
}

// React template
async function createReactTemplate(projectId) {
  const srcFolder = await createFolder(projectId, "src")
  const componentsFolder = await createFolder(projectId, "components", srcFolder._id)

  const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script src="./src/index.js"></script>
</body>
</html>`

  const indexJsContent = `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`

  const appJsContent = `import React, { useState } from 'react';
import Header from './components/Header';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Build a project', completed: false },
    { id: 3, text: 'Deploy to production', completed: false }
  ]);

  const addTask = (text) => {
    const newTask = {
      id: Date.now(),
      text,
      completed: false
    };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="app">
      <Header />
      <main className="container">
        <TaskForm onAddTask={addTask} />
        <TaskList 
          tasks={tasks} 
          onToggleTask={toggleTask} 
          onDeleteTask={deleteTask} 
        />
      </main>
    </div>
  );
}

export default App;`

  const stylesContent = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  background-color: #5e17eb;
  color: white;
  padding: 1rem 2rem;
  text-align: center;
}

.task-form {
  display: flex;
  margin-bottom: 2rem;
}

.task-form input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

.task-form button {
  background-color: #5e17eb;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 1rem;
}

.task-form button:hover {
  background-color: #4a12c0;
}

.task-list {
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.task-item.completed {
  opacity: 0.7;
}

.task-item.completed .task-text {
  text-decoration: line-through;
}

.task-checkbox {
  margin-right: 1rem;
  cursor: pointer;
}

.task-text {
  flex: 1;
}

.task-delete {
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  font-size: 1.2rem;
}

.task-delete:hover {
  color: #ff0000;
}`

  const headerComponentContent = `import React from 'react';

function Header() {
  return (
    <header className="header">
      <h1>React Task Manager</h1>
    </header>
  );
}

export default Header;`

  const taskListComponentContent = `import React from 'react';

function TaskList({ tasks, onToggleTask, onDeleteTask }) {
  if (tasks.length === 0) {
    return <p>No tasks yet. Add a task to get started!</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map(task => (
        <li 
          key={task.id} 
          className={\`task-item \${task.completed ? 'completed' : ''}\`}
        >
          <input
            type="checkbox"
            className="task-checkbox"
            checked={task.completed}
            onChange={() => onToggleTask(task.id)}
          />
          <span className="task-text">{task.text}</span>
          <button 
            className="task-delete" 
            onClick={() => onDeleteTask(task.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;`

  const taskFormComponentContent = `import React, { useState } from 'react';

function TaskForm({ onAddTask }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text);
      setText('');
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new task..."
      />
      <button type="submit">Add</button>
    </form>
  );
}

export default TaskForm;`

  await createFile(projectId, "index.html", indexHtmlContent, null, true)
  await createFile(projectId, "index.js", indexJsContent, srcFolder._id)
  await createFile(projectId, "App.js", appJsContent, srcFolder._id)
  await createFile(projectId, "styles.css", stylesContent, srcFolder._id)
  await createFile(projectId, "Header.js", headerComponentContent, componentsFolder._id)
  await createFile(projectId, "TaskList.js", taskListComponentContent, componentsFolder._id)
  await createFile(projectId, "TaskForm.js", taskFormComponentContent, componentsFolder._id)
}

// Node/Express template
async function createNodeExpressTemplate(projectId) {
  const srcFolder = await createFolder(projectId, "src")
  const routesFolder = await createFolder(projectId, "routes", srcFolder._id)

  const packageJsonContent = `{
  "name": "express-api",
  "version": "1.0.0",
  "description": "A simple Express API",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.12"
  }
}`

  const indexJsContent = `const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    endpoints: {
      users: '/api/users',
      products: '/api/products'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`

  const userRoutesContent = `const express = require('express');
const router = express.Router();

// Sample data
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
];

// Get all users
router.get('/', (req, res) => {
  res.json(users);
});

// Get user by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(user => user.id === id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json(user);
});

// Create a new user
router.post('/', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

// Update a user
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email } = req.body;
  
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const updatedUser = {
    ...users[userIndex],
    name: name || users[userIndex].name,
    email: email || users[userIndex].email
  };
  
  users[userIndex] = updatedUser;
  res.json(updatedUser);
});

// Delete a user
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: 'User deleted' });
});

module.exports = router;`

  const productRoutesContent = `const express = require('express');
const router = express.Router();

// Sample data
const products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
  { id: 2, name: 'Smartphone', price: 699.99, category: 'Electronics' },
  { id: 3, name: 'Headphones', price: 149.99, category: 'Audio' }
];

// Get all products
router.get('/', (req, res) => {
  res.json(products);
});

// Get product by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(product => product.id === id);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  res.json(product);
});

// Create a new product
router.post('/', (req, res) => {
  const { name, price, category } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }
  
  const newProduct = {
    id: products.length + 1,
    name,
    price: parseFloat(price),
    category: category || 'Uncategorized'
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Update a product
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, category } = req.body;
  
  const productIndex = products.findIndex(product => product.id === id);
  
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  const updatedProduct = {
    ...products[productIndex],
    name: name || products[productIndex].name,
    price: price ? parseFloat(price) : products[productIndex].price,
    category: category || products[productIndex].category
  };
  
  products[productIndex] = updatedProduct;
  res.json(updatedProduct);
});

// Delete a product
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productIndex = products.findIndex(product => product.id === id);
  
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  products.splice(productIndex, 1);
  res.json({ message: 'Product deleted' });
});

module.exports = router;`

  const envContent = `PORT=3000
NODE_ENV=development`

  await createFile(projectId, "package.json", packageJsonContent, null, true)
  await createFile(projectId, ".env", envContent)
  await createFile(projectId, "index.js", indexJsContent, srcFolder._id)
  await createFile(projectId, "users.js", userRoutesContent, routesFolder._id)
  await createFile(projectId, "products.js", productRoutesContent, routesFolder._id)
}

// Python template
async function createPythonTemplate(projectId) {
  const mainPyContent = `# Main application file
def main():
    print("Welcome to the Python application!")
    
    # Get user input
    name = input("What is your name? ")
    
    # Greet the user
    print(f"Hello, {name}!")
    
    # Demonstrate some Python features
    demonstrate_features()
    
    # Run a simple calculation
    result = calculate_sum(10)
    print(f"The sum of numbers from 1 to 10 is: {result}")

def demonstrate_features():
    """Demonstrate some Python features"""
    # Lists
    fruits = ["apple", "banana", "cherry"]
    print("\\nList operations:")
    print(f"Original list: {fruits}")
    
    # Add an item
    fruits.append("orange")
    print(f"After append: {fruits}")
    
    # Remove an item
    fruits.remove("banana")
    print(f"After remove: {fruits}")
    
    # List comprehension
    squares = [x**2 for x in range(1, 6)]
    print(f"Squares from 1 to 5: {squares}")
    
    # Dictionary
    person = {
        "name": "John",
        "age": 30,
        "city": "New York"
    }
    print("\\nDictionary operations:")
    print(f"Person: {person}")
    
    # Add a key-value pair
    person["email"] = "john@example.com"
    print(f"After adding email: {person}")
    
    # Get all keys and values
    print(f"Keys: {list(person.keys())}")
    print(f"Values: {list(person.values())}")

def calculate_sum(n):
    """Calculate the sum of numbers from 1 to n"""
    return sum(range(1, n + 1))

if __name__ == "__main__":
    main()`

  const utilsPyContent = `# Utility functions

def is_prime(n):
    """Check if a number is prime"""
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

def fibonacci(n):
    """Generate the first n Fibonacci numbers"""
    fib_sequence = [0, 1]
    if n <= 2:
        return fib_sequence[:n]
    
    for i in range(2, n):
        fib_sequence.append(fib_sequence[i-1] + fib_sequence[i-2])
    
    return fib_sequence

def factorial(n):
    """Calculate the factorial of n"""
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n-1)

def reverse_string(s):
    """Reverse a string"""
    return s[::-1]

def count_words(text):
    """Count the number of words in a text"""
    words = text.split()
    return len(words)`

  const testsPyContent = `# Test functions
import unittest
from utils import is_prime, fibonacci, factorial, reverse_string, count_words

class TestUtils(unittest.TestCase):
    def test_is_prime(self):
        self.assertTrue(is_prime(2))
        self.assertTrue(is_prime(3))
        self.assertTrue(is_prime(5))
        self.assertTrue(is_prime(7))
        self.assertTrue(is_prime(11))
        self.assertFalse(is_prime(1))
        self.assertFalse(is_prime(4))
        self.assertFalse(is_prime(6))
        self.assertFalse(is_prime(9))
    
    def test_fibonacci(self):
        self.assertEqual(fibonacci(1), [0])
        self.assertEqual(fibonacci(2), [0, 1])
        self.assertEqual(fibonacci(5), [0, 1, 1, 2, 3])
        self.assertEqual(fibonacci(8), [0, 1, 1, 2, 3, 5, 8, 13])
    
    def test_factorial(self):
        self.assertEqual(factorial(0), 1)
        self.assertEqual(factorial(1), 1)
        self.assertEqual(factorial(5), 120)
    
    def test_reverse_string(self):
        self.assertEqual(reverse_string("hello"), "olleh")
        self.assertEqual(reverse_string("python"), "nohtyp")
        self.assertEqual(reverse_string(""), "")
    
    def test_count_words(self):
        self.assertEqual(count_words("hello world"), 2)
        self.assertEqual(count_words("Python is awesome"), 3)
        self.assertEqual(count_words(""), 0)

if __name__ == "__main__":
    unittest.main()`

  await createFile(projectId, "main.py", mainPyContent, null, true)
  await createFile(projectId, "utils.py", utilsPyContent)
  await createFile(projectId, "tests.py", testsPyContent)
}
