// DOM Elements
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const messageContainer = document.getElementById('message-container');
const profileSetupContainer = document.getElementById('profile-setup-container');
const successContainer = document.getElementById('success-container');

// Password requirement elements
let reqLength = document.getElementById('req-length');
let reqUppercase = document.getElementById('req-uppercase');
let reqLowercase = document.getElementById('req-lowercase');
let reqNumber = document.getElementById('req-number');

// Step indicators
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

// API URL - replace with your actual backend URL
const API_URL = 'https://typerr-backend.onrender.com/api';
// const API_URL = 'http://localhost:5000/api';  // for local development

// Track if this is an edit session
let isEditMode = false;
let currentUser = null;

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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('✅ Auth validation response:', data);
        currentUser = data;
        
        if (data && data.profileComplete) {
            // Profile is complete - this is edit mode
            isEditMode = true;
            updateUIForEditMode();
            prefillUserData(data);
        } else {
            // If user exists but profile is not complete, pre-fill available data
            prefillUserData(data);
        }
    })
    .catch(err => {
        console.error('❌ Error validating authentication:', err);
        showMessage('Authentication error. Please login again.', 'error');
        // Clear invalid token and redirect
        localStorage.removeItem('typerrToken');
        localStorage.removeItem('typerrUser');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });
}

// Update UI for edit mode
function updateUIForEditMode() {
    // Update title and description
    document.querySelector('.profile-title h1').textContent = 'Edit Profile';
    document.querySelector('.profile-title .description').textContent = 'Update your profile information';
    
    // Update step indicators
    step1.classList.add('complete');
    step2.classList.add('active');
    step3.classList.remove('active');
    
    // Update button text
    document.getElementById('save-profile-btn').textContent = 'Update Profile';
    
    // Make password fields optional for editing
    passwordInput.required = false;
    confirmPasswordInput.required = false;
    
    // Add note about password
    const passwordRequirements = document.querySelector('.password-requirements');
    passwordRequirements.innerHTML = `
        <strong>Leave password fields empty to keep your current password</strong><br>
        Or enter a new password that meets these requirements:
        <ul>
            <li id="req-length">At least 8 characters</li>
            <li id="req-uppercase">At least one uppercase letter</li>
            <li id="req-lowercase">At least one lowercase letter</li>
            <li id="req-number">At least one number</li>
        </ul>
    `;
    
    // Re-attach requirement elements after updating HTML
    reqLength = document.getElementById('req-length');
    reqUppercase = document.getElementById('req-uppercase');
    reqLowercase = document.getElementById('req-lowercase');
    reqNumber = document.getElementById('req-number');
}

// Pre-fill user data if available
function prefillUserData(userData = null) {
    // Use provided userData or fallback to localStorage
    let user = userData;
    
    if (!user) {
        const storedUserData = localStorage.getItem('typerrUser');
        if (storedUserData) {
            try {
                user = JSON.parse(storedUserData);
            } catch (e) {
                console.error('Error parsing stored user data:', e);
                return;
            }
        }
    }
    
    if (user && user.username) {
        usernameInput.value = user.username;
        console.log('✅ Pre-filled username:', user.username);
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
    
    // If in edit mode and password is empty, it's valid (keeping current password)
    if (isEditMode && password === '') {
        // Clear all requirement indicators
        if (reqLength) reqLength.className = '';
        if (reqUppercase) reqUppercase.className = '';
        if (reqLowercase) reqLowercase.className = '';
        if (reqNumber) reqNumber.className = '';
        return true;
    }
    
    // Check each requirement
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    // Update UI for each requirement
    if (reqLength) reqLength.className = hasLength ? 'met' : '';
    if (reqUppercase) reqUppercase.className = hasUppercase ? 'met' : '';
    if (reqLowercase) reqLowercase.className = hasLowercase ? 'met' : '';
    if (reqNumber) reqNumber.className = hasNumber ? 'met' : '';
    
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

    const requestUrl = isEditMode ? `${API_URL}/users/profile/update` : `${API_URL}/users/profile`;
    const requestMethod = isEditMode ? 'PUT' : 'POST';

    fetch(requestUrl, {
        method: requestMethod,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
    })
    .then(async response => {
        console.log('📥 Response status:', response.status);
        
        if (response.status === 401) {
            throw new Error('Unauthorized - Token expired or invalid');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('✅ Profile save response:', data);
        
        if (data.error) {
            showMessage(data.error, 'error');
            return;
        }

        // Update stored user data with new information
        if (data.user) {
            localStorage.setItem('typerrUser', JSON.stringify(data.user));
            console.log('✅ Updated user data in localStorage:', data.user);
        }

        // Update token if provided
        if (data.token) {
            localStorage.setItem('typerrToken', data.token);
        }

        // Show success and redirect
        profileSetupContainer.style.display = 'none';
        successContainer.style.display = 'block';
        
        // Update success message for edit mode
        if (isEditMode) {
            successContainer.innerHTML = `
                <h2 style="color: var(--secondary-color); margin-bottom: 20px;">Profile Updated!</h2>
                <p>Your profile has been updated successfully.</p>
                <p>Redirecting back to the home page...</p>
            `;
        }
        
        step2.classList.remove('active');
        step3.classList.add('active');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    })
    .catch(err => {
        console.error('❌ saveProfile error:', err);
        
        if (err.message.includes('Unauthorized') || err.message.includes('401')) {
            showMessage('Your session has expired. Please login again.', 'error');
            localStorage.removeItem('typerrToken');
            localStorage.removeItem('typerrUser');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(`Error saving profile: ${err.message}`, 'error');
        }
    })
    .finally(() => {
        // Reset button state
        const saveButton = document.getElementById('save-profile-btn');
        saveButton.disabled = false;
        saveButton.textContent = isEditMode ? 'Update Profile' : 'Save Profile';
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
    
    // Validate password (only if provided in edit mode, or always in new profile mode)
    if (!isEditMode || password !== '') {
        if (!validatePassword()) {
            showMessage('Please ensure your password meets all requirements', 'error');
            return;
        }
        
        // Check if passwords match
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
    }
    
    // Prepare profile data
    let profileData = { username };
    
    // In edit mode, only include password if it's being changed
    if (!isEditMode || (password !== '' && confirmPassword !== '')) {
        profileData.password = password;
    }
    
    console.log('📤 Profile data to send:', profileData);
    
    // Show loading state
    const saveButton = document.getElementById('save-profile-btn');
    saveButton.disabled = true;
    saveButton.textContent = isEditMode ? 'Updating...' : 'Saving...';
    
    // Save profile
    saveProfile(profileData);
});

// Add password validation on input
if (passwordInput) {
    passwordInput.addEventListener('input', validatePassword);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page loaded');
    checkAuthStatus();
    
    // Mark first step as complete
    if (step1) {
        step1.classList.add('complete');
    }
});