// Sign-up Page JavaScript

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Load data
function loadData() {
    const saved = localStorage.getItem('agrilinkData');
    if (saved) {
        Object.assign(agrilinkData, JSON.parse(saved));
    }
}

// Save data
function saveData() {
    localStorage.setItem('agrilinkData', JSON.stringify(agrilinkData));
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number (numeric)
function validatePhone(phone) {
    return /^[0-9+\-\s()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// Clear error message
function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';
}

// Handle form submission
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    clearError();
    
    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value.trim();
    const street = document.getElementById('street').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const bankAccount = document.getElementById('bankAccount').value.trim();
    const accountPasscode = document.getElementById('accountPasscode').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validation
    if (!fullName) {
        showError('Please enter your full name');
        return;
    }
    
    if (!email) {
        showError('Please enter your email address');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!password) {
        showError('Please enter a password');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (!phone) {
        showError('Please enter your phone number');
        return;
    }
    
    if (!validatePhone(phone)) {
        showError('Please enter a valid phone number');
        return;
    }
    
    if (!street || !city || !state || !postalCode) {
        showError('Please complete all address fields');
        return;
    }
    
    if (!bankAccount) {
        showError('Please enter your bank account number');
        return;
    }
    
    if (!accountPasscode) {
        showError('Please enter your account passcode');
        return;
    }
    
    // Validate passcode (4-6 digits)
    if (!/^\d{4,6}$/.test(accountPasscode)) {
        showError('Account passcode must be 4-6 digits');
        return;
    }
    
    // Load existing data
    loadData();
    
    // Check if email already exists
    if (agrilinkData.buyers && agrilinkData.buyers.some(b => b.email === email)) {
        showError('An account with this email already exists');
        return;
    }
    
    // Generate unique buyer ID
    let buyerId;
    do {
        buyerId = 'B' + String(Math.floor(1000 + Math.random() * 9000));
    } while (agrilinkData.buyers && agrilinkData.buyers.some(b => b.id === buyerId));
    
    // Create address object
    const address = {
        street: street,
        city: city,
        state: state,
        postalCode: postalCode,
        full: `${street}, ${city}, ${state} ${postalCode}`
    };
    
    // Create new buyer object
    const newBuyer = {
        id: buyerId,
        name: fullName,
        email: email,
        password: password, // In production, this should be hashed
        phone: phone,
        address: address,
        location: address.full,
        profilePhoto: null, // Can be added later for profile picture upload
        bankAccount: bankAccount,
        accountPasscode: accountPasscode, // In production, this should be hashed
        orders: [],
        dateJoined: new Date().toISOString().split('T')[0]
    };
    
    // Initialize buyers array if it doesn't exist
    if (!agrilinkData.buyers) {
        agrilinkData.buyers = [];
    }
    
    // Add buyer to data
    agrilinkData.buyers.push(newBuyer);
    
    // Add to audit log
    if (!agrilinkData.auditLog) {
        agrilinkData.auditLog = [];
    }
    
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Buyer Registered',
        userId: buyerId,
        details: `New buyer account created: ${fullName} (${email})`
    });
    
    // Save data
    saveData();
    
    // Store buyer session
    if (rememberMe) {
        localStorage.setItem('agrilinkBuyerId', buyerId);
        localStorage.setItem('agrilinkBuyerName', fullName);
        localStorage.setItem('agrilinkBuyerEmail', email);
    } else {
        sessionStorage.setItem('agrilinkBuyerId', buyerId);
        sessionStorage.setItem('agrilinkBuyerName', fullName);
        sessionStorage.setItem('agrilinkBuyerEmail', email);
    }
    
    // Show success modal
    const successModal = document.getElementById('successModal');
    successModal.classList.add('show');
    
    // Redirect to buyer panel after 2 seconds
    setTimeout(() => {
        window.location.href = 'buyer.html';
    }, 2000);
});

// Check for existing account (simple demo - just redirects to buyer panel)
function checkExistingAccount() {
    const existingBuyerId = localStorage.getItem('agrilinkBuyerId') || sessionStorage.getItem('agrilinkBuyerId');
    if (existingBuyerId) {
        window.location.href = 'buyer.html';
    } else {
        alert('No existing account found. Please create a new account.');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const existingBuyerId = localStorage.getItem('agrilinkBuyerId') || sessionStorage.getItem('agrilinkBuyerId');
    if (existingBuyerId) {
        // Redirect to buyer panel if already logged in
        window.location.href = 'buyer.html';
    }
});

