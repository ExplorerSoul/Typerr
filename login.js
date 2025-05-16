// DOM Elements
const emailForm = document.getElementById('email-form');
const verificationForm = document.getElementById('verification-form');
const emailContainer = document.getElementById('email-container');
const verificationContainer = document.getElementById('verification-container');
const successContainer = document.getElementById('success-container');
const messageContainer = document.getElementById('message-container');
const resendCodeBtn = document.getElementById('resend-code');
const changeEmailBtn = document.getElementById('change-email');
const emailInput = document.getElementById('email');

// Step indicators
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

// API URL - replace with your actual backend URL
const API_URL = 'https://typerr-backend.onrender.com/api';
// const API_URL = 'http://localhost:5000/api';  // ✅ for localstorage


// Store email for later use
let currentEmail = '';

// Check if user is already logged in
function checkLoggedInStatus() {
    const token = localStorage.getItem('typerrToken');
    console.log("Stored token:", token);

    if (token) {
        fetch(`${API_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log("Validate token status:", response.status);
            if (response.ok) {
                window.location.href = 'index.html';
            } else {
                localStorage.removeItem('typerrToken');
            }
        })
        .catch(err => {
            console.error("Token validation error:", err);
            localStorage.removeItem('typerrToken');
        });
    }
}


// Display messages to the user
function showMessage(message, type) {
    messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => { messageContainer.innerHTML = ''; }, 5000);
}

// Request verification code
function requestVerificationCode(email) {
    fetch(`${API_URL}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showMessage(data.message, 'success');
            currentEmail = email;
            emailContainer.style.display = 'none';
            verificationContainer.style.display = 'block';
            step1.classList.remove('active');
            step2.classList.add('active');
        } else {
            showMessage('Failed to send verification code. Please try again.', 'error');
        }
    })
    .catch(() => showMessage('An error occurred. Please try again later.', 'error'));
}

// Verify code and get token
function verifyCode(email, code) {
    fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('typerrToken', data.token);
            verificationContainer.style.display = 'none';
            successContainer.style.display = 'block';
            step2.classList.remove('active');
            step3.classList.add('active');
            if (data.user) {
                localStorage.setItem('typerrUser', JSON.stringify(data.user));
            }
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            showMessage(data.message || 'Invalid verification code. Please try again.', 'error');
        }
    })
    .catch(() => showMessage('An error occurred. Please try again later.', 'error'));
}

// Event Listeners
emailForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (email) {
        requestVerificationCode(email);
    } else {
        showMessage('Please enter a valid email address.', 'error');
    }
});

verificationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const code = document.getElementById('verification-code').value.trim();
    if (/^\d{6}$/.test(code)) {
        verifyCode(currentEmail, code);
    } else {
        showMessage('Please enter a valid 6-digit verification code.', 'error');
    }
});

resendCodeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentEmail) {
        requestVerificationCode(currentEmail);
    } else {
        showMessage('Email information missing. Please start over.', 'error');
        verificationContainer.style.display = 'none';
        emailContainer.style.display = 'block';
        step2.classList.remove('active');
        step1.classList.add('active');
    }
});

changeEmailBtn.addEventListener('click', function(e) {
    e.preventDefault();
    verificationContainer.style.display = 'none';
    emailContainer.style.display = 'block';
    step2.classList.remove('active');
    step1.classList.add('active');
});

// THIS BLOCK BELOW FAKES THE LOGIN AND NEVER CONNECTS TO BACKEND WHEN YOU RUN LOCALLY
// // Initialize page
// document.addEventListener('DOMContentLoaded', function() {
//     checkLoggedInStatus();

//     // Demo mode for local testing (optional)
//     if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//         console.log('Running in demo mode - no real backend connection');

//         const originalFetch = window.fetch;
//         window.fetch = function(url, options) {
//             if (url.includes('/auth/send-code')) {
//                 console.log('Demo mode: Sending verification code');
//                 return Promise.resolve({
//                     json: () => Promise.resolve({
//                         message: 'Demo: Verification code sent! (Code is 123456)'
//                     })
//                 });
//             } else if (url.includes('/auth/verify-code')) {
//                 const body = JSON.parse(options.body);
//                 if (body.code === '123456') {
//                     return Promise.resolve({
//                         json: () => Promise.resolve({
//                             token: 'demo-token-12345',
//                             user: { email: body.email, name: 'Demo User' }
//                         })
//                     });
//                 } else {
//                     return Promise.resolve({
//                         json: () => Promise.resolve({
//                             message: 'Invalid code. In demo mode, use 123456.'
//                         })
//                     });
//                 }
//             } else if (url.includes('/auth/validate')) {
//                 return Promise.resolve({ ok: false });
//             }
//             return originalFetch(url, options);
//         };
//     }
// });

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkLoggedInStatus();
});

