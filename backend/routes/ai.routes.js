const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const axios = require("axios");

router.post("/chat", protect, async (req, res) => {
  try {
    const {
      message,
      fileId,
      code,
      projectId,
      language = "javascript",
    } = req.body;

    const aiResponse = simulateAIResponse(message, code, language);

    res.status(200).json({
      success: true,
      message: aiResponse.message,
      code: aiResponse.code,
      language: aiResponse.language,
    });
  } catch (err) {
    console.error("AI Assistant error:", err);
    res.status(500).json({
      success: false,
      message: "Error processing AI request",
    });
  }
});

// Enhanced AI response simulation with multilanguage support
function simulateAIResponse(message, code, language) {
  const lowerMessage = message.toLowerCase();

  // Language-specific code examples
  const codeExamples = {
    javascript: `function calculateSum(arr) {
  return arr.reduce((sum, current) => sum + current, 0);
}

// Example usage
const numbers = [1, 2, 3, 4, 5];
console.log(calculateSum(numbers)); // 15`,

    python: `def calculate_sum(arr):
    return sum(arr)

# Example usage
numbers = [1, 2, 3, 4, 5]
print(calculate_sum(numbers))  # 15`,

    java: `public class SumCalculator {
    public static int calculateSum(int[] arr) {
        int sum = 0;
        for (int num : arr) {
            sum += num;
        }
        return sum;
    }
    
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.println(calculateSum(numbers)); // 15
    }
}`,

    cpp: `#include <iostream>
#include <vector>
#include <numeric>

int calculateSum(const std::vector<int>& arr) {
    return std::accumulate(arr.begin(), arr.end(), 0);
}

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << calculateSum(numbers) << std::endl; // 15
    return 0;
}`,

    csharp: `using System;
using System.Linq;

class Program {
    static int CalculateSum(int[] arr) {
        return arr.Sum();
    }
    
    static void Main() {
        int[] numbers = {1, 2, 3, 4, 5};
        Console.WriteLine(CalculateSum(numbers)); // 15
    }
}`,

    go: `package main

import "fmt"

func calculateSum(arr []int) int {
    sum := 0
    for _, num := range arr {
        sum += num
    }
    return sum
}

func main() {
    numbers := []int{1, 2, 3, 4, 5}
    fmt.Println(calculateSum(numbers)) // 15
}`,

    ruby: `def calculate_sum(arr)
  arr.sum
end

# Example usage
numbers = [1, 2, 3, 4, 5]
puts calculate_sum(numbers) # 15`,

    php: `<?php
function calculateSum($arr) {
    return array_sum($arr);
}

// Example usage
$numbers = [1, 2, 3, 4, 5];
echo calculateSum($numbers); // 15
?>`,

    typescript: `function calculateSum(arr: number[]): number {
  return arr.reduce((sum, current) => sum + current, 0);
}

// Example usage
const numbers: number[] = [1, 2, 3, 4, 5];
console.log(calculateSum(numbers)); // 15`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sum Calculator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .result {
            font-weight: bold;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Sum Calculator</h1>
    <input type="text" id="numbers" placeholder="Enter numbers separated by commas">
    <button onclick="calculate()">Calculate Sum</button>
    <div class="result" id="result"></div>

    <script>
        function calculate() {
            const input = document.getElementById('numbers').value;
            const numbers = input.split(',').map(num => parseFloat(num.trim()));
            const sum = numbers.reduce((acc, curr) => acc + curr, 0);
            document.getElementById('result').textContent = 'Sum: ' + sum;
        }
    </script>
</body>
</html>`,

    css: `/* Modern CSS styling example */
:root {
  --primary-color: #5e17eb;
  --secondary-color: #342e48;
  --text-color: #333;
  --background-color: #f8f9fa;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.6;
  margin: 0;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #4a12c0;
}`,

    sql: `-- Create a table to store user information
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a table to store projects
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (username, email, password_hash) 
VALUES ('johndoe', 'john@example.com', 'hashed_password_here');

-- Query to get all projects for a user
SELECT p.* FROM projects p
JOIN users u ON p.owner_id = u.id
WHERE u.username = 'johndoe'
ORDER BY p.updated_at DESC;`,
  };

  if (
    lowerMessage.includes("example") ||
    lowerMessage.includes("show me") ||
    lowerMessage.includes("how to")
  ) {
    let codeLanguage = language;

    const languageKeywords = {
      javascript: ["javascript", "js", "node"],
      python: ["python", "py"],
      java: ["java"],
      cpp: ["c++", "cpp"],
      csharp: ["c#", "csharp", "c sharp"],
      go: ["go", "golang"],
      ruby: ["ruby"],
      php: ["php"],
      typescript: ["typescript", "ts"],
      html: ["html"],
      css: ["css"],
      sql: ["sql", "database", "query"],
    };

    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        codeLanguage = lang;
        break;
      }
    }

    let exampleCode = codeExamples[codeLanguage] || codeExamples.javascript;
    let responseMessage = `Here's an example in ${codeLanguage}:`;

    if (lowerMessage.includes("sort") || lowerMessage.includes("sorting")) {
      if (codeLanguage === "javascript" || codeLanguage === "typescript") {
        exampleCode = `// Sorting an array in JavaScript
const numbers = [5, 2, 9, 1, 5, 6];

// Basic sorting (converts to strings)
const basicSorted = [...numbers].sort();
console.log("Basic sort:", basicSorted);

// Numeric sorting (ascending)
const ascendingSorted = [...numbers].sort((a, b) => a - b);
console.log("Ascending sort:", ascendingSorted);

// Numeric sorting (descending)
const descendingSorted = [...numbers].sort((a, b) => b - a);
console.log("Descending sort:", descendingSorted);

// Sorting objects by property
const users = [
  { name: "John", age: 25 },
  { name: "Jane", age: 30 },
  { name: "Bob", age: 20 }
];

const sortedByAge = [...users].sort((a, b) => a.age - b.age);
console.log("Sorted by age:", sortedByAge);`;
        responseMessage = "Here's how to sort arrays in JavaScript:";
      } else if (codeLanguage === "python") {
        exampleCode = `# Sorting in Python
numbers = [5, 2, 9, 1, 5, 6]

# Basic sorting (ascending)
sorted_numbers = sorted(numbers)
print("Sorted numbers:", sorted_numbers)

# Descending sort
desc_sorted = sorted(numbers, reverse=True)
print("Descending sort:", desc_sorted)

# Sorting objects by property
users = [
    {"name": "John", "age": 25},
    {"name": "Jane", "age": 30},
    {"name": "Bob", "age": 20}
]

# Sort by age
sorted_by_age = sorted(users, key=lambda x: x["age"])
print("Sorted by age:", sorted_by_age)

# Sort by name
sorted_by_name = sorted(users, key=lambda x: x["name"])
print("Sorted by name:", sorted_by_name)`;
        responseMessage = "Here's how to sort lists in Python:";
      }
    } else if (
      lowerMessage.includes("api") ||
      lowerMessage.includes("fetch") ||
      lowerMessage.includes("http")
    ) {
      if (codeLanguage === "javascript" || codeLanguage === "typescript") {
        exampleCode = `// Fetching data from an API in JavaScript
async function fetchData() {
  try {
    // Make the API request
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(\`HTTP error! Status: \${response.status}\`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Using the function
fetchData()
  .then(data => {
    // Process the data
    const titles = data.map(post => post.title);
    console.log('Post titles:', titles);
  })
  .catch(error => {
    console.error('Failed to fetch data:', error);
  });`;
        responseMessage = "Here's how to fetch data from an API in JavaScript:";
      } else if (codeLanguage === "python") {
        exampleCode = `# Fetching data from an API in Python
import requests

def fetch_data():
    try:
        # Make the API request
        response = requests.get('https://jsonplaceholder.typicode.com/posts')
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Parse the JSON response
        data = response.json()
        print('Fetched data:', data[:2])  # Print first 2 items
        return data
    except requests.exceptions.RequestException as e:
        print('Error fetching data:', e)
        raise

# Using the function
try:
    data = fetch_data()
    
    # Process the data
    titles = [post['title'] for post in data]
    print('Post titles:', titles[:5])  # Print first 5 titles
except Exception as e:
    print('Failed to fetch data:', e)`;
        responseMessage = "Here's how to fetch data from an API in Python:";
      }
    }

    return {
      message: responseMessage,
      code: exampleCode,
      language: codeLanguage,
    };
  }

  // Handle code explanation
  if (
    code &&
    (lowerMessage.includes("explain") ||
      lowerMessage.includes("what does") ||
      lowerMessage.includes("how does"))
  ) {
    return {
      message: `Let me explain this ${language} code:\n\nThis code ${
        language === "javascript"
          ? "defines a function or component"
          : "implements a solution"
      } that handles data processing and logic flow. It uses ${language}-specific syntax and features.\n\nThe main functionality appears to be ${
        lowerMessage.includes("function")
          ? "implementing a function that processes data"
          : "creating a structured program with multiple components"
      }.\n\nI can see it uses ${
        language === "python"
          ? "indentation for code blocks"
          : "braces for code blocks"
      } and follows standard ${language} conventions.\n\nIs there a specific part of this code you'd like me to explain in more detail?`,
      language,
    };
  }

  if (
    lowerMessage.includes("bug") ||
    lowerMessage.includes("error") ||
    lowerMessage.includes("fix")
  ) {
    return {
      message: `I'll help you debug your ${language} code. Here are some common issues to check:\n\n1. Syntax errors: Check for missing brackets, semicolons, or incorrect indentation\n2. Variable scope: Ensure variables are defined in the correct scope\n3. Type errors: Verify that you're using compatible data types\n4. Logic errors: Review your algorithm for logical flaws\n5. ${
        language === "javascript"
          ? "Asynchronous issues: Check promises and async/await usage"
          : language === "python"
          ? "Indentation issues: Python relies on proper indentation"
          : "Memory management: Check for memory leaks or null pointers"
      }\n\nCould you share the specific error message you're seeing?`,
      language,
    };
  }

  return {
    message: `I can help you with your ${language} code. What would you like to know? I can provide examples, explain concepts, help debug issues, or suggest optimizations.`,
    code: codeExamples[language] || codeExamples.javascript,
    language,
  };
}

module.exports = router;
