/**
 * Interactive Learning Experience & Coding Challenges
 * Includes automated test runner, expected vs actual output comparison, and bug fix exercises.
 */

export const LEARNING_CHALLENGES = [
    {
        id: "c_swap",
        title: "C: Pointer Swap Function",
        language: "c",
        difficulty: "Beginner",
        category: "Pointers & Memory",
        description: "Implement a function `swap(int *a, int *b)` in C that swaps the values of two integers using pointer dereferencing.",
        hints: [
            "Remember to use an intermediate temporary variable `int temp = *a;`",
            "Dereference the pointers `*a` and `*b` to assign values, not the pointer addresses themselves."
        ],
        starterCode: `#include <stdio.h>

// TODO: Complete the swap function
void swap(int *a, int *b) {
    // Write your code here
}

int main() {
    int x = 10, y = 20;
    swap(&x, &y);
    printf("%d %d\\n", x, y);
    return 0;
}
`,
        expectedOutput: "20 10\n",
        testCases: [
            { input: "", expected: "20 10\n" }
        ],
        solution: `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 10, y = 20;
    swap(&x, &y);
    printf("%d %d\\n", x, y);
    return 0;
}
`
    },
    {
        id: "cpp_twosum",
        title: "C++: Two Sum Problem",
        language: "cpp",
        difficulty: "Intermediate",
        category: "Algorithms",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        hints: [
            "You can use nested loops or an unordered_map for O(n) lookup."
        ],
        starterCode: `#include <iostream>
#include <vector>

using namespace std;

void twoSum(vector<int>& nums, int target) {
    // Print the indices separated by a space
    for(int i = 0; i < nums.size(); i++) {
        for(int j = i + 1; j < nums.size(); j++) {
            if(nums[i] + nums[j] == target) {
                cout << i << " " << j << endl;
                return;
            }
        }
    }
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    twoSum(nums, target);
    return 0;
}
`,
        expectedOutput: "0 1\n",
        testCases: [
            { input: "", expected: "0 1\n" }
        ]
    },
    {
        id: "py_fib",
        title: "Python: Recursive Fibonacci Tree",
        language: "python",
        difficulty: "Beginner",
        category: "Recursion",
        description: "Implement a recursive `fib(n)` function that returns the n-th Fibonacci number (where fib(0)=0, fib(1)=1, fib(2)=1, fib(6)=8).",
        hints: [
            "Base cases: if n <= 0 return 0; if n == 1 return 1.",
            "Recursive case: return fib(n-1) + fib(n-2)."
        ],
        starterCode: `def fib(n):
    # TODO: Write recursive base cases and step
    if n <= 0:
        return 0
    if n == 1:
        return 1
    return fib(n - 1) + fib(n - 2)

print(fib(6))
`,
        expectedOutput: "8\n",
        testCases: [
            { input: "", expected: "8\n" }
        ]
    },
    {
        id: "java_oop",
        title: "Java: Bank Account OOP Class",
        language: "java",
        difficulty: "Beginner",
        category: "Object-Oriented Programming",
        description: "Create a class `Account` with methods `deposit(double amt)` and `getBalance()`. Print final balance.",
        hints: [
            "Use private fields for encapsulation.",
            "Ensure the main method creates an instance and deposits $500 to initial $1000 balance."
        ],
        starterCode: `public class Main {
    static class Account {
        private double balance;

        public Account(double initial) {
            this.balance = initial;
        }

        public void deposit(double amt) {
            this.balance += amt;
        }

        public double getBalance() {
            return this.balance;
        }
    }

    public static void main(String[] args) {
        Account a = new Account(1000.0);
        a.deposit(500.0);
        System.out.println("Balance: " + a.getBalance());
    }
}
`,
        expectedOutput: "Balance: 1500.0\n",
        testCases: [
            { input: "", expected: "Balance: 1500.0\n" }
        ]
    },
    {
        id: "js_counter",
        title: "JavaScript: DOM Counter State",
        language: "javascript",
        difficulty: "Beginner",
        category: "Web & DOM",
        description: "Calculate and output the total sum of even numbers from 1 to 20.",
        hints: [
            "Use a loop and check if number % 2 === 0"
        ],
        starterCode: `let sum = 0;
for (let i = 1; i <= 20; i++) {
    if (i % 2 === 0) {
        sum += i;
    }
}
console.log("Sum of evens:", sum);
`,
        expectedOutput: "Sum of evens: 110\n",
        testCases: [
            { input: "", expected: "Sum of evens: 110\n" }
        ]
    }
];

export class LearningManager {
    constructor(options = {}) {
        this.editorManager = options.editorManager;
        this.onLoadCode = options.onLoadCode || (() => {});
        this.activeChallenge = LEARNING_CHALLENGES[0];

        this.initUI();
    }

    initUI() {
        this.challengeListEl = document.getElementById('learning-challenge-list');
        this.detailTitle = document.getElementById('learning-detail-title');
        this.detailBadge = document.getElementById('learning-detail-badge');
        this.detailDesc = document.getElementById('learning-detail-desc');
        this.detailHints = document.getElementById('learning-detail-hints');
        this.btnLoadStarter = document.getElementById('learning-btn-load-starter');
        this.btnTestCode = document.getElementById('learning-btn-test');
        this.testResultsContainer = document.getElementById('learning-test-results');

        this.renderChallengeList();
        this.selectChallenge(this.activeChallenge.id);

        this.btnLoadStarter?.addEventListener('click', () => {
            if (this.activeChallenge) {
                this.editorManager.setValue(this.activeChallenge.starterCode);
                if (window.App?.workspace?.activeFile) {
                    window.App.workspace.updateFileContent(window.App.workspace.activeFile, this.activeChallenge.starterCode);
                }
                alert(`Loaded starter code for "${this.activeChallenge.title}" into editor.`);
            }
        });

        this.btnTestCode?.addEventListener('click', () => {
            this.runTests();
        });
    }

    renderChallengeList() {
        if (!this.challengeListEl) return;
        let html = '';
        LEARNING_CHALLENGES.forEach(ch => {
            html += `
                <div class="challenge-item ${ch.id === this.activeChallenge.id ? 'active' : ''}" data-id="${ch.id}">
                    <div class="ch-header">
                        <span class="ch-lang badge">${ch.language.toUpperCase()}</span>
                        <span class="ch-diff ${ch.difficulty.toLowerCase()}">${ch.difficulty}</span>
                    </div>
                    <div class="ch-title">${ch.title}</div>
                </div>
            `;
        });
        this.challengeListEl.innerHTML = html;

        this.challengeListEl.querySelectorAll('.challenge-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                this.selectChallenge(id);
            });
        });
    }

    selectChallenge(id) {
        const found = LEARNING_CHALLENGES.find(c => c.id === id);
        if (!found) return;

        this.activeChallenge = found;

        this.challengeListEl?.querySelectorAll('.challenge-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-id') === id);
        });

        if (this.detailTitle) this.detailTitle.textContent = found.title;
        if (this.detailBadge) {
            this.detailBadge.textContent = `${found.language.toUpperCase()} • ${found.difficulty}`;
        }
        if (this.detailDesc) this.detailDesc.textContent = found.description;

        if (this.detailHints) {
            this.detailHints.innerHTML = found.hints.map(h => `<li>💡 ${h}</li>`).join('');
        }

        if (this.testResultsContainer) {
            this.testResultsContainer.innerHTML = '<div class="test-empty">Click "Run Test Cases" to verify your program against expected output.</div>';
        }
    }

    /**
     * Run test cases by executing user code and comparing actual stdout with expected output
     */
    async runTests() {
        if (!this.activeChallenge || !this.testResultsContainer) return;

        this.testResultsContainer.innerHTML = '<div class="test-loading">Executing test cases via execution engine...</div>';
        
        const code = this.editorManager.getValue();
        const lang = this.activeChallenge.language;

        try {
            const result = await window.App.judge0.executeCode({
                language: lang,
                sourceCode: code,
                stdin: this.activeChallenge.testCases[0]?.input || '',
                onStatusUpdate: () => {}
            });

            const actualOutput = (result.stdout || '').trim();
            const expectedOutput = (this.activeChallenge.expectedOutput || '').trim();
            const isPassed = actualOutput === expectedOutput && !result.hasError;

            let html = `
                <div class="test-verdict-card ${isPassed ? 'verdict-pass' : 'verdict-fail'}">
                    <div class="verdict-header">
                        <span class="verdict-icon">${isPassed ? '✓' : '✗'}</span>
                        <span class="verdict-title">${isPassed ? 'All Test Cases Passed!' : 'Test Case Failed'}</span>
                        <span class="verdict-time">${result.executionTime}</span>
                    </div>
                    <div class="verdict-comparison">
                        <div class="comp-col">
                            <div class="comp-label">Expected Output:</div>
                            <pre class="comp-box expected">${this.escapeHTML(expectedOutput)}</pre>
                        </div>
                        <div class="comp-col">
                            <div class="comp-label">Actual Output:</div>
                            <pre class="comp-box actual ${isPassed ? 'match' : 'mismatch'}">${this.escapeHTML(actualOutput || result.stderr || '<no output>')}</pre>
                        </div>
                    </div>
                    ${!isPassed ? `<div class="verdict-tip">Check your logic or consult the hints above to match the expected format.</div>` : `<div class="verdict-success">Great job! You solved this challenge correctly.</div>`}
                </div>
            `;

            this.testResultsContainer.innerHTML = html;

            // Also send results to bottom panel
            const termTestsEl = document.getElementById('term-tests-output');
            if (termTestsEl) termTestsEl.innerHTML = html;

        } catch (err) {
            this.testResultsContainer.innerHTML = `<div class="test-error">Error executing tests: ${this.escapeHTML(err.message)}</div>`;
        }
    }

    escapeHTML(str) {
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}
