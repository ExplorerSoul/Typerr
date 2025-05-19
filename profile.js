// DOM Elements
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const messageContainer = document.getElementById('message-container');
const profileSetupContainer = document.getElementById('profile-setup-container');
const successContainer = document.getElementById('success-container');

// Password requirement elements
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqLowercase = document.getElementById('req-lowercase');
const reqNumber = document.getElementById('req-number');

// Step indicators
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

// API URL - replace with your actual backend URL
const API_URL = 'https://typerr-backend.onrender.com/api';
// const API_URL = 'http://localhost:5000/api';  // for local development

// Check if user is authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('typerrToken');
    
    if (!token) {
        // Redirect to login if no token exists
        window.location.href = 'login.html';
        return;
    }
    
    // Validate token with backend
    fetch(`${API_URL}/auth/validate`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) {
            // Token is invalid, redirect to login
            localStorage.removeItem('typerrToken');
            window.location.href = 'login.html';
        } else {
            // Token is valid, check if profile is already set up
            return res.json();
        }
    })
    .then(data => {
        if (data && data.profileComplete) {
            // If profile is already set up, redirect to home page
            window.location.href = 'index.html';
        } else {
            // If user exists but profile is not complete, pre-fill email
            prefillUserData();
        }
    })
    .catch(err => {
        console.error('Error validating authentication:', err);
        showMessage('Authentication error. Please login again.', 'error');
    });
}

// Pre-fill user data if available
function prefillUserData() {
    const userData = localStorage.getItem('typerrUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            
            // If username exists, pre-fill it
            if (user.username) {
                usernameInput.value = user.username;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Display messages to the user
function showMessage(message, type) {
    messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => { messageContainer.innerHTML = ''; }, 5000);
}

// Validate password and update requirements display
function validatePassword() {
    const password = passwordInput.value;
    
    // Check each requirement
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    // Update UI for each requirement
    reqLength.className = hasLength ? 'met' : '';
    reqUppercase.className = hasUppercase ? 'met' : '';
    reqLowercase.className = hasLowercase ? 'met' : '';
    reqNumber.className = hasNumber ? 'met' : '';
    
    // Return overall validity
    return hasLength && hasUppercase && hasLowercase && hasNumber;
}

// Save profile to backend
function saveProfile(profileData) {
    const token = localStorage.getItem('typerrToken');

    if (!token) {
        showMessage('Authentication required. Please login again.', 'error');
        window.location.href = 'login.html';
        return;
    }

    console.log('📤 Sending profile data:', profileData);

    fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
    })
    .then(async response => {
        const text = await response.text(); // Get raw response
        console.log('📥 Raw response:', text);

        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            throw new Error('Invalid JSON response');
        }

        if (response.status === 401 || data.message === 'Unauthorized') {
            throw new Error('Unauthorized');
        }

        if (data.error) {
            showMessage(data.error, 'error');
            return;
        }

        // ✅ Save updated user/token if present
        if (data.user) {
            localStorage.setItem('typerrUser', JSON.stringify(data.user));
        }

        if (data.token) {
            localStorage.setItem('typerrToken', data.token);
        }

        // ✅ Show success and redirect
        profileSetupContainer.style.display = 'none';
        successContainer.style.display = 'block';
        step2.classList.remove('active');
        step3.classList.add('active');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    })
    .catch(err => {
        console.error('❌ saveProfile error:', err);
        if (err.message === 'Unauthorized') {
            showMessage('Your session has expired. Please login again.', 'error');
            localStorage.removeItem('typerrToken');
            window.location.href = 'login.html';
        } else {
            showMessage('An error occurred while saving your profile. Please try again.', 'error');
        }
    });
}

// Event listeners
profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate username
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long', 'error');
        return;
    }
    
    // Validate password
    if (!validatePassword()) {
        showMessage('Please ensure your password meets all requirements', 'error');
        return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Show loading state
    const saveButton = document.getElementById('save-profile-btn');
    const originalButtonText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    // Prepare profile data
    const profileData = {
        username,
        password
    };
    
    // Save profile
    saveProfile(profileData);

    // Reset button state after 10 seconds if not already changed by the saveProfile function
    setTimeout(() => {
        if (saveButton.textContent === 'Saving...') {
            saveButton.disabled = false;
            saveButton.textContent = originalButtonText;
        }
    }, 10000);
});

passwordInput.addEventListener('input', validatePassword);

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Mark first step as complete
    step1.classList.add('complete');
});