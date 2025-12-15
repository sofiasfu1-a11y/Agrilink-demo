// Buyer Panel JavaScript
let selectedListing = null;
let currentBuyer = null;
let pendingPurchase = null; // Store pending purchase data for passcode verification

// Initialize current buyer from session
function initializeBuyer() {
    const buyerId = localStorage.getItem('agrilinkBuyerId') || sessionStorage.getItem('agrilinkBuyerId');
    const buyerName = localStorage.getItem('agrilinkBuyerName') || sessionStorage.getItem('agrilinkBuyerName');
    const buyerEmail = localStorage.getItem('agrilinkBuyerEmail') || sessionStorage.getItem('agrilinkBuyerEmail');
    
    if (buyerId) {
        loadData();
        // Find buyer in data
        const buyer = agrilinkData.buyers ? agrilinkData.buyers.find(b => b.id === buyerId) : null;
        
        if (buyer) {
            currentBuyer = {
                id: buyer.id,
                name: buyer.name,
                email: buyer.email,
                location: buyer.location || buyer.address?.full || 'Addis Ababa',
                phone: buyer.phone,
                address: buyer.address
            };
        } else {
            // Fallback to session data
            currentBuyer = {
                id: buyerId,
                name: buyerName || 'Buyer',
                email: buyerEmail || '',
                location: 'Addis Ababa'
            };
        }
    } else {
        // Redirect to signup if no buyer found
        window.location.href = 'signup.html';
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

// Map product name to image filename in images folder
function getProductImage(productName) {
    if (!productName) return 'images/teff.jpg';
    
    // Convert product name to lowercase for matching
    const nameLower = productName.toLowerCase();
    
    // Map product names to actual image filenames in images folder
    const imageMap = {
        'teff': 'images/teff.jpg',
        'tomato': 'images/tomato.jpg',
        'onion': 'images/onion.jpg',
        'potato': 'images/pottato.jpg',  // Note: filename is pottato.jpg
        'avocado': 'images/avacado.jpg',  // Note: filename is avacado.jpg
        'banana': 'images/apple.jpg',  // No banana.jpg available, using apple.jpg
        'carrot': 'images/carrot.jpg',
        'pepper': 'images/pepper.jpg',
        'wheat': 'images/wheat.jpg'
    };
    
    return imageMap[nameLower] || 'images/teff.jpg';
}

// Display products
function displayProducts() {
    // Ensure data is loaded
    if (typeof agrilinkData === 'undefined') {
        console.error('agrilinkData is not defined. Make sure shared/data.js is loaded first.');
        return;
    }
    
    loadData();
    
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!productsGrid) {
        console.error('productsGrid element not found');
        return;
    }
    
    // Check if data is loaded
    if (!agrilinkData || !agrilinkData.listings) {
        console.error('Data not loaded properly', agrilinkData);
        productsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Error loading products. Please refresh the page.</div>';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    // Get available listings
    let listings = agrilinkData.listings.filter(l => l && l.status === 'available');
    
    // Apply filters
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cropFilter = document.getElementById('cropFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    if (searchTerm) {
        listings = listings.filter(l => {
            const name = (l.name || l.cropEn || '').toLowerCase();
            const farmerName = (l.farmerName || '').toLowerCase();
            const location = (l.farmerLocation || '').toLowerCase();
            return name.includes(searchTerm) || 
                   farmerName.includes(searchTerm) || 
                   location.includes(searchTerm);
        });
    }
    
    if (cropFilter) {
        listings = listings.filter(l => {
            const name = l.name || l.cropEn;
            return name === cropFilter;
        });
    }
    
    if (priceFilter === 'low') {
        listings.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    } else if (priceFilter === 'high') {
        listings.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    }
    
    if (listings.length === 0) {
        productsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    if (listings.length === 0) {
        productsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    productsGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    productsGrid.innerHTML = listings.map(listing => {
        if (!listing) return '';
        
        const farmer = agrilinkData.farmers ? agrilinkData.farmers.find(f => f && f.id === listing.farmerId) : null;
        const rating = farmer && farmer.rating ? farmer.rating : 0;
        const numRatings = farmer && farmer.numRatings ? farmer.numRatings : 0;
        const successfulDeliveries = farmer && farmer.successfulDeliveries ? farmer.successfulDeliveries : 0;
        const stars = getStarRating(rating);
        const productName = listing.name || listing.cropEn || 'Product';
        const pricePerUnit = listing.pricePerUnit || 0;
        const unit = listing.unit || 'kg';
        const quantity = listing.quantity || 0;
        const farmerName = listing.farmerName || 'Unknown Farmer';
        // Map product name to image filename dynamically
        const image = listing.image || getProductImage(productName);
        
        const priceDisplay = unit === 'quintal' 
            ? `${pricePerUnit} ETB/quintal` 
            : `${pricePerUnit} ETB/kg`;
        const quantityDisplay = unit === 'quintal'
            ? `${quantity} quintals available`
            : `${quantity} kg available`;
        
        return `
            <div class="product-card" data-id="${listing.id}">
                <div class="product-image-container">
                    <img src="${image}" alt="${productName}" class="product-image" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27280%27 height=%27200%27%3E%3Crect fill=%27%23f0f0f0%27 width=%27280%27 height=%27200%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2718%27 dy=%2710.5%27 font-weight=%27bold%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27%3E${productName}%3C/text%3E%3C/svg%3E'">
                </div>
                <div class="product-info">
                    <div class="product-name">${productName}</div>
                    <div class="product-price">${priceDisplay}</div>
                    <div class="product-quantity">📦 ${quantityDisplay}</div>
                    <div class="product-farmer">👨‍🌾 ${farmerName}</div>
                    <div class="farmer-rating-panel">
                        <div class="farmer-rating">
                            <span class="stars">${stars}</span>
                            <span class="rating-value">${rating.toFixed(1)}</span>
                            <span class="rating-count" title="${numRatings} buyers rated">(${numRatings})</span>
                        </div>
                        <div class="successful-deliveries">${successfulDeliveries} successful deliveries</div>
                    </div>
                    <button class="buy-btn" onclick="buyNowDirect('${listing.id}')">Buy Now</button>
                </div>
            </div>
        `;
    }).join('');
}

// Get crop emoji
function getCropEmoji(crop) {
    const emojis = {
        'Teff': '🌾',
        'Tomato': '🍅',
        'Onion': '🧅',
        'Potato': '🥔',
        'Banana': '🍌',
        'Avocado': '🥑'
    };
    return emojis[crop] || '🌾';
}

// Get star rating display
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    if (hasHalfStar) {
        stars += '✨';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
    }
    
    return stars;
}

// Buy Now - Direct Purchase (now shows passcode modal first)
function buyNowDirect(listingId) {
    if (!currentBuyer) {
        showToast('Please log in to make a purchase', 'error');
        return;
    }
    
    loadData();
    const listing = agrilinkData.listings.find(l => l.id === listingId);
    if (!listing) {
        showToast('Product not found', 'error');
        return;
    }
    
    // Check if product is available
    if (listing.status !== 'available' || listing.quantity <= 0) {
        showToast('Product is out of stock', 'error');
        displayProducts(); // Refresh to update UI
        return;
    }
    
    // Use minimum quantity of 1 (or adjust based on unit)
    const quantity = listing.unit === 'quintal' ? 1 : 1; // Default to 1 unit
    
    // Validate quantity is at least 1 and doesn't exceed available stock
    if (quantity < 1) {
        showToast('Minimum order quantity is 1', 'error');
        return;
    }
    
    if (quantity > listing.quantity) {
        showToast(`Insufficient stock available. Only ${listing.quantity} available.`, 'error');
        displayProducts(); // Refresh to update UI
        return;
    }
    
    // Calculate prices
    const basePrice = quantity * listing.pricePerUnit;
    const deliveryFee = basePrice * 0.02; // 2% delivery fee
    const platformFee = basePrice * 0.02; // 2% platform fee
    const finalPrice = basePrice + deliveryFee + platformFee;
    
    // Store pending purchase data
    pendingPurchase = {
        listing: listing,
        quantity: quantity,
        basePrice: basePrice,
        deliveryFee: deliveryFee,
        platformFee: platformFee,
        finalPrice: finalPrice
    };
    
    // Show passcode verification modal
    showPasscodeModal();
}

// Show passcode verification modal
function showPasscodeModal() {
    if (!pendingPurchase) return;
    
    const modal = document.getElementById('passcodeModal');
    const summaryDiv = document.getElementById('orderSummaryPreview');
    const passcodeInput = document.getElementById('passcodeInput');
    const errorDiv = document.getElementById('passcodeError');
    
    // Clear previous input and errors
    passcodeInput.value = '';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    // Display order summary
    const { listing, quantity, basePrice, deliveryFee, platformFee, finalPrice } = pendingPurchase;
    const priceDisplay = listing.unit === 'quintal' 
        ? `${listing.pricePerUnit} ETB/quintal` 
        : `${listing.pricePerUnit} ETB/kg`;
    
    summaryDiv.innerHTML = `
        <div class="summary-header">Order Summary</div>
        <div class="summary-row">
            <span>Product:</span>
            <span><strong>${listing.name || listing.cropEn}</strong></span>
        </div>
        <div class="summary-row">
            <span>Quantity:</span>
            <span>${quantity} ${listing.unit || 'kg'}</span>
        </div>
        <div class="summary-row">
            <span>Price per unit:</span>
            <span>${priceDisplay}</span>
        </div>
        <div class="summary-row">
            <span>Base Price:</span>
            <span>${basePrice.toFixed(2)} ETB</span>
        </div>
        <div class="summary-row highlight">
            <span>Delivery Fee (2%):</span>
            <span>${deliveryFee.toFixed(2)} ETB</span>
        </div>
        <div class="summary-row highlight">
            <span>Platform Fee (2%):</span>
            <span>${platformFee.toFixed(2)} ETB</span>
        </div>
        <div class="summary-row total">
            <span>Total Price:</span>
            <span><strong>${finalPrice.toFixed(2)} ETB</strong></span>
        </div>
    `;
    
    modal.classList.add('show');
    passcodeInput.focus();
}

// Close passcode modal
function closePasscodeModal() {
    const modal = document.getElementById('passcodeModal');
    modal.classList.remove('show');
    pendingPurchase = null;
}

// Toggle passcode visibility
function togglePasscodeVisibility() {
    const input = document.getElementById('passcodeInput');
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Verify passcode and complete purchase
function verifyPasscodeAndPurchase() {
    if (!pendingPurchase) {
        showToast('No pending purchase found', 'error');
        return;
    }
    
    const passcodeInput = document.getElementById('passcodeInput');
    const enteredPasscode = passcodeInput.value.trim();
    const errorDiv = document.getElementById('passcodeError');
    
    // Validate passcode entered
    if (!enteredPasscode) {
        errorDiv.textContent = 'Please enter your account passcode';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!/^\d{4,6}$/.test(enteredPasscode)) {
        errorDiv.textContent = 'Passcode must be 4-6 digits';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Load buyer data to verify passcode
    loadData();
    const buyer = agrilinkData.buyers.find(b => b.id === currentBuyer.id);
    
    if (!buyer || !buyer.accountPasscode) {
        errorDiv.textContent = 'Account passcode not found. Please contact support.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Verify passcode
    if (buyer.accountPasscode !== enteredPasscode) {
        errorDiv.textContent = 'Incorrect passcode. Please try again.';
        errorDiv.style.display = 'block';
        passcodeInput.value = '';
        passcodeInput.focus();
        return;
    }
    
    // Passcode verified - complete the purchase
    completePurchase();
}

// Complete purchase after passcode verification
function completePurchase() {
    if (!pendingPurchase) return;
    
    const { listing, quantity, basePrice, deliveryFee, platformFee, finalPrice } = pendingPurchase;
    
    // Generate unique 4-digit buyer code
    let buyerCode;
    do {
        buyerCode = String(Math.floor(1000 + Math.random() * 9000));
    } while (agrilinkData.orders.some(o => o.buyerCode === buyerCode));
    
    // Get farmer code from listing
    const farmerCode = listing.farmerCode || String(Math.floor(1000 + Math.random() * 9000));
    
    // Assign random delivery agent
    const availableAgents = agrilinkData.deliveryAgents || [];
    const assignedAgent = availableAgents.length > 0 
        ? availableAgents[Math.floor(Math.random() * availableAgents.length)]
        : { id: 'DA001', name: 'Meles Delivery', carId: 'ABC-1234', photo: 'sofi/OIP.webp' };
    
    // Generate random expected delivery time (1-7 days)
    const minDays = 1;
    const maxDays = 7;
    const expectedDaysMin = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const expectedDaysMax = expectedDaysMin + Math.floor(Math.random() * 3) + 1; // Add 1-3 days for range
    const expectedDeliveryTime = `${expectedDaysMin}-${expectedDaysMax} days`;
    
    // Create order
    const orderId = 'O' + String(agrilinkData.orders.length + 1).padStart(3, '0');
    const newOrder = {
        id: orderId,
        buyerId: currentBuyer.id,
        buyerName: currentBuyer.name,
        listingId: listing.id,
        crop: listing.crop,
        cropEn: listing.cropEn,
        name: listing.name || listing.cropEn,
        quantity: quantity,
        unit: listing.unit || 'kg',
        pricePerUnit: listing.pricePerUnit,
        basePrice: basePrice,
        deliveryFee: deliveryFee,
        platformFee: platformFee,
        totalPrice: finalPrice,
        farmerId: listing.farmerId,
        farmerName: listing.farmerName,
        farmerLocation: listing.farmerLocation,
        buyerLocation: currentBuyer.location,
        dateOrdered: new Date().toISOString().split('T')[0],
        status: 'Waiting for Delivery',
        farmerCode: farmerCode,
        buyerCode: buyerCode,
        deliveryAgentId: assignedAgent.id,
        codesVerified: false,
        paymentReleased: false,
        rated: false,
        deliveryTimestamp: null,
        refundRequested: false,
        refundProcessed: false,
        expectedDeliveryTime: expectedDeliveryTime
    };
    
    agrilinkData.orders.push(newOrder);
    
    // Deduct product quantity
    listing.quantity -= quantity;
    if (listing.quantity <= 0) {
        listing.status = 'sold';
    }
    
    // Create delivery
    const deliveryId = 'D' + String(agrilinkData.deliveries.length + 1).padStart(3, '0');
    const newDelivery = {
        id: deliveryId,
        orderId: orderId,
        buyerId: currentBuyer.id,
        buyerName: currentBuyer.name,
        buyerLocation: currentBuyer.location,
        farmerId: listing.farmerId,
        farmerName: listing.farmerName,
        farmerLocation: listing.farmerLocation,
        product: listing.name || listing.cropEn,
        crop: listing.crop || '',
        cropEn: listing.cropEn || listing.name || '',
        quantity: quantity,
        unit: listing.unit || 'kg',
        pickupLocation: listing.farmerLocation || listing.location || '',
        dropoffLocation: currentBuyer.location || '',
        deliveryAgentId: assignedAgent.id,
        deliveryAgentName: assignedAgent.name,
        status: 'Pending',
        farmerCode: farmerCode,
        buyerCode: buyerCode,
        deliveryAgentCode: assignedAgent.id,
        codesVerified: false,
        dateAssigned: new Date().toISOString().split('T')[0],
        dateCreated: new Date().toISOString().split('T')[0]
    };
    
    agrilinkData.deliveries.push(newDelivery);
    
    // Create payment record
    const paymentId = 'P' + String(agrilinkData.payments.length + 1).padStart(3, '0');
    const newPayment = {
        id: paymentId,
        orderId: orderId,
        buyerId: currentBuyer.id,
        farmerId: listing.farmerId,
        amount: finalPrice,
        status: 'Pending',
        dateCreated: new Date().toISOString().split('T')[0],
        dateReleased: null
    };
    
    if (!agrilinkData.payments) {
        agrilinkData.payments = [];
    }
    agrilinkData.payments.push(newPayment);
    
    // Save data
    saveData();
    
    // Close passcode modal
    closePasscodeModal();
    
    // Show success message
    showToast('✅ Purchase confirmed! Passcode verified successfully.', 'success');
    
    // Show delivery agent info (with expected delivery time)
    showPurchaseConfirmation(assignedAgent, buyerCode, newOrder, basePrice, deliveryFee, platformFee, finalPrice, expectedDeliveryTime);
    
    // Refresh product display
    displayProducts();
}

// Show purchase confirmation popup
function showPurchaseConfirmation(agent, buyerCode, order, basePrice, deliveryFee, platformFee, finalPrice, expectedDeliveryTime) {
    const modal = document.getElementById('deliveryAgentModal');
    const infoDiv = document.getElementById('deliveryAgentInfo');
    
    infoDiv.innerHTML = `
        <h2>✅ Order Confirmed!</h2>
        <div class="order-summary">
            <h3>Order Summary</h3>
            <div class="summary-item">
                <span class="summary-label">Product:</span>
                <span class="summary-value">${order.name || order.cropEn}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Quantity:</span>
                <span class="summary-value">${order.quantity} ${order.unit || 'kg'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Base Price:</span>
                <span class="summary-value">${basePrice.toFixed(2)} ETB</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Delivery Fee (2%):</span>
                <span class="summary-value">${deliveryFee.toFixed(2)} ETB</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Platform Fee (2%):</span>
                <span class="summary-value">${platformFee.toFixed(2)} ETB</span>
            </div>
            <div class="summary-item total-item">
                <span class="summary-label">Total Price:</span>
                <span class="summary-value">${finalPrice.toFixed(2)} ETB</span>
            </div>
            ${expectedDeliveryTime ? `
            <div class="summary-item expected-delivery-summary">
                <span class="summary-label">Expected Delivery:</span>
                <span class="summary-value expected-delivery-time">${expectedDeliveryTime}</span>
            </div>
            ` : ''}
        </div>
        <div class="delivery-agent-card">
            <h3>Your Delivery Agent</h3>
            <div class="agent-photo-container">
                <img src="${agent.photo}" alt="${agent.name}" class="agent-photo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27150%27 height=%27150%27%3E%3Crect fill=%27%23ddd%27 width=%27150%27 height=%27150%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2714%27 dy=%2710.5%27 font-weight=%27bold%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27%3E${agent.name}%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="agent-details">
                <div class="agent-detail-item">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${agent.name}</span>
                </div>
                <div class="agent-detail-item">
                    <span class="detail-label">Car ID:</span>
                    <span class="detail-value">${agent.carId}</span>
                </div>
            </div>
        </div>
        <div class="buyer-code-section">
            <h3>📱 Your Delivery Verification Code</h3>
            <div class="code-display">${buyerCode}</div>
            <p class="code-instruction">⚠️ Please provide this code to the delivery agent upon arrival</p>
        </div>
        <button class="btn-close-modal" onclick="closeDeliveryAgentModal()">Got it!</button>
    `;
    
    modal.classList.add('show');
}

// Open product detail modal
function openProductDetail(listingId) {
    loadData();
    const listing = agrilinkData.listings.find(l => l.id === listingId);
    if (!listing) return;
    
    selectedListing = listing;
    const modal = document.getElementById('productModal');
    const detail = document.getElementById('productDetail');
    
    const productName = listing.name || listing.cropEn;
    const farmer = agrilinkData.farmers.find(f => f.id === listing.farmerId);
    const rating = farmer ? farmer.rating : 0;
    const numRatings = farmer ? farmer.numRatings : 0;
    const successfulDeliveries = farmer ? farmer.successfulDeliveries : 0;
    const stars = getStarRating(rating);
    const priceDisplay = listing.unit === 'quintal' 
        ? `${listing.pricePerUnit} ETB per quintal` 
        : `${listing.pricePerUnit} ETB per kg`;
    const quantityDisplay = listing.unit === 'quintal'
        ? `${listing.quantity} quintals`
        : `${listing.quantity} kg`;
    
    detail.innerHTML = `
        <div class="detail-image-container">
            <img src="${listing.image || getProductImage(productName)}" alt="${productName}" class="detail-image" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27600%27 height=%27300%27%3E%3Crect fill=%27%23f0f0f0%27 width=%27600%27 height=%27300%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2724%27 dy=%2710.5%27 font-weight=%27bold%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27%3E${productName}%3C/text%3E%3C/svg%3E'">
        </div>
        <div class="detail-name">${productName}</div>
        <div class="detail-price">${priceDisplay}</div>
        <div class="detail-info">
            <div class="detail-info-item">
                <span class="detail-info-label">Available Quantity:</span>
                <span class="detail-info-value">${quantityDisplay}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label">Farmer:</span>
                <span class="detail-info-value">${listing.farmerName}</span>
            </div>
            <div class="detail-info-item farmer-rating-detail">
                <span class="detail-info-label">Farmer Rating:</span>
                <span class="detail-info-value">
                    <span class="stars">${stars}</span>
                    <span class="rating-value">${rating.toFixed(1)}</span>
                    <span class="rating-count">(${numRatings} ratings)</span>
                </span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label">Successful Deliveries:</span>
                <span class="detail-info-value">${successfulDeliveries}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label">Location:</span>
                <span class="detail-info-value">${listing.farmerLocation}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-info-label">Listed Date:</span>
                <span class="detail-info-value">${listing.dateListed}</span>
            </div>
        </div>
        <button class="checkout-btn" onclick="openCheckout()">Proceed to Checkout</button>
    `;
    
    modal.classList.add('show');
}

// Open checkout modal
function openCheckout() {
    if (!selectedListing) return;
    
    const productModal = document.getElementById('productModal');
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutForm = document.getElementById('checkoutForm');
    
    productModal.classList.remove('show');
    
    const productName = selectedListing.name || selectedListing.cropEn;
    const priceDisplay = selectedListing.unit === 'quintal' 
        ? `${selectedListing.pricePerUnit} ETB per quintal` 
        : `${selectedListing.pricePerUnit} ETB per kg`;
    const quantityLabel = selectedListing.unit === 'quintal' ? 'Quantity (quintals):' : 'Quantity (kg):';
    const quantityDisplay = selectedListing.unit === 'quintal'
        ? `${selectedListing.quantity} quintals`
        : `${selectedListing.quantity} kg`;
    
    checkoutForm.innerHTML = `
        <h2>Checkout</h2>
        <div class="checkout-form-group">
            <label class="checkout-form-label">Product:</label>
            <div>${productName}</div>
        </div>
        <div class="checkout-form-group">
            <label class="checkout-form-label">Price:</label>
            <div>${priceDisplay}</div>
        </div>
        <div class="checkout-form-group">
            <label class="checkout-form-label">Available Quantity:</label>
            <div>${quantityDisplay}</div>
        </div>
        <div class="checkout-form-group">
            <label class="checkout-form-label">${quantityLabel}</label>
            <input type="number" id="checkoutQuantity" class="checkout-form-input" min="1" max="${selectedListing.quantity}" value="1" step="1">
            <small style="display: block; margin-top: 5px; color: #666; font-size: 0.9em;">Available: ${selectedListing.quantity} ${selectedListing.unit || 'kg'} (Max: ${selectedListing.quantity})</small>
        </div>
        <div class="checkout-summary">
            <div class="checkout-summary-item">
                <span>Subtotal:</span>
                <span id="checkoutSubtotal">${selectedListing.pricePerUnit} ETB</span>
            </div>
            <div class="checkout-summary-total">
                <span>Total:</span>
                <span id="checkoutTotal">${selectedListing.pricePerUnit} ETB</span>
            </div>
        </div>
        <button class="confirm-btn" onclick="confirmPurchase()">Confirm Purchase</button>
    `;
    
    checkoutModal.classList.add('show');
    
    // Update total on quantity change with strict validation
    document.getElementById('checkoutQuantity').addEventListener('input', function() {
        let quantity = parseInt(this.value) || 0;
        const maxQty = selectedListing.quantity;
        const minQty = 1;
        
        // Enforce minimum quantity of 1
        if (quantity < minQty) {
            this.value = minQty;
            quantity = minQty;
        }
        
        // Enforce maximum quantity (available stock)
        if (quantity > maxQty) {
            this.value = maxQty;
            quantity = maxQty;
            showToast(`Maximum available quantity is ${maxQty}`, 'error');
        }
        
        // Update totals
        const subtotal = quantity * selectedListing.pricePerUnit;
        document.getElementById('checkoutSubtotal').textContent = subtotal + ' ETB';
        document.getElementById('checkoutTotal').textContent = subtotal + ' ETB';
    });
    
    // Also validate on blur (when user leaves the field)
    document.getElementById('checkoutQuantity').addEventListener('blur', function() {
        let quantity = parseInt(this.value) || 0;
        const maxQty = selectedListing.quantity;
        const minQty = 1;
        
        if (quantity < minQty) {
            this.value = minQty;
            quantity = minQty;
        } else if (quantity > maxQty) {
            this.value = maxQty;
            quantity = maxQty;
            showToast(`Maximum available quantity is ${maxQty}`, 'error');
        }
        
        // Update totals after validation
        const subtotal = quantity * selectedListing.pricePerUnit;
        document.getElementById('checkoutSubtotal').textContent = subtotal + ' ETB';
        document.getElementById('checkoutTotal').textContent = subtotal + ' ETB';
    });
}

// Confirm purchase
function confirmPurchase() {
    if (!selectedListing) return;
    
    // Reload data to get latest stock
    loadData();
    const currentListing = agrilinkData.listings.find(l => l.id === selectedListing.id);
    if (!currentListing) {
        showToast('Product not found', 'error');
        return;
    }
    
    let quantity = parseInt(document.getElementById('checkoutQuantity').value);
    
    // Validate quantity is a number and at least 1
    if (!quantity || isNaN(quantity) || quantity <= 0) {
        showToast('Please enter a valid quantity (minimum 1)', 'error');
        document.getElementById('checkoutQuantity').value = 1;
        return;
    }
    
    // Validate quantity doesn't exceed available stock
    if (quantity > currentListing.quantity) {
        showToast(`Quantity exceeds available stock. Maximum available: ${currentListing.quantity}`, 'error');
        document.getElementById('checkoutQuantity').value = currentListing.quantity;
        document.getElementById('checkoutQuantity').max = currentListing.quantity;
        // Update selectedListing to reflect current stock
        selectedListing.quantity = currentListing.quantity;
        return;
    }
    
    // Update selectedListing with latest data
    selectedListing.quantity = currentListing.quantity;
    
    loadData();
    
    // Generate buyer code (4-digit code for delivery verification)
    const buyerCode = String(Math.floor(1000 + Math.random() * 9000));
    
    // Get farmer code from listing
    const farmerCode = selectedListing.farmerCode || String(Math.floor(1000 + Math.random() * 9000));
    
    // Assign delivery agent (random for demo)
    const availableAgents = agrilinkData.deliveryAgents || [];
    const assignedAgent = availableAgents.length > 0 
        ? availableAgents[Math.floor(Math.random() * availableAgents.length)]
        : { id: 'DA001', name: 'Meles Delivery', carId: 'ABC-1234', photo: 'sofi/OIP.webp' };
    
    // Generate random expected delivery time (1-7 days)
    const minDays = 1;
    const maxDays = 7;
    const expectedDaysMin = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const expectedDaysMax = expectedDaysMin + Math.floor(Math.random() * 3) + 1; // Add 1-3 days for range
    const expectedDeliveryTime = `${expectedDaysMin}-${expectedDaysMax} days`;
    
    // Create order
    const orderId = 'O' + String(agrilinkData.orders.length + 1).padStart(3, '0');
    const newOrder = {
        id: orderId,
        buyerId: currentBuyer.id,
        buyerName: currentBuyer.name,
        listingId: selectedListing.id,
        crop: selectedListing.crop,
        cropEn: selectedListing.cropEn,
        quantity: quantity,
        pricePerUnit: selectedListing.pricePerUnit,
        totalPrice: quantity * selectedListing.pricePerUnit,
        farmerId: selectedListing.farmerId,
        farmerName: selectedListing.farmerName,
        farmerLocation: selectedListing.farmerLocation,
        buyerLocation: currentBuyer.location,
        dateOrdered: new Date().toISOString().split('T')[0],
        status: 'Waiting for Delivery',
        farmerCode: farmerCode,  // Code from farmer's listing
        buyerCode: buyerCode,     // Code generated at checkout
        deliveryAgentId: assignedAgent.id,
        codesVerified: false,
        paymentReleased: false,
        rated: false,  // Whether buyer has rated the farmer
        deliveryTimestamp: null,  // Will be set when delivery is confirmed
        refundRequested: false,  // Whether buyer has requested a refund
        refundProcessed: false,  // Whether refund has been processed
        expectedDeliveryTime: expectedDeliveryTime
    };
    
    agrilinkData.orders.push(newOrder);
    
    // Update listing quantity
    selectedListing.quantity -= quantity;
    if (selectedListing.quantity <= 0) {
        selectedListing.status = 'sold';
    }
    
    // Create delivery
    const deliveryId = 'D' + String(agrilinkData.deliveries.length + 1).padStart(3, '0');
    const newDelivery = {
        id: deliveryId,
        orderId: orderId,
        buyerId: currentBuyer.id,
        buyerName: currentBuyer.name,
        farmerId: selectedListing.farmerId,
        farmerName: selectedListing.farmerName,
        crop: selectedListing.crop,
        cropEn: selectedListing.cropEn,
        quantity: quantity,
        pickupLocation: selectedListing.farmerLocation,
        dropoffLocation: currentBuyer.location,
        dateCreated: new Date().toISOString().split('T')[0],
        dateDelivered: null,
        dateDeliveredTime: null,
        status: 'Pending',
        deliveryAgentId: assignedAgent.id,
        codesVerified: false,
        paymentReleased: false
    };
    
    agrilinkData.deliveries.push(newDelivery);
    
    // Create payment
    const paymentId = 'P' + String(agrilinkData.payments.length + 1).padStart(3, '0');
    const newPayment = {
        id: paymentId,
        orderId: orderId,
        deliveryId: deliveryId,
        farmerId: selectedListing.farmerId,
        amount: quantity * selectedListing.pricePerUnit,
        status: 'Pending Release',
        dateCreated: new Date().toISOString().split('T')[0],
        dateReleased: null
    };
    
    agrilinkData.payments.push(newPayment);
    
    // Add to audit log
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Order Placed',
        userId: currentBuyer.id,
        details: `Buyer ordered ${quantity}kg of ${selectedListing.cropEn}`
    });
    
    saveData();
    
    // Close checkout modal
    document.getElementById('checkoutModal').classList.remove('show');
    
    // Show delivery agent info and buyer code
    showDeliveryAgentInfo(assignedAgent, buyerCode, newOrder);
    
    selectedListing = null;
    
    showToast('✅ Order placed successfully! Waiting for delivery.');
    
    // Refresh products
    setTimeout(() => {
        displayProducts();
    }, 1000);
}

// Show delivery agent info
function showDeliveryAgentInfo(agent, buyerCode, order) {
    const modal = document.getElementById('deliveryAgentModal');
    const infoDiv = document.getElementById('deliveryAgentInfo');
    
    infoDiv.innerHTML = `
        <h2>✅ Order Confirmed!</h2>
        <div class="delivery-agent-card">
            <h3>Your Delivery Agent</h3>
            <div class="agent-photo-container">
                <img src="${agent.photo}" alt="${agent.name}" class="agent-photo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27150%27 height=%27150%27%3E%3Crect fill=%27%23ddd%27 width=%27150%27 height=%27150%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2714%27 dy=%2710.5%27 font-weight=%27bold%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27%3E${agent.name}%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="agent-details">
                <div class="agent-detail-item">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${agent.name}</span>
                </div>
                <div class="agent-detail-item">
                    <span class="detail-label">Car ID:</span>
                    <span class="detail-value">${agent.carId}</span>
                </div>
            </div>
        </div>
        <div class="buyer-code-section">
            <h3>📱 Your Delivery Verification Code</h3>
            <div class="code-display">${buyerCode}</div>
            <p class="code-instruction">⚠️ Please provide this code to the delivery agent upon arrival</p>
        </div>
        <button class="btn-close-modal" onclick="closeDeliveryAgentModal()">Got it!</button>
    `;
    
    modal.classList.add('show');
}

// Close delivery agent modal
function closeDeliveryAgentModal() {
    document.getElementById('deliveryAgentModal').classList.remove('show');
    
    // Check if there are delivered orders that need rating
    checkForRatingPrompt();
}

// Check for delivered orders and prompt rating
function checkForRatingPrompt() {
    loadData();
    
    // Find delivered orders for this buyer that haven't been rated
    const deliveredOrders = agrilinkData.orders.filter(order => 
        order.buyerId === currentBuyer.id && 
        order.status === 'Delivered' &&
        !order.rated
    );
    
    if (deliveredOrders.length > 0) {
        // Show rating prompt for the most recent delivered order
        const orderToRate = deliveredOrders[0];
        showRatingPrompt(orderToRate);
    }
}

// Show rating prompt
function showRatingPrompt(order) {
    const modal = document.getElementById('ratingModal');
    const formDiv = document.getElementById('ratingForm');
    const farmer = agrilinkData.farmers.find(f => f.id === order.farmerId);
    
    if (!farmer) return;
    
    formDiv.innerHTML = `
        <h2>Rate Your Experience</h2>
        <div class="rating-prompt-info">
            <p>How was your experience with <strong>${order.farmerName}</strong>?</p>
            <p class="product-info">Product: ${order.cropEn} (${order.crop})</p>
        </div>
        <div class="star-rating-input">
            <input type="radio" id="star5" name="rating" value="5">
            <label for="star5" class="star-label">⭐</label>
            <input type="radio" id="star4" name="rating" value="4">
            <label for="star4" class="star-label">⭐</label>
            <input type="radio" id="star3" name="rating" value="3">
            <label for="star3" class="star-label">⭐</label>
            <input type="radio" id="star2" name="rating" value="2">
            <label for="star2" class="star-label">⭐</label>
            <input type="radio" id="star1" name="rating" value="1">
            <label for="star1" class="star-label">⭐</label>
        </div>
        <div id="ratingError" class="error-message"></div>
        <div class="rating-actions">
            <button class="btn-skip" onclick="skipRating('${order.id}')">Skip</button>
            <button class="btn-submit-rating" onclick="submitRating('${order.id}')">Submit Rating</button>
        </div>
    `;
    
    modal.classList.add('show');
    
    // Add hover effect for stars
    document.querySelectorAll('.star-label').forEach((label, index) => {
        label.addEventListener('mouseenter', function() {
            highlightStars(5 - index);
        });
    });
    
    document.querySelector('.star-rating-input').addEventListener('mouseleave', function() {
        const selected = document.querySelector('input[name="rating"]:checked');
        if (selected) {
            highlightStars(parseInt(selected.value));
        } else {
            highlightStars(0);
        }
    });
}

// Highlight stars on hover
function highlightStars(count) {
    document.querySelectorAll('.star-label').forEach((label, index) => {
        if (index < count) {
            label.style.opacity = '1';
            label.style.transform = 'scale(1.2)';
        } else {
            label.style.opacity = '0.3';
            label.style.transform = 'scale(1)';
        }
    });
}

// Submit rating
function submitRating(orderId) {
    const selectedRating = document.querySelector('input[name="rating"]:checked');
    const errorDiv = document.getElementById('ratingError');
    
    if (!selectedRating) {
        errorDiv.textContent = 'Please select a rating';
        return;
    }
    
    const rating = parseInt(selectedRating.value);
    loadData();
    
    const order = agrilinkData.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const farmer = agrilinkData.farmers.find(f => f.id === order.farmerId);
    if (!farmer) return;
    
    // Update farmer rating
    const currentTotal = farmer.rating * farmer.numRatings;
    farmer.numRatings += 1;
    farmer.rating = (currentTotal + rating) / farmer.numRatings;
    
    // Mark order as rated
    order.rated = true;
    
    // Update successful deliveries count
    farmer.successfulDeliveries = (farmer.successfulDeliveries || 0) + 1;
    
    // Add to audit log
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Farmer Rated',
        userId: currentBuyer.id,
        details: `Buyer rated farmer ${farmer.name} with ${rating} stars`
    });
    
    saveData();
    
    // Close modal
    document.getElementById('ratingModal').classList.remove('show');
    
    showToast(`✅ Thank you! Your ${rating}-star rating has been recorded.`);
    
    // Refresh products to show updated rating
    setTimeout(() => {
        displayProducts();
    }, 500);
    
    // Check for more orders to rate
    setTimeout(() => {
        checkForRatingPrompt();
    }, 1000);
}

// Skip rating
function skipRating(orderId) {
    loadData();
    const order = agrilinkData.orders.find(o => o.id === orderId);
    if (order) {
        order.rated = true; // Mark as rated to not prompt again
        saveData();
    }
    
    document.getElementById('ratingModal').classList.remove('show');
    
    // Check for more orders to rate
    setTimeout(() => {
        checkForRatingPrompt();
    }, 500);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') {
        toast.style.background = '#dc3545';
    } else {
        toast.style.background = '#28a745';
    }
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modals
document.addEventListener('DOMContentLoaded', function() {
    // Close modal on X click
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('show');
            
            // If closing delivery agent modal, check for rating prompt
            if (modal.id === 'deliveryAgentModal') {
                checkForRatingPrompt();
            }
        });
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                
                // If closing delivery agent modal, check for rating prompt
                if (this.id === 'deliveryAgentModal') {
                    checkForRatingPrompt();
                }
            }
        });
    });
    
    // Enter key support for passcode input
    const passcodeInput = document.getElementById('passcodeInput');
    if (passcodeInput) {
        passcodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyPasscodeAndPurchase();
            }
        });
    }
    
    // Enter key support for refund passcode input
    const refundPasscodeInput = document.getElementById('refundPasscode');
    if (refundPasscodeInput) {
        refundPasscodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitRefundRequest();
            }
        });
    }
    
    // Filter event listeners
    document.getElementById('searchInput').addEventListener('input', displayProducts);
    document.getElementById('cropFilter').addEventListener('change', displayProducts);
    document.getElementById('priceFilter').addEventListener('change', displayProducts);
    
    // Initialize buyer first
    initializeBuyer();
    
    // Update header with buyer name if available
    if (currentBuyer && currentBuyer.name) {
        const header = document.querySelector('.header .container');
        if (header) {
            const buyerInfo = document.createElement('div');
            buyerInfo.className = 'buyer-info';
            buyerInfo.innerHTML = `
                <span>Welcome, ${currentBuyer.name}</span>
                <button onclick="showMyOrders()" class="orders-btn">My Orders</button>
                <button onclick="logout()" class="logout-btn">Logout</button>
            `;
            header.appendChild(buyerInfo);
        }
    }
    
    // Initial display
    displayProducts();
    displayMyOrders();
    
    // Check for rating prompts on load
    setTimeout(() => {
        checkForRatingPrompt();
    }, 1000);
    
    // Auto-refresh every 2 seconds
    setInterval(() => {
        displayProducts();
        displayMyOrders(); // Refresh orders to show refund status updates
        // Check for new delivered orders that need rating
        checkForRatingPrompt();
    }, 2000);
});

// Show my orders
function showMyOrders() {
    const ordersSection = document.getElementById('ordersSection');
    if (ordersSection) {
        ordersSection.style.display = ordersSection.style.display === 'none' ? 'block' : 'none';
        if (ordersSection.style.display === 'block') {
            displayMyOrders();
        }
    }
}

// Display my orders
function displayMyOrders() {
    if (!currentBuyer) {
        console.log('No current buyer found');
        return;
    }
    
    loadData();
    const ordersList = document.getElementById('ordersList');
    const ordersSection = document.getElementById('ordersSection');
    
    if (!ordersList || !ordersSection) {
        console.log('Orders list or section not found');
        return;
    }
    
    // Get orders for current buyer
    const myOrders = agrilinkData.orders.filter(o => o.buyerId === currentBuyer.id);
    
    if (myOrders.length === 0) {
        ordersList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">You have no orders yet.</div>';
        ordersSection.style.display = 'block';
        return;
    }
    
    ordersSection.style.display = 'block';
    
    ordersList.innerHTML = myOrders.map(order => {
        const delivery = agrilinkData.deliveries.find(d => d.orderId === order.id);
        const productName = order.cropEn || order.crop || 'Product';
        const status = order.status || 'Pending';
        // Check if order is delivered - check both order status and delivery status
        const isDelivered = (status === 'Delivered' || status === 'delivered') || 
                           (delivery && (delivery.status === 'Delivered' || delivery.status === 'delivered'));
        const refundStatus = order.refundStatus || '';
        // Check if refund can be requested: order is delivered, no refund requested yet, and status is not approved/rejected
        const canRequestRefund = isDelivered && 
            (!order.refundRequested || order.refundRequested === false) && 
            (!order.refundProcessed || order.refundProcessed === false) && 
            refundStatus !== 'approved' && 
            refundStatus !== 'rejected';
        const refundRequested = order.refundRequested && (refundStatus === 'pending' || refundStatus === '');
        const refundApproved = refundStatus === 'approved';
        const refundRejected = refundStatus === 'rejected';
        const refundProcessed = order.refundProcessed || refundApproved;
        
        // Calculate time since delivery
        let timeSinceDelivery = '';
        if (isDelivered && order.deliveryTimestamp) {
            const now = Date.now();
            const deliveryTime = order.deliveryTimestamp;
            const hoursSinceDelivery = (now - deliveryTime) / (1000 * 60 * 60);
            
            if (hoursSinceDelivery < 24) {
                const remainingHours = Math.floor(24 - hoursSinceDelivery);
                const remainingMinutes = Math.floor((24 - hoursSinceDelivery) * 60) % 60;
                timeSinceDelivery = `<span class="refund-window">Refund available for ${remainingHours}h ${remainingMinutes}m</span>`;
            } else {
                timeSinceDelivery = '<span class="refund-expired">Refund period expired</span>';
            }
        }
        
        return `
            <div class="order-card ${refundProcessed ? 'refunded' : ''}">
                <div class="order-header">
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-status status-${status.toLowerCase().replace(' ', '-')}">${status}</div>
                </div>
                <div class="order-details">
                    <div class="order-detail-item">
                        <span class="detail-label">Product:</span>
                        <span class="detail-value">${productName}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value">${order.quantity} ${order.unit || 'kg'}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="detail-label">Total Price:</span>
                        <span class="detail-value">${order.totalPrice} ETB</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="detail-label">Farmer:</span>
                        <span class="detail-value">${order.farmerName}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="detail-label">Date Ordered:</span>
                        <span class="detail-value">${order.dateOrdered}</span>
                    </div>
                    ${!isDelivered && order.expectedDeliveryTime ? `
                    <div class="order-detail-item expected-delivery">
                        <span class="detail-label">Expected Delivery:</span>
                        <span class="detail-value expected-delivery-time">${order.expectedDeliveryTime}</span>
                    </div>
                    ` : ''}
                    ${isDelivered && order.deliveryTimestamp ? `
                    <div class="order-detail-item">
                        <span class="detail-label">Delivered:</span>
                        <span class="detail-value">${delivery ? delivery.dateDelivered : 'N/A'}</span>
                    </div>
                    ` : ''}
                    ${refundRequested ? `
                    <div class="order-detail-item">
                        <span class="detail-label">Refund Status:</span>
                        <span class="detail-value refund-status refund-pending">⏳ Pending</span>
                    </div>
                    ${order.refundReason ? `
                    <div class="order-detail-item">
                        <span class="detail-label">Refund Reason:</span>
                        <span class="detail-value">${order.refundReason}</span>
                    </div>
                    ` : ''}
                    ` : ''}
                    ${refundApproved ? `
                    <div class="order-detail-item">
                        <span class="detail-label">Refund Status:</span>
                        <span class="detail-value refund-status refund-approved">✅ Approved</span>
                    </div>
                    ` : ''}
                    ${refundRejected ? `
                    <div class="order-detail-item">
                        <span class="detail-label">Refund Status:</span>
                        <span class="detail-value refund-status refund-rejected">❌ Rejected</span>
                    </div>
                    ${order.refundRejectionNote ? `
                    <div class="order-detail-item">
                        <span class="detail-label">Rejection Note:</span>
                        <span class="detail-value">${order.refundRejectionNote}</span>
                    </div>
                    ` : ''}
                    ` : ''}
                </div>
                ${timeSinceDelivery ? `<div class="refund-info">${timeSinceDelivery}</div>` : ''}
                <div class="order-actions">
                    ${canRequestRefund ? `
                        <button class="btn-refund" onclick="requestRefund('${order.id}')" style="display: block; width: 100%; margin-top: 10px;">💰 Request Refund</button>
                    ` : ''}
                    ${refundRequested ? `
                        <button class="btn-refund-requested" disabled style="display: block; width: 100%; margin-top: 10px;">⏳ Refund Pending</button>
                    ` : ''}
                    ${refundApproved ? `
                        <span class="refund-badge refund-approved-badge" style="display: inline-block; margin-top: 10px;">✅ Refunded</span>
                    ` : ''}
                    ${refundRejected ? `
                        <span class="refund-badge refund-rejected-badge" style="display: inline-block; margin-top: 10px;">❌ Refund Rejected</span>
                    ` : ''}
                    ${!isDelivered && !canRequestRefund && !refundRequested && !refundApproved && !refundRejected ? `
                        <div style="margin-top: 10px; padding: 8px; background: #f0f0f0; border-radius: 5px; font-size: 0.9em; color: #666;">
                            ⏳ Waiting for delivery to request refund
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Request refund - opens modal
function requestRefund(orderId) {
    if (!currentBuyer) {
        showToast('Please log in to request a refund', 'error');
        return;
    }
    
    loadData();
    const order = agrilinkData.orders.find(o => o.id === orderId);
    
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }
    
    // Check delivery status
    if (order.status !== 'Delivered') {
        showToast('Cannot request refund before delivery', 'error');
        return;
    }
    
    // Check 24-hour window
    if (!order.deliveryTimestamp) {
        showToast('Delivery timestamp not found', 'error');
        return;
    }
    
    const now = Date.now();
    const deliveryTime = order.deliveryTimestamp;
    const hoursSinceDelivery = (now - deliveryTime) / (1000 * 60 * 60);
    
    if (hoursSinceDelivery > 24) {
        showToast('Refund period has expired. Refunds can only be requested within 24 hours of delivery.', 'error');
        displayMyOrders(); // Refresh to update UI
        return;
    }
    
    // Check if refund already requested
    if (order.refundRequested && order.refundStatus !== 'rejected') {
        showToast('Refund already requested for this order', 'error');
        return;
    }
    
    // Store current order ID for refund submission
    window.currentRefundOrderId = orderId;
    
    // Show refund modal
    showRefundModal(order);
}

// Show refund request modal
function showRefundModal(order) {
    const modal = document.getElementById('refundModal');
    const orderIdInput = document.getElementById('refundOrderId');
    const reasonTextarea = document.getElementById('refundReason');
    const passcodeInput = document.getElementById('refundPasscode');
    const errorDiv = document.getElementById('refundError');
    
    // Clear previous values
    orderIdInput.value = order.id;
    reasonTextarea.value = '';
    passcodeInput.value = '';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    // Show modal
    modal.classList.add('show');
    passcodeInput.focus();
}

// Close refund modal
function closeRefundModal() {
    const modal = document.getElementById('refundModal');
    modal.classList.remove('show');
    window.currentRefundOrderId = null;
}

// Toggle refund passcode visibility
function toggleRefundPasscodeVisibility() {
    const input = document.getElementById('refundPasscode');
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Submit refund request
function submitRefundRequest() {
    if (!window.currentRefundOrderId) {
        showToast('No order selected for refund', 'error');
        return;
    }
    
    const orderId = window.currentRefundOrderId;
    const reasonTextarea = document.getElementById('refundReason');
    const passcodeInput = document.getElementById('refundPasscode');
    const errorDiv = document.getElementById('refundError');
    
    const reason = reasonTextarea.value.trim();
    const enteredPasscode = passcodeInput.value.trim();
    
    // Validate passcode
    if (!enteredPasscode) {
        errorDiv.textContent = 'Please enter your account passcode';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!/^\d{4,6}$/.test(enteredPasscode)) {
        errorDiv.textContent = 'Passcode must be 4-6 digits';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Load data and verify passcode
    loadData();
    const order = agrilinkData.orders.find(o => o.id === orderId);
    const buyer = agrilinkData.buyers.find(b => b.id === currentBuyer.id);
    
    if (!order || !buyer) {
        errorDiv.textContent = 'Order or buyer not found';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Verify passcode
    if (buyer.accountPasscode !== enteredPasscode) {
        errorDiv.textContent = 'Incorrect passcode. Please try again.';
        errorDiv.style.display = 'block';
        passcodeInput.value = '';
        passcodeInput.focus();
        return;
    }
    
    // Check delivery status again
    if (order.status !== 'Delivered') {
        errorDiv.textContent = 'Cannot request refund before delivery';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Check 24-hour window
    if (order.deliveryTimestamp) {
        const now = Date.now();
        const deliveryTime = order.deliveryTimestamp;
        const hoursSinceDelivery = (now - deliveryTime) / (1000 * 60 * 60);
        
        if (hoursSinceDelivery > 24) {
            errorDiv.textContent = 'Refund period has expired (24 hours)';
            errorDiv.style.display = 'block';
            return;
        }
    }
    
    // Update order with refund request
    order.refundRequested = true;
    order.refundStatus = 'pending';
    order.refundReason = reason || 'No reason provided';
    order.refundTimestamp = new Date().toISOString();
    
    // Initialize buyer balance if not exists
    if (typeof buyer.balance === 'undefined') {
        buyer.balance = 0;
    }
    
    // Add to audit log
    if (!agrilinkData.auditLog) {
        agrilinkData.auditLog = [];
    }
    
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Refund Requested',
        userId: currentBuyer.id,
        details: `Buyer requested refund for order ${orderId} (${order.totalPrice} ETB). Reason: ${order.refundReason}`
    });
    
    saveData();
    
    // Close modal
    closeRefundModal();
    
    // Show success message
    showToast('✅ Refund request submitted successfully. Admin will review your request.', 'success');
    
    // Refresh orders display
    setTimeout(() => {
        displayMyOrders();
    }, 500);
    
    // Auto-approve if within 24 hours and passcode correct (for demo)
    if (order.deliveryTimestamp) {
        const now = Date.now();
        const deliveryTime = order.deliveryTimestamp;
        const hoursSinceDelivery = (now - deliveryTime) / (1000 * 60 * 60);
        
        if (hoursSinceDelivery <= 24 && order.codesVerified) {
            // Auto-approve after 2 seconds (for demo)
            setTimeout(() => {
                autoApproveRefund(orderId);
            }, 2000);
        }
    }
}

// Auto-approve refund (for demo purposes)
function autoApproveRefund(orderId) {
    loadData();
    const order = agrilinkData.orders.find(o => o.id === orderId);
    
    if (!order || order.refundStatus !== 'pending') return;
    
    // Approve refund
    order.refundStatus = 'approved';
    order.refundProcessed = true;
    
    // Update buyer balance
    const buyer = agrilinkData.buyers.find(b => b.id === order.buyerId);
    if (buyer) {
        if (typeof buyer.balance === 'undefined') {
            buyer.balance = 0;
        }
        buyer.balance += order.totalPrice;
    }
    
    // Reverse payment
    const payment = agrilinkData.payments.find(p => p.orderId === orderId);
    if (payment && payment.status === 'Released') {
        payment.status = 'Refunded';
        
        // Deduct from farmer balance
        const farmer = agrilinkData.farmers.find(f => f.id === payment.farmerId);
        if (farmer) {
            farmer.balance = Math.max(0, farmer.balance - payment.amount);
            farmer.totalEarned = Math.max(0, farmer.totalEarned - payment.amount);
        }
    }
    
    // Add to audit log
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Refund Approved (Auto)',
        userId: 'SYSTEM',
        details: `Refund auto-approved for order ${orderId} (${order.totalPrice} ETB). Money returned to buyer.`
    });
    
    saveData();
    
    // Refresh display
    displayMyOrders();
    showToast('✅ Refund approved automatically! Money has been returned to your account.', 'success');
}

// Process refund automatically
function processRefund(orderId) {
    loadData();
    const order = agrilinkData.orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    if (order.refundRequested && order.status === 'Delivered' && order.codesVerified && !order.refundProcessed) {
        // Process the refund
        order.refundProcessed = true;
        order.paymentReleased = false; // Money is returned to buyer (escrow reversed)
        
        // Find and reverse payment
        const payment = agrilinkData.payments.find(p => p.orderId === orderId);
        if (payment && payment.status === 'Released') {
            payment.status = 'Refunded';
            
            // Deduct from farmer balance
            const farmer = agrilinkData.farmers.find(f => f.id === payment.farmerId);
            if (farmer) {
                farmer.balance = Math.max(0, farmer.balance - payment.amount);
                farmer.totalEarned = Math.max(0, farmer.totalEarned - payment.amount);
            }
        }
        
        // Add to audit log
        agrilinkData.auditLog.push({
            id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
            timestamp: new Date().toISOString(),
            action: 'Refund Processed',
            userId: 'SYSTEM',
            details: `Refund processed for order ${orderId} (${order.totalPrice} ETB). Money returned to buyer.`
        });
        
        saveData();
        
        showToast('✅ Refund processed successfully! Money returned to your account.', 'success');
        
        // Refresh orders display
        displayMyOrders();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('agrilinkBuyerId');
    localStorage.removeItem('agrilinkBuyerName');
    localStorage.removeItem('agrilinkBuyerEmail');
    sessionStorage.removeItem('agrilinkBuyerId');
    sessionStorage.removeItem('agrilinkBuyerName');
    sessionStorage.removeItem('agrilinkBuyerEmail');
    window.location.href = 'signup.html';
}

