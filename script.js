// DOM Elements
const codeDisplay = document.getElementById('code-display');
const codeInput = document.getElementById('code-input');
const timerDisplay = document.getElementById('timer');
const wpmValue = document.getElementById('wpm-value');
const accuracyValue = document.getElementById('accuracy-value');
const timeValue = document.getElementById('time-value');
const errorsValue = document.getElementById('errors-value');
const startButton = document.getElementById('start-btn');
const resetButton = document.getElementById('reset-btn');
const historyData = document.getElementById('history-data');
const overlay = document.getElementById('overlay');
const resultsPanel = document.getElementById('results');

// Settings elements
const languageSelect = document.getElementById('language-select');
const difficultySelect = document.getElementById('difficulty-select');
const timeSelect = document.getElementById('time-select');
const modeSelect = document.getElementById('mode-select');

// Application state
let currentCode = '';
let timer = null;
let startTime = 0;
let endTime = 0;
let isRunning = false;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let errorCount = 0;
let timeLimit = 60; // Default time limit in seconds
let practiceMode = 'standard'; // Default practice mode
let currentLanguage = 'javascript'; // Default language
let typingHistory = JSON.parse(localStorage.getItem('TyperrHistory')) || [];

// Initialize the application
function initialize() {
    // Load settings
    loadSettings();
    
    // Display history
    displayHistory();
    
    // Bind events
    bindEvents();
}

// Load saved settings from localStorage
function loadSettings() {
    const savedLanguage = localStorage.getItem('TyperrLanguage');
    const savedDifficulty = localStorage.getItem('TyperrDifficulty');
    const savedTimeLimit = localStorage.getItem('TyperrTimeLimit');
    const savedMode = localStorage.getItem('TyperrMode');
    
    if (savedLanguage) languageSelect.value = savedLanguage;
    if (savedDifficulty) difficultySelect.value = savedDifficulty;
    if (savedTimeLimit) timeSelect.value = savedTimeLimit;
    if (savedMode) modeSelect.value = savedMode;
    
    // Update current settings
    currentLanguage = languageSelect.value;
    timeLimit = parseInt(timeSelect.value);
    practiceMode = modeSelect.value;
}

// Save current settings to localStorage
function saveSettings() {
    localStorage.setItem('TyperrLanguage', languageSelect.value);
    localStorage.setItem('TyperrDifficulty', difficultySelect.value);
    localStorage.setItem('TyperrTimeLimit', timeSelect.value);
    localStorage.setItem('TyperrMode', modeSelect.value);
}

// Bind event listeners
function bindEvents() {
    startButton.addEventListener('click', startPractice);
    resetButton.addEventListener('click', resetPractice);
    codeInput.addEventListener('input', checkTyping);
    
    // Settings change events
    languageSelect.addEventListener('change', function() {
        currentLanguage = this.value;
        saveSettings();
    });
    
    difficultySelect.addEventListener('change', function() {
        saveSettings();
    });
    
    timeSelect.addEventListener('change', function() {
        timeLimit = parseInt(this.value);
        saveSettings();
    });
    
    modeSelect.addEventListener('change', function() {
        practiceMode = this.value;
        saveSettings();
    });
    
    // Prevent copying from the code display
    codeDisplay.addEventListener('copy', e => e.preventDefault());
    
    // Prevent pasting into the input field
    codeInput.addEventListener('paste', e => e.preventDefault());
}

// Start typing practice
function startPractice() {
    if (isRunning) return;
    
    isRunning = true;
    startButton.disabled = true;
    resetButton.disabled = false;
    codeInput.disabled = false;
    codeInput.value = '';
    codeInput.focus();
    
    // Get code snippet based on current language and difficulty
    currentCode = getCodeSnippet(currentLanguage, difficultySelect.value);
    
    // Display the code with highlighting for the first character
    displayCodeWithHighlighting('');
    
    // Reset counters
    totalKeystrokes = 0;
    correctKeystrokes = 0;
    errorCount = 0;
    
    // Hide overlay
    overlay.style.display = 'none';
    
    // Reset results
    wpmValue.textContent = '0';
    accuracyValue.textContent = '100%';
    timeValue.textContent = '0s';
    errorsValue.textContent = '0';
    
    // Start the timer
    startTime = Date.now();
    updateTimer();
    
    // Set time limit if applicable
    if (timeLimit > 0) {
        timer = setInterval(function() {
            const elapsed = updateTimer();
            
            // Check if time's up
            if (timeLimit > 0 && elapsed >= timeLimit) {
                endPractice();
            }
        }, 1000);
    } else {
        timer = setInterval(updateTimer, 1000);
    }
}

// Update the timer display and return elapsed time in seconds
function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    
    // Calculate minutes and seconds
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    
    // Update timer display
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // If time limit is set, also show countdown
    if (timeLimit > 0) {
        const remaining = timeLimit - elapsedTime;
        if (remaining <= 10) {
            timerDisplay.classList.add('timer-warning');
        }
    }
    
    // Update WPM in real-time
    if (elapsedTime > 0) {
        calculatePerformance(elapsedTime);
    }
    
    return elapsedTime;
}

// Display code with syntax highlighting and tracking
function displayCodeWithHighlighting(typedCode) {
    let html = '';
    
    for (let i = 0; i < currentCode.length; i++) {
        if (i < typedCode.length) {
            if (typedCode[i] === currentCode[i]) {
                // Correct character
                html += `<span class="correct">${escapeHTML(currentCode[i])}</span>`;
            } else {
                // Incorrect character
                html += `<span class="incorrect">${escapeHTML(currentCode[i])}</span>`;
            }
        } else if (i === typedCode.length) {
            // Current position
            html += `<span class="current">${escapeHTML(currentCode[i])}</span>`;
        } else {
            // Future characters - preserve code formatting with proper escaping
            html += escapeHTML(currentCode[i]);
        }
    }
    
    codeDisplay.innerHTML = html;
    
    // Scroll the display to match input position
    if (typedCode.length > 0) {
        const currentSpan = codeDisplay.querySelector('.current');
        if (currentSpan) {
            const displayRect = codeDisplay.getBoundingClientRect();
            const spanRect = currentSpan.getBoundingClientRect();
            
            // Calculate if the current position is out of view
            if (spanRect.top < displayRect.top || spanRect.bottom > displayRect.bottom) {
                currentSpan.scrollIntoView({ block: 'center' });
            }
        }
    }
}

// Helper function to escape HTML special characters
function escapeHTML(text) {
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    
    return String(text).replace(/[&<>"'`=\/]/g, function(s) {
        return entityMap[s];
    });
}

// Check typing accuracy and progress
function checkTyping() {
    const typedCode = codeInput.value;
    displayCodeWithHighlighting(typedCode);
    
    // Count correct characters and errors
    totalKeystrokes = typedCode.length;
    correctKeystrokes = 0;
    errorCount = 0;
    
    for (let i = 0; i < typedCode.length; i++) {
        if (i < currentCode.length) {
            if (typedCode[i] === currentCode[i]) {
                correctKeystrokes++;
            } else {
                errorCount++;
            }
        } else {
            // Extra characters beyond the target text
            errorCount++;
        }
    }
    
    // Update error count display
    errorsValue.textContent = errorCount;
    
    // Calculate and update performance metrics
    const elapsedTime = (Date.now() - startTime) / 1000;
    calculatePerformance(elapsedTime);
    
    // Check if practice is complete
    if (typedCode === currentCode) {
        endPractice();
    }
    
    // Handle special modes
    if (practiceMode === 'error-penalty' && errorCount > 5) {
        overlay.textContent = 'Too many errors!';
        overlay.style.display = 'flex';
        setTimeout(() => {
            resetPractice();
        }, 2000);
    }
}

// Calculate and display performance metrics
function calculatePerformance(elapsedTime) {
    // Calculate WPM (standard: 5 characters = 1 word for code)
    const minutes = elapsedTime / 60;
    const words = correctKeystrokes / 5; // Using standard 5 char = 1 word
    const wpm = Math.round(words / minutes) || 0;
    
    // Calculate accuracy
    const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
    
    // Update displays
    wpmValue.textContent = wpm;
    accuracyValue.textContent = `${accuracy}%`;
    timeValue.textContent = `${Math.round(elapsedTime)}s`;
    
    return { wpm, accuracy, elapsedTime };
}

// End the typing practice
function endPractice() {
    clearInterval(timer);
    endTime = Date.now();
    isRunning = false;
    startButton.disabled = false;
    codeInput.disabled = true;

    const practiceTime = (endTime - startTime) / 1000;
    const { wpm, accuracy } = calculatePerformance(practiceTime);

    // Show completion message
    overlay.textContent = 'Complete!';
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 2000);

    // Highlight results panel
    resultsPanel.classList.add('highlight');
    setTimeout(() => {
        resultsPanel.classList.remove('highlight');
    }, 3000);

    // Prepare result data
    const result = {
        date: new Date().toLocaleDateString(),
        language: currentLanguage,
        difficulty: difficultySelect.value,
        wpm,
        accuracy,
        time: Math.round(practiceTime),
        mode: practiceMode
    };

    // Send result to backend
    fetch('https://typerr-backend.onrender.com/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ Session saved to backend:', data);
        displayHistory(); // Refresh history from backend
    })
    .catch(err => {
        console.error('❌ Failed to save session:', err);
        // Optionally show fallback message to user
    });
}


// Reset the typing practice
function resetPractice() {
    clearInterval(timer);
    isRunning = false;
    startButton.disabled = false;  // Enable Start button
    resetButton.disabled = false;  // Enable Reset button
    codeInput.disabled = true;
    codeInput.value = '';
    
    timerDisplay.textContent = '00:00';
    timerDisplay.classList.remove('timer-warning');
    
    wpmValue.textContent = '0';
    accuracyValue.textContent = '0%';
    timeValue.textContent = '0s';
    errorsValue.textContent = '0';
    
    codeDisplay.innerHTML = 'Select a language and click "Start" to begin practice...';
    
    // Hide the overlay so Start button is clickable
    overlay.style.display = 'none';  // <-- Change this from 'flex' to 'none'
    overlay.textContent = 'Ready?';
}


// Display typing history
function displayHistory() {
    historyData.innerHTML = '';

    fetch('https://typerr-backend.onrender.com/api/sessions')
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                const emptyRow = document.createElement('tr');
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 6;
                emptyCell.textContent = 'No practice history available yet';
                emptyCell.classList.add('empty-history');
                emptyRow.appendChild(emptyCell);
                historyData.appendChild(emptyRow);
                return;
            }

            data.forEach((record, index) => {
                const row = document.createElement('tr');

                const dateCell = document.createElement('td');
                dateCell.textContent = record.date;
                row.appendChild(dateCell);

                const langCell = document.createElement('td');
                langCell.textContent = record.language;
                row.appendChild(langCell);

                const diffCell = document.createElement('td');
                diffCell.textContent = record.difficulty;
                row.appendChild(diffCell);

                const wpmCell = document.createElement('td');
                wpmCell.textContent = record.wpm;
                row.appendChild(wpmCell);

                const accCell = document.createElement('td');
                accCell.textContent = `${record.accuracy}%`;
                row.appendChild(accCell);

                const timeCell = document.createElement('td');
                timeCell.textContent = `${record.time}s`;
                row.appendChild(timeCell);

                if (index === 0) {
                    row.classList.add('latest-result');
                }

                historyData.appendChild(row);
            });
        })
        .catch(err => {
            console.error('❌ Failed to load history:', err);
        });
}


// Get code snippet based on language and difficulty
function getCodeSnippet(language, difficulty) {
    // This function should use the snippets defined in snippets.js
    // For now, we'll create a simple fallback in case snippets.js doesn't load
    if (typeof codeSnippets !== 'undefined') {
        // If snippets.js is loaded correctly, use it
        const snippets = codeSnippets[language]?.[difficulty] || [];
        if (snippets.length > 0) {
            return snippets[Math.floor(Math.random() * snippets.length)];
        }
    }
    
    // Fallback snippets if snippets.js fails to load
    const fallbackSnippets = {
        javascript: {
            easy: 'function greet(name) {\n  return `Hello, ${name}!`;\n}',
            medium: 'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}',
            hard: 'const debounce = (func, delay) => {\n  let timeout;\n  return (...args) => {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => func(...args), delay);\n  };\n};',
            expert: 'class BinarySearchTree {\n  constructor() {\n    this.root = null;\n  }\n\n  insert(value) {\n    const newNode = { value, left: null, right: null };\n    if (!this.root) {\n      this.root = newNode;\n      return;\n    }\n    this._insertNode(this.root, newNode);\n  }\n\n  _insertNode(node, newNode) {\n    if (newNode.value < node.value) {\n      if (!node.left) node.left = newNode;\n      else this._insertNode(node.left, newNode);\n    } else {\n      if (!node.right) node.right = newNode;\n      else this._insertNode(node.right, newNode);\n    }\n  }\n}'
        },
        python: {
            easy: 'def greet(name):\n    return f"Hello, {name}!"',
            medium: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
            hard: 'def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)',
            expert: 'class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n\n    def append(self, data):\n        new_node = Node(data)\n        if not self.head:\n            self.head = new_node\n            return\n        last_node = self.head\n        while last_node.next:\n            last_node = last_node.next\n        last_node.next = new_node'
        }
    };
    
    // Try to get a snippet from the fallback
    return fallbackSnippets[language]?.[difficulty] || 
           'console.log("Hello, World!"); // Fallback snippet';
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);