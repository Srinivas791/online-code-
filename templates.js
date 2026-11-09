/**
 * Pre-configured code templates for all 7 languages and visualizer demos
 */
export const STARTER_TEMPLATES = {
    c: {
        filename: "main.c",
        language: "c",
        judge0Id: 50,
        content: `#include <stdio.h>

// Visualizer & Execution Demo: Array & Pointer Swap
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    printf("=== C Program Execution ===\\n");
    
    int x = 42;
    int y = 99;
    printf("Before swap: x = %d, y = %d\\n", x, y);
    
    swap(&x, &y);
    printf("After swap:  x = %d, y = %d\\n", x, y);
    
    // Array demonstration
    int numbers[5] = {10, 20, 30, 40, 50};
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += numbers[i];
    }
    printf("Sum of array elements: %d\\n", sum);
    
    return 0;
}
`
    },
    cpp: {
        filename: "main.cpp",
        language: "cpp",
        judge0Id: 54,
        content: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// Quick visualizer demo: Vector & Bubble Sort
int main() {
    cout << "=== C++ Real Execution Engine ===" << endl;
    
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    cout << "Original array: ";
    for (int num : arr) cout << num << " ";
    cout << endl;
    
    // Sort array
    sort(arr.begin(), arr.end());
    
    cout << "Sorted array:   ";
    for (int num : arr) cout << num << " ";
    cout << endl;
    
    return 0;
}
`
    },
    java: {
        filename: "Main.java",
        language: "java",
        judge0Id: 62,
        content: `// Main class for Judge0 execution
public class Main {
    static class Account {
        private String owner;
        private double balance;

        public Account(String owner, double initialBalance) {
            this.owner = owner;
            this.balance = initialBalance;
        }

        public void deposit(double amount) {
            this.balance += amount;
            System.out.println(owner + " deposited: $" + amount + " | New Balance: $" + this.balance);
        }

        public double getBalance() {
            return balance;
        }
    }

    public static void main(String[] args) {
        System.out.println("=== Java Object & Heap Execution ===");
        
        Account acc1 = new Account("Alice", 1000.0);
        Account acc2 = new Account("Bob", 500.0);
        
        acc1.deposit(250.0);
        acc2.deposit(100.0);
        
        System.out.println("Final Alice Balance: $" + acc1.getBalance());
        System.out.println("Final Bob Balance:   $" + acc2.getBalance());
    }
}
`
    },
    python: {
        filename: "script.py",
        language: "python",
        judge0Id: 71,
        content: `# Interactive Python Execution & Recursion Tree Demo
import sys

def fibonacci(n):
    """Calculates n-th Fibonacci number with recursive call trace."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)

def main():
    print("=== Python Execution & Visualizer ===")
    
    # List comprehension and dictionary
    items = [1, 2, 3, 4, 5]
    squares = {x: x**2 for x in items}
    print(f"Squares dictionary: {squares}")
    
    # Recursion demo
    n = 6
    result = fibonacci(n)
    print(f"Fibonacci({n}) = {result}")

if __name__ == "__main__":
    main()
`
    },
    html: {
        filename: "index.html",
        language: "html",
        judge0Id: null,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="badge">Live Playground</div>
    <h1 id="title">CodeStudio Playground</h1>
    <p>Edit HTML, CSS, and JavaScript in real-time with responsive device preview & DOM inspection.</p>
    
    <div class="counter-box">
      <span class="label">Count:</span>
      <span id="counter" class="count-value">0</span>
    </div>
    
    <div class="actions">
      <button id="decrement-btn" class="btn btn-secondary">- Decrement</button>
      <button id="increment-btn" class="btn btn-primary">+ Increment</button>
      <button id="reset-btn" class="btn btn-outline">Reset</button>
    </div>

    <div id="log-output" class="log-output">Activity log ready...</div>
  </div>
  <script src="app.js"></script>
</body>
</html>`
    },
    css: {
        filename: "style.css",
        language: "css",
        judge0Id: null,
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  padding: 20px;
}

.card {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
  animation: fadeIn 0.4s ease-out;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h1 {
  font-size: 26px;
  margin-bottom: 8px;
  color: #ffffff;
}

p {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.counter-box {
  background: #0f172a;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border: 1px solid #334155;
}

.count-value {
  font-size: 32px;
  font-weight: bold;
  color: #38bdf8;
  transition: transform 0.15s ease;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #2563eb;
  color: white;
}
.btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #475569;
  color: white;
}
.btn-secondary:hover {
  background: #334155;
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
}
.btn-outline:hover {
  border-color: #cbd5e1;
  color: white;
}

.log-output {
  font-family: monospace;
  font-size: 12px;
  color: #10b981;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 6px;
  text-align: left;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}`
    },
    javascript: {
        filename: "app.js",
        language: "javascript",
        judge0Id: 63,
        content: `// Interactive DOM & Event Handling Demo
let count = 0;
const counterEl = document.getElementById('counter');
const logEl = document.getElementById('log-output');

function updateDisplay(action) {
  counterEl.textContent = count;
  counterEl.style.transform = 'scale(1.2)';
  setTimeout(() => counterEl.style.transform = 'scale(1)', 150);
  
  const msg = \`[\${new Date().toLocaleTimeString()}] \${action} -> New Count: \${count}\`;
  if (logEl) logEl.textContent = msg;
  console.log(msg);
}

document.getElementById('increment-btn')?.addEventListener('click', () => {
  count++;
  updateDisplay('Incremented');
});

document.getElementById('decrement-btn')?.addEventListener('click', () => {
  count--;
  updateDisplay('Decremented');
});

document.getElementById('reset-btn')?.addEventListener('click', () => {
  count = 0;
  updateDisplay('Reset');
});

console.log('Interactive app initialized successfully!');
`
    }
};

/**
 * Pre-configured interactive visualizer demos for each language
 */
export const VISUALIZER_DEMOS = {
    c_pointers: {
        name: "C: Pointer Arithmetic & Memory Swap",
        language: "c",
        type: "pointer",
        code: `#include <stdio.h>

void swap(int *p1, int *p2) {
    int temp = *p1;
    *p1 = *p2;
    *p2 = temp;
}

int main() {
    int a = 15;
    int b = 30;
    int *ptrA = &a;
    int *ptrB = &b;
    
    swap(ptrA, ptrB);
    return 0;
}`
    },
    c_linked_list: {
        name: "C: Linked List Node Insertion",
        language: "c",
        type: "linked_list",
        code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

int main() {
    struct Node* head = malloc(sizeof(struct Node));
    head->data = 10;
    
    struct Node* second = malloc(sizeof(struct Node));
    second->data = 20;
    head->next = second;
    
    struct Node* third = malloc(sizeof(struct Node));
    third->data = 30;
    second->next = third;
    third->next = NULL;
    
    return 0;
}`
    },
    cpp_sorting: {
        name: "C++: Bubble Sort Array Animation",
        language: "cpp",
        type: "sorting",
        code: `#include <iostream>
using namespace std;

int main() {
    int arr[6] = {45, 12, 89, 23, 7, 56};
    int n = 6;
    
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return 0;
}`
    },
    java_heap: {
        name: "Java: Stack vs Heap & Object References",
        language: "java",
        type: "java_objects",
        code: `public class Main {
    static class Student {
        String name;
        int grade;
        public Student(String name, int grade) {
            this.name = name;
            this.grade = grade;
        }
    }

    public static void main(String[] args) {
        Student s1 = new Student("Alex", 92);
        Student s2 = new Student("Maya", 98);
        Student ref = s1;
        ref.grade = 95;
    }
}`
    },
    java_inheritance: {
        name: "Java: Inheritance & Dynamic Dispatch",
        language: "java",
        type: "java_inheritance",
        code: `class Shape {
    void draw() { System.out.println("Drawing generic shape"); }
}

class Circle extends Shape {
    int radius = 5;
    void draw() { System.out.println("Drawing Circle with radius " + radius); }
}

class Rectangle extends Shape {
    int width = 8, height = 4;
    void draw() { System.out.println("Drawing Rectangle " + width + "x" + height); }
}

public class Main {
    public static void main(String[] args) {
        Shape s = new Circle();
        s.draw(); // Dynamic dispatch calls Circle.draw()
    }
}`
    },
    python_recursion: {
        name: "Python: Recursion Call Tree (Factorial/Fibonacci)",
        language: "python",
        type: "recursion",
        code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(4)
print("4! =", result)`
    },
    python_structures: {
        name: "Python: List & Dictionary Mutation",
        language: "python",
        type: "python_structures",
        code: `user = {
    "username": "coder_pro",
    "score": 100,
    "skills": ["Python", "C++"]
}

user["score"] += 50
user["skills"].append("Java")
user["verified"] = True
`
    }
};
