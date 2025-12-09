// ============================================
// DATA STORAGE (File-based using localStorage)
// ============================================

// Initialize storage if not exists
function initStorage() {
    if (!localStorage.getItem('agrilink_users')) {
        localStorage.setItem('agrilink_users', JSON.stringify([]));
    }
    if (!localStorage.getItem('agrilink_products')) {
        // Initialize with empty array - demo products are handled separately in buyer dashboard
        localStorage.setItem('agrilink_products', JSON.stringify([]));
    }
    if (!localStorage.getItem('agrilink_orders')) {
        localStorage.setItem('agrilink_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('agrilink_cart')) {
        localStorage.setItem('agrilink_cart', JSON.stringify([]));
    }
}

// Get data from storage
function getUsers() {
    return JSON.parse(localStorage.getItem('agrilink_users') || '[]');
}

function getProducts() {
    return JSON.parse(localStorage.getItem('agrilink_products') || '[]');
}

function getOrders() {
    return JSON.parse(localStorage.getItem('agrilink_orders') || '[]');
}

function getCart() {
    return JSON.parse(localStorage.getItem('agrilink_cart') || '[]');
}

// Save data to storage
function saveUsers(users) {
    localStorage.setItem('agrilink_users', JSON.stringify(users));
}

function saveProducts(products) {
    localStorage.setItem('agrilink_products', JSON.stringify(products));
}

function saveOrders(orders) {
    localStorage.setItem('agrilink_orders', JSON.stringify(orders));
}

function saveCart(cart) {
    localStorage.setItem('agrilink_cart', JSON.stringify(cart));
}

// Get current user
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('current_user') || 'null');
}

function setCurrentUser(user) {
    sessionStorage.setItem('current_user', JSON.stringify(user));
}

// ============================================
// LOGIN FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initStorage();
    
    // Signup page handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Check if we're on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if we're on farmer dashboard
    if (document.querySelector('.farmer-dashboard')) {
        loadFarmerDashboard();
    }
    
    // Check if we're on buyer dashboard
    if (document.querySelector('.buyer-dashboard')) {
        loadBuyerDashboard();
    }
});

function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const users = getUsers();

    // Determine role field presence
    const role = formData.get('role');

    if (role === 'farmer') {
        // Farmers login with Farmer ID
        const farmerId = formData.get('farmerId') || formData.get('farmerID') || '';
        const found = users.find(u => u.farmerId && u.farmerId.toLowerCase() === farmerId.trim().toLowerCase());
        if (found) {
            setCurrentUser(found);
            window.location.href = 'farmer-dashboard.html';
            return;
        } else {
            alert('Farmer ID not found. Please sign up first.');
            window.location.href = 'index.html';
            return;
        }
    }

    // Buyers login with phone (or email)
    const phone = formData.get('phone') || formData.get('email');
    if (phone) {
        const found = users.find(u => (u.phone === phone || u.email === phone) && u.role === 'buyer');
        if (found) {
            setCurrentUser(found);
            window.location.href = 'buyer-dashboard.html';
            return;
        }
    }

    alert('No matching account found. Please sign up first.');
    window.location.href = 'index.html';
}

// Generate a unique Farmer ID: FARM + 4-digit number (ensures uniqueness)
function generateFarmerId() {
    const users = getUsers();
    let id;
    do {
        const num = Math.floor(1000 + Math.random() * 9000);
        id = 'FARM' + num;
    } while (users.find(u => u.farmerId === id));
    return id;
}

// Show modal notification with Farmer ID
function showFarmerIdModal(farmerId, contact) {
    const modal = document.getElementById('farmerIdModal');
    const title = document.getElementById('modalTitle');
    const message = document.getElementById('modalMessage');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (!modal || !message) return;

    title.textContent = 'Farmer ID Sent';
    message.innerHTML = `Your Farmer ID <strong>${farmerId}</strong> has been generated and sent to ${contact || 'your phone/email'}. Use this ID to log in next time.`;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    function close() {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        closeBtn.removeEventListener('click', close);
    }
    closeBtn.addEventListener('click', close);
}

// Handle signup: create user and generate Farmer ID for farmers
function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const location = formData.get('location');
    const phone = formData.get('phone');
    const role = formData.get('role');

    if (!name || !location || !phone || !role) {
        alert('Please complete all required fields.');
        return;
    }

    const users = getUsers();
    // Prevent duplicate phone for same role
    const exists = users.find(u => u.phone === phone && u.role === role);
    if (exists) {
        alert('An account with this phone and role already exists. Please login.');
        window.location.href = 'login.html';
        return;
    }

    const user = {
        id: Date.now().toString(),
        name: name,
        location: location,
        phone: phone,
        role: role
    };

    if (role === 'farmer') {
        const farmerId = generateFarmerId();
        user.farmerId = farmerId;
    }

    users.push(user);
    saveUsers(users);

    if (role === 'farmer') {
        // Show realistic notification/modal
        showFarmerIdModal(user.farmerId, phone);
    } else {
        // Buyer: simple onscreen confirmation
        alert('Account created. You can now log in.');
        window.location.href = 'login.html';
    }
}

// ============================================
// FARMER DASHBOARD
// ============================================

function loadFarmerDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'farmer') {
        window.location.href = 'index.html';
        return;
    }
    
    // Display welcome message
    const welcomeBadge = document.querySelector('.welcome-badge');
    if (welcomeBadge) {
        welcomeBadge.textContent = `Welcome, ${currentUser.name}!`;
    }
    // Show average rating for this farmer (read-only)
    const farmerRatingEl = document.getElementById('farmerRating');
    if (farmerRatingEl) {
        const fid = currentUser.farmerId || currentUser.id;
        const avg = getAverageRating(fid);
        const rounded = Math.round(avg);
        // build stars
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rounded ? '★' : '☆';
        }
        if (avg === 0) {
            farmerRatingEl.innerHTML = '';
        } else {
            farmerRatingEl.innerHTML = `<span class="avg-stars">${stars}</span><span class="avg-value"> ${avg.toFixed(1)}/5</span>`;
            farmerRatingEl.setAttribute('title', `${avg.toFixed(1)} out of 5`);
        }
    }
    
    // Load market prices
    // Default range (5km)
    const rangeSelect = document.getElementById('rangeSelect');
    const defaultRange = (rangeSelect && rangeSelect.value) ? Number(rangeSelect.value) : 5;
    // store last used range for display functions
    displayMarketPrices._lastRange = defaultRange;
    displayMostDemandProducts._lastRange = defaultRange;
    displayMarketPrices(currentUser.location);
    displayMostDemandProducts();

    // Update when range changes
    if (rangeSelect) {
        rangeSelect.addEventListener('change', function(e) {
            const r = Number(e.target.value) || 5;
            displayMarketPrices._lastRange = r;
            displayMostDemandProducts._lastRange = r;
            // animate and recalc
            displayMarketPrices(currentUser.location);
            displayMostDemandProducts();
        });
    }
    
    // Load farmer's products
    displayFarmerProducts();
    
    // Load orders
    displayFarmerOrders();
    
    // Setup add product form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    // Setup search
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchProducts);
    }
    
    // Setup sort
    const sortSelect = document.getElementById('sortProducts');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortProducts);
    }
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file.', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB.', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageDataUrl = e.target.result;
        
        // Show preview
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        if (preview && previewImg) {
            previewImg.src = imageDataUrl;
            preview.style.display = 'block';
        }
        
        // Store uploaded image data in a hidden field or variable
        window.uploadedImageData = imageDataUrl;
        
        // Clear select dropdown
        const select = document.getElementById('productImage');
        if (select) {
            select.value = '';
        }
    };
    reader.readAsDataURL(file);
}

// Handle image select from library
function handleImageSelect(event) {
    if (event.target.value) {
        // Clear uploaded image
        window.uploadedImageData = null;
        const fileInput = document.getElementById('productImageUpload');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Hide preview
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.style.display = 'none';
        }
    }
}

// Remove image preview
function removeImagePreview() {
    const preview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('productImageUpload');
    const select = document.getElementById('productImage');
    
    if (preview) {
        preview.style.display = 'none';
    }
    if (fileInput) {
        fileInput.value = '';
    }
    if (select) {
        select.value = '';
    }
    
    window.uploadedImageData = null;
}

function handleAddProduct(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    const formData = new FormData(e.target);
    
    // Get image - prioritize uploaded image over selected image
    let productImage = window.uploadedImageData || formData.get('productImage');
    
    if (!productImage) {
        showNotification('Please select or upload a product image.', 'error');
        return;
    }
    
    const product = {
        id: Date.now().toString(),
        farmerName: currentUser.name,
        farmerId: currentUser.id,
        productName: formData.get('productName'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        image: productImage
    };
    
    const products = getProducts();
    products.push(product);
    saveProducts(products);
    
    // Reset form
    e.target.reset();
    window.uploadedImageData = null;
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.style.display = 'none';
    }
    
    // Refresh display
    displayFarmerProducts();
    
    // Show success message
    showNotification('Product added successfully!', 'success');
}

function displayFarmerProducts() {
    const currentUser = getCurrentUser();
    const products = getProducts().filter(p => p.farmerId === currentUser.id);
    const container = document.getElementById('inventoryList');
    
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">No products in inventory. Add your first product!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="inventory-item">
            <div class="inventory-image">${getProductImageHtml(product.image, product.productName)}</div>
            <div class="inventory-details">
                <div class="inventory-name">${product.productName}</div>
                <div class="inventory-meta">Quantity: ${product.quantity} kg | Price: ETB ${product.price}/kg</div>
            </div>
            <div class="product-price">ETB ${product.price}</div>
            <div class="product-actions">
                <button class="btn btn-small btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-small btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function displayFarmerOrders() {
    const currentUser = getCurrentUser();
    const orders = getOrders().filter(o => o.farmerId === currentUser.id);
    const container = document.getElementById('ordersList');
    
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">No orders received yet.</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <div class="order-buyer">${order.buyerName}</div>
                <div class="order-status status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</div>
            </div>
            <div class="order-details">
                Product: ${order.productName} | Quantity: ${order.quantity} kg | Total: ETB ${order.total}
            </div>
        </div>
    `).join('');
}

// Get market prices based on location
function getMarketPrices(location) {
    // Demo market price data - in a real app, this would be fetched from an API
    // Prices can vary by location
    const basePrices = {
        'Addis Ababa': [
            { product: "Tomato", avgPrice: 35, image: "tomato.jpg" },
            { product: "Potato", avgPrice: 28, image: "potato.jpg" },
            { product: "Carrot", avgPrice: 30, image: "carrot.jpg" },
            { product: "Apple", avgPrice: 45, image: "apple.jpg" },
            { product: "Onion", avgPrice: 32, image: "onion.jpg" }
        ],
        'Dire Dawa': [
            { product: "Tomato", avgPrice: 33, image: "tomato.jpg" },
            { product: "Potato", avgPrice: 26, image: "potato.jpg" },
            { product: "Carrot", avgPrice: 28, image: "carrot.jpg" },
            { product: "Apple", avgPrice: 42, image: "apple.jpg" },
            { product: "Onion", avgPrice: 30, image: "onion.jpg" }
        ],
        'Hawassa': [
            { product: "Tomato", avgPrice: 32, image: "tomato.jpg" },
            { product: "Potato", avgPrice: 25, image: "potato.jpg" },
            { product: "Carrot", avgPrice: 29, image: "carrot.jpg" },
            { product: "Apple", avgPrice: 40, image: "apple.jpg" },
            { product: "Onion", avgPrice: 31, image: "onion.jpg" }
        ]
    };
    
    // Normalize location for matching (case-insensitive, partial match)
    const normalizedLocation = location ? location.toLowerCase() : '';
    let selectedPrices = basePrices['Addis Ababa']; // Default
    
    // Try to match location
    for (const [city, prices] of Object.entries(basePrices)) {
        if (normalizedLocation.includes(city.toLowerCase()) || city.toLowerCase().includes(normalizedLocation)) {
            selectedPrices = prices;
            break;
        }
    }
    
    return selectedPrices;
}

function displayMarketPrices(location) {
    // default no range -> behave as 5km
    const range = displayMarketPrices._lastRange || 5;
    const marketPrices = applyRangeToPrices(getMarketPrices(location), range);
    const container = document.getElementById('marketPricesContainer');
    
    if (!container) return;
    
    const locationDisplay = location || 'Your Area';
    
    const html = `
        <div class="market-prices-header">
            <span class="location-badge">📍 ${locationDisplay}</span>
        </div>
        <div class="market-prices-grid">
            ${marketPrices.map(item => `
                <div class="market-price-card">
                    <div class="market-price-shape">${getProductImageHtml(item.image, item.product)}</div>
                    <div class="market-price-info">
                        <div class="market-price-product">${item.product}</div>
                        <div class="market-price-amount">ETB ${item.avgPrice}/kg</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    updateWithFade(container, html);
}

// Apply range-based variation to base market prices (demo: ±5-10%)
function applyRangeToPrices(prices, rangeKm) {
    if (!prices) return [];
    let delta = 0.05; // default ±5%
    if (Number(rangeKm) >= 15) delta = 0.10;
    else if (Number(rangeKm) >= 10) delta = 0.08;

    // For demo, slightly randomize direction for each product
    return prices.map(item => {
        const sign = Math.random() > 0.5 ? 1 : -1;
        const factor = 1 + sign * (Math.random() * delta);
        // Round to 1 decimal if needed
        const newPrice = Math.max(1, Math.round((item.avgPrice * factor) * 10) / 10);
        return Object.assign({}, item, { avgPrice: newPrice });
    });
}

// Utility: fade out/in update
function updateWithFade(container, html) {
    if (!container) return;
    container.classList.add('fade-out');
    setTimeout(() => {
        container.innerHTML = html;
        container.classList.remove('fade-out');
        container.classList.add('fade-in');
        setTimeout(() => container.classList.remove('fade-in'), 400);
    }, 220);
}

// Get most in-demand products (random selection for demo)
function getMostDemandProducts() {
    // Get all available products from the system
    const allProducts = getProducts();
    
    // Also include demo products for variety
    const demoProducts = getDemoProducts();
    
    // Combine all products
    const combinedProducts = [
        ...allProducts.map(p => ({
            name: p.productName,
            image: p.image
        })),
        ...demoProducts.map(p => ({
            name: p.name,
            image: p.image
        }))
    ];
    
    // Remove duplicates based on product name
    const uniqueProducts = [];
    const seenNames = new Set();
    for (const product of combinedProducts) {
        const name = product.name.toLowerCase();
        if (!seenNames.has(name)) {
            seenNames.add(name);
            uniqueProducts.push(product);
        }
    }
    
    // If we have products, randomly select 3-5 of them
    if (uniqueProducts.length === 0) {
        // Fallback to default products if no products exist
        return [
            { name: 'Tomato', image: 'tomato.jpg' },
            { name: 'Potato', image: 'pottato.jpg' },
            { name: 'Carrot', image: 'carrot.jpg' },
            { name: 'Apple', image: 'apple.jpg' }
        ];
    }
    
    // Shuffle array randomly
    const shuffled = [...uniqueProducts].sort(() => Math.random() - 0.5);
    
    // Select 3-5 random products
    const count = Math.min(Math.max(3, Math.floor(Math.random() * 3) + 3), shuffled.length);
    return shuffled.slice(0, count);
}

function displayMostDemandProducts() {
    const range = displayMostDemandProducts._lastRange || 5;
    const mostDemandProducts = getMostDemandProducts(range);
    const container = document.getElementById('mostDemandContainer');
    
    if (!container) return;
    
    if (mostDemandProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔥</div>
                <div class="empty-state-text">No demand data available.</div>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="most-demand-grid">
            ${mostDemandProducts.map(product => `
                <div class="most-demand-card">
                    <div class="most-demand-image">${getProductImageHtml(product.image, product.name)}</div>
                    <div class="most-demand-name">${product.name}</div>
                </div>
            `).join('')}
        </div>
    `;
    updateWithFade(container, html);
}

// Overload getMostDemandProducts to accept optional range influence
function getMostDemandProducts(rangeKm) {
    // Use original logic but slightly bias/shuffle results based on range
    const base = (function(){
        // original combined product selection
        const allProducts = getProducts();
        const demoProducts = getDemoProducts();
        const combinedProducts = [
            ...allProducts.map(p => ({ name: p.productName, image: p.image })),
            ...demoProducts.map(p => ({ name: p.name, image: p.image }))
        ];
        const uniqueProducts = [];
        const seenNames = new Set();
        for (const product of combinedProducts) {
            const name = (product.name || '').toLowerCase();
            if (!seenNames.has(name) && name) {
                seenNames.add(name);
                uniqueProducts.push(product);
            }
        }
        if (uniqueProducts.length === 0) {
            return [
                { name: 'Tomato', image: 'tomato.jpg' },
                { name: 'Potato', image: 'pottato.jpg' },
                { name: 'Carrot', image: 'carrot.jpg' },
                { name: 'Apple', image: 'apple.jpg' }
            ];
        }
        return uniqueProducts;
    })();

    // Shuffle deterministically influenced by range to create subtle changes
    const seed = Number(rangeKm) || 5;
    const shuffled = [...base].sort(() => (Math.random() - 0.5) + (seed / 100));

    const count = Math.min(Math.max(3, Math.floor(Math.random() * 3) + 3), shuffled.length);
    return shuffled.slice(0, count);
}

function editProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Pre-fill form
    document.getElementById('productName').value = product.productName;
    document.getElementById('quantity').value = product.quantity;
    document.getElementById('price').value = product.price;
    document.getElementById('productImage').value = product.image;
    
    // Remove old product
    deleteProduct(productId);
    
    // Scroll to form
    document.getElementById('addProductForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const products = getProducts();
    const filtered = products.filter(p => p.id !== productId);
    saveProducts(filtered);
    displayFarmerProducts();
    showNotification('Product deleted successfully!', 'success');
}

function handleSearchProducts(e) {
    const searchTerm = e.target.value.toLowerCase();
    const currentUser = getCurrentUser();
    const products = getProducts().filter(p => 
        p.farmerId === currentUser.id && 
        p.productName.toLowerCase().includes(searchTerm)
    );
    
    const container = document.getElementById('inventoryList');
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">No products found matching "${searchTerm}"</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="inventory-item">
            <div class="inventory-image">${getProductImageHtml(product.image, product.productName)}</div>
            <div class="inventory-details">
                <div class="inventory-name">${product.productName}</div>
                <div class="inventory-meta">Quantity: ${product.quantity} kg | Price: ETB ${product.price}/kg</div>
            </div>
            <div class="product-price">ETB ${product.price}</div>
            <div class="product-actions">
                <button class="btn btn-small btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-small btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function handleSortProducts(e) {
    const sortBy = e.target.value;
    const currentUser = getCurrentUser();
    let products = getProducts().filter(p => p.farmerId === currentUser.id);
    
    if (sortBy === 'name') {
        products.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortBy === 'quantity') {
        products.sort((a, b) => b.quantity - a.quantity);
    }
    
    // Temporarily save sorted products and re-display
    const container = document.getElementById('inventoryList');
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">No products in inventory.</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="inventory-item">
            <div class="inventory-image">${getProductImageHtml(product.image, product.productName)}</div>
            <div class="inventory-details">
                <div class="inventory-name">${product.productName}</div>
                <div class="inventory-meta">Quantity: ${product.quantity} kg | Price: ETB ${product.price}/kg</div>
            </div>
            <div class="product-price">ETB ${product.price}</div>
            <div class="product-actions">
                <button class="btn btn-small btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-small btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// BUYER DASHBOARD
// ============================================

function loadBuyerDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'buyer') {
        window.location.href = 'index.html';
        return;
    }
    
    // Display welcome message
    const welcomeBadge = document.querySelector('.welcome-badge');
    if (welcomeBadge) {
        welcomeBadge.textContent = `Welcome, ${currentUser.name}!`;
    }
    
    // Load products
    displayBuyerProducts();
    
    // Load cart
    displayCart();
    
    // Load orders
    displayBuyerOrders();
    
    // Setup filter
    const filterSelect = document.getElementById('filterProducts');
    if (filterSelect) {
        filterSelect.addEventListener('change', handleFilterProducts);
    }
    
    // Setup sort
    const sortSelect = document.getElementById('sortBuyerProducts');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortBuyerProducts);
    }
}

// Get demo products array
function getDemoProducts() {
    const demoProducts = [
        { 
            name: "Tomato", 
            price: 35, 
            shape: "red-circle", 
            quantity: 50,
            image: "tomato.jpg",
            farmerName: "Demo Farm",
            id: "demo-tomato"
        },
        { 
            name: "Potato", 
            price: 28, 
            shape: "brown-oval", 
            quantity: 40,
            image: "potato.jpg",
            farmerName: "Demo Farm",
            id: "demo-potato"
        },
        { 
            name: "Carrot", 
            price: 30, 
            shape: "orange-triangle", 
            quantity: 25,
            image: "carrot.jpg",
            farmerName: "Demo Farm",
            id: "demo-carrot"
        },
        { 
            name: "Apple", 
            price: 45, 
            shape: "red-circle", 
            quantity: 30,
            image: "apple.jpg",
            farmerName: "Demo Farm",
            id: "demo-apple"
        },
        { 
            name: "Onion", 
            price: 32, 
            shape: "purple-circle", 
            quantity: 20,
            image: "onion.jpg",
            farmerName: "Demo Farm",
            id: "demo-onion"
        }
    ];
    return demoProducts;
}

function displayBuyerProducts() {
    // Get demo products
    const demoProducts = getDemoProducts();
    
    // Get real products from storage (filter out demo products that might be in storage)
    const realProducts = getProducts().filter(p => !p.id.startsWith('demo-'));
    
    // Merge arrays for display
    const allProducts = [...demoProducts, ...realProducts];
    
    const container = document.getElementById('productsGrid');
    
    if (!container) return;
    
    if (allProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌾</div>
                <div class="empty-state-text">No products available. Check back later!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allProducts.map(product => {
        const isDemo = product.id && product.id.startsWith('demo-');
        const productName = product.productName || product.name;
        const productImage = product.image || getImageFromShape(product.shape);
        
        return `
        <div class="product-card ${isDemo ? 'demo-product' : ''}">
            ${isDemo ? '<div class="demo-badge">DEMO</div>' : ''}
            <div class="product-image">${getProductImageHtml(productImage, productName)}</div>
            <div class="product-name">${productName}</div>
            <div class="product-info">Farmer: ${product.farmerName}</div>
            <div class="product-info">Available: ${product.quantity} kg</div>
            <div class="product-price">ETB ${product.price}/kg</div>
            <button class="btn btn-add-cart" onclick="addToCart('${product.id}', ${isDemo})">
                Add to Cart
            </button>
        </div>
    `;
    }).join('');
}

// Helper function to map shape to image name
function getImageFromShape(shape) {
    const shapeMap = {
        'red-circle': 'tomato.jpg',
        'brown-oval': 'potato.jpg',
        'orange-triangle': 'carrot.jpg',
        'purple-circle': 'onion.jpg'
    };
    return shapeMap[shape] || 'tomato.jpg';
}

function addToCart(productId, isDemo = false) {
    let product;
    
    if (isDemo) {
        // Handle demo products
        const demoProducts = getDemoProducts();
        product = demoProducts.find(p => p.id === productId);
        if (!product) return;
        
        // Convert demo product to standard format
        product = {
            id: product.id,
            productName: product.name,
            farmerName: product.farmerName,
            price: product.price,
            quantity: product.quantity,
            image: product.image
        };
    } else {
        // Handle real products from storage
        const products = getProducts();
        product = products.find(p => p.id === productId);
        if (!product) return;
    }
    
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.quantity) {
            existingItem.quantity += 1;
        } else {
            showNotification('Not enough quantity available!', 'error');
            return;
        }
    } else {
        cart.push({
            productId: product.id,
            productName: product.productName,
            farmerName: product.farmerName,
            price: product.price,
            quantity: 1,
            image: product.image,
            isDemo: isDemo
        });
    }
    
    saveCart(cart);
    displayCart();
    showNotification('Added to cart!', 'success');
}

function displayCart() {
    const cart = getCart();
    const container = document.getElementById('cartItems');
    const totalContainer = document.getElementById('cartTotal');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <div class="empty-state-text">Your cart is empty. Start shopping!</div>
            </div>
        `;
        if (totalContainer) {
            totalContainer.textContent = 'ETB 0';
        }
        return;
    }
    
    let total = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-image">${getProductImageHtml(item.image, item.productName)}</div>
                <div>
                    <div class="product-name">${item.productName}</div>
                    <div class="product-info">Farmer: ${item.farmerName}</div>
                    <div class="product-info">ETB ${item.price}/kg</div>
                </div>
                <div class="product-info">Qty: ${item.quantity}</div>
                <div class="product-price">ETB ${itemTotal}</div>
            </div>
        `;
    }).join('');
    
    if (totalContainer) {
        totalContainer.textContent = `ETB ${total.toFixed(2)}`;
    }
}

function removeFromCart(productId) {
    const cart = getCart();
    const filtered = cart.filter(item => item.productId !== productId);
    saveCart(filtered);
    displayCart();
    showNotification('Item removed from cart!', 'success');
}

// Show payment modal
function showPaymentModal() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    const modal = document.getElementById('paymentModal');
    if (!modal) return;
    
    // Calculate total
    let total = 0;
    const cartItemsHtml = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="payment-item">
                <div class="payment-item-info">
                    <span class="payment-item-name">${item.productName}</span>
                    <span class="payment-item-details">${item.quantity} kg × ETB ${item.price}</span>
                </div>
                <span class="payment-item-total">ETB ${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('paymentCartItems').innerHTML = cartItemsHtml;
    document.getElementById('paymentTotal').textContent = `ETB ${total.toFixed(2)}`;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Reset button state
    const btn = document.getElementById('simulatePaymentBtn');
    if (btn) {
        btn.disabled = false;
        btn.querySelector('.payment-btn-text').textContent = '💳 Simulate Payment';
        btn.querySelector('.payment-btn-text').style.display = 'inline';
        btn.querySelector('.payment-btn-loading').style.display = 'none';
        btn.classList.remove('btn-success', 'btn-error', 'processing');
    }
    
    // Clear and reset input fields
    const accountNumberInput = document.getElementById('accountNumber');
    const passcodeInput = document.getElementById('passcode');
    if (accountNumberInput) {
        accountNumberInput.value = '';
        accountNumberInput.classList.remove('input-error');
    }
    if (passcodeInput) {
        passcodeInput.value = '';
        passcodeInput.classList.remove('input-error');
    }
    
    // Remove any existing payment messages
    const existingMessage = document.querySelector('.payment-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Close modal when clicking outside
    modal.onclick = function(e) {
        if (e.target === modal) {
            closePaymentModal();
        }
    };
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear input fields
        const accountNumberInput = document.getElementById('accountNumber');
        const passcodeInput = document.getElementById('passcode');
        if (accountNumberInput) {
            accountNumberInput.value = '';
            accountNumberInput.classList.remove('input-error');
        }
        if (passcodeInput) {
            passcodeInput.value = '';
            passcodeInput.classList.remove('input-error');
        }
        
        // Remove any payment messages
        const existingMessage = document.querySelector('.payment-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
}

// Simulate payment process
function simulatePayment() {
    // Get input values
    const accountNumber = document.getElementById('accountNumber').value.trim();
    const passcode = document.getElementById('passcode').value.trim();
    const accountNumberInput = document.getElementById('accountNumber');
    const passcodeInput = document.getElementById('passcode');
    
    // Validate inputs
    if (!accountNumber || !passcode) {
        // Show alert
        showNotification('Please enter your account number and passcode.', 'error');
        
        // Highlight empty fields
        if (!accountNumber) {
            accountNumberInput.classList.add('input-error');
            accountNumberInput.focus();
        }
        if (!passcode) {
            passcodeInput.classList.add('input-error');
            if (accountNumber) {
                passcodeInput.focus();
            }
        }
        
        // Remove error class after a delay
        setTimeout(() => {
            accountNumberInput.classList.remove('input-error');
            passcodeInput.classList.remove('input-error');
        }, 3000);
        
        return;
    }
    
    // Clear any previous error states
    accountNumberInput.classList.remove('input-error');
    passcodeInput.classList.remove('input-error');
    
    const btn = document.getElementById('simulatePaymentBtn');
    const btnText = btn.querySelector('.payment-btn-text');
    const btnLoading = btn.querySelector('.payment-btn-loading');
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btn.classList.add('processing');
    
    // Simulate payment processing (1.5 seconds)
    setTimeout(() => {
        // Randomize success/failure for demo (80% success rate)
        // For demo: if account number is "1234567890123456" and passcode is "1234", always succeed
        let isSuccess;
        if (accountNumber === '1234567890123456' && passcode === '1234') {
            isSuccess = true; // Demo credentials always succeed
        } else {
            isSuccess = Math.random() > 0.2; // 80% success rate for other inputs
        }
        
        if (isSuccess) {
            // Payment successful
            btn.classList.remove('processing');
            btn.classList.add('btn-success');
            btnText.textContent = '✓ Payment Successful!';
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            
            // Show success message
            showPaymentMessage('Payment Successful! Your order has been completed.', 'success');
            
            // Process order after short delay
            setTimeout(() => {
                processOrderAfterPayment();
                closePaymentModal();
            }, 1500);
        } else {
            // Payment failed
            btn.classList.remove('processing');
            btn.classList.add('btn-error');
            btnText.textContent = '✗ Payment Failed';
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            
            // Show error message
            showPaymentMessage('Payment Failed. Check account number or passcode.', 'error');
            
            // Highlight input fields on failure
            accountNumberInput.classList.add('input-error');
            passcodeInput.classList.add('input-error');
            
            // Reset button after delay
            setTimeout(() => {
                btn.disabled = false;
                btn.classList.remove('btn-error');
                btnText.textContent = '💳 Simulate Payment';
                accountNumberInput.classList.remove('input-error');
                passcodeInput.classList.remove('input-error');
            }, 2000);
        }
    }, 1500);
}

// Show payment message
function showPaymentMessage(message, type) {
    const modalBody = document.querySelector('.payment-modal-body');
    if (!modalBody) return;
    
    // Remove existing message if any
    const existingMessage = modalBody.querySelector('.payment-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `payment-message payment-message-${type}`;
    messageDiv.textContent = message;
    modalBody.appendChild(messageDiv);
    
    // Auto-remove after 3 seconds if success
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
}

// Process order after successful payment
function processOrderAfterPayment() {
    const cart = getCart();
    if (cart.length === 0) return;
    
    const currentUser = getCurrentUser();
    const products = getProducts();
    
    // Create orders with "Confirmed" status after payment
    const farmersToPrompt = new Map();
    cart.forEach(item => {
        // Handle demo products
        let product;
        if (item.isDemo) {
            // For demo products, create a mock product entry
            product = {
                id: item.productId,
                farmerId: 'demo-farmer',
                farmerName: 'Demo Farm',
                quantity: item.quantity
            };
        } else {
            product = products.find(p => p.id === item.productId);
        }
        
        if (product) {
            const order = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                buyerId: currentUser.id,
                buyerName: currentUser.name,
                farmerId: product.farmerId || 'demo-farmer',
                farmerName: product.farmerName || item.farmerName || 'Demo Farm',
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
                status: 'Confirmed', // Changed from 'Pending' to 'Confirmed' after payment
                paymentStatus: 'Paid',
                date: new Date().toISOString()
            };
            
            const orders = getOrders();
            orders.push(order);
            saveOrders(orders);
            // track farmer for rating prompt
            if (order.farmerId) {
                farmersToPrompt.set(order.farmerId, order.farmerName);
            }
            
            // Update product quantity (only for real products)
            if (!item.isDemo && product.quantity !== undefined) {
                product.quantity -= item.quantity;
            }
        }
    });
    
    // Clear cart
    saveCart([]);
    if (!cart.some(item => item.isDemo)) {
        saveProducts(products);
    }
    
    displayCart();
    displayBuyerOrders();
    displayBuyerProducts();
    
    showNotification('Order placed successfully! Payment confirmed.', 'success');
    
    // Prompt ratings for unique farmers involved in this order (demo storage)
    const prompts = Array.from(farmersToPrompt.entries()).map(([farmerId, farmerName]) => ({ farmerId, farmerName }));
    if (prompts.length > 0) {
        promptRatingsForFarmers(prompts);
    }
}

// Legacy checkout function (kept for compatibility, but now calls payment modal)
function checkout() {
    showPaymentModal();
}

function displayBuyerOrders() {
    const currentUser = getCurrentUser();
    const orders = getOrders().filter(o => o.buyerId === currentUser.id);
    const container = document.getElementById('buyerOrdersList');
    
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">No orders yet. Place your first order!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <div class="order-buyer">${order.productName} from ${order.farmerName}</div>
                <div class="order-status status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</div>
            </div>
            <div class="order-details">
                Quantity: ${order.quantity} kg | Total: ETB ${order.total}
            </div>
            <div class="order-delivery-info">
                <div class="delivery-text">
                    ${order.productName} from ${order.farmerName} — will be delivered by <strong>Damtaw Demelash</strong> with Car ID: <strong>1234</strong>
                </div>
                <div class="delivery-driver">
                    <img src="delivery driver/photo_2025-12-07_16-52-16.jpg" alt="Delivery Driver - Damtaw Demelash" class="driver-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="driver-photo-fallback" style="display: none;">👨‍✈️</div>
                </div>
            </div>
        </div>
    `).join('');
}

function handleFilterProducts(e) {
    const filter = e.target.value;
    
    // Get demo products and real products
    const demoProducts = getDemoProducts();
    const realProducts = getProducts().filter(p => !p.id.startsWith('demo-'));
    
    // Merge arrays
    let allProducts = [...demoProducts, ...realProducts];
    
    if (filter !== 'all') {
        // Filter based on product name
        allProducts = allProducts.filter(p => {
            const name = (p.productName || p.name).toLowerCase();
            if (filter === 'vegetables') {
                return ['tomato', 'potato', 'carrot', 'onion', 'cabbage'].some(v => name.includes(v));
            } else if (filter === 'fruits') {
                return ['apple', 'banana', 'orange', 'mango'].some(v => name.includes(v));
            } else if (filter === 'grains') {
                return ['wheat', 'rice', 'corn', 'barley'].some(v => name.includes(v));
            }
            return true;
        });
    }
    
    const container = document.getElementById('productsGrid');
    if (allProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌾</div>
                <div class="empty-state-text">No products found in this category.</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allProducts.map(product => {
        const isDemo = product.id && product.id.startsWith('demo-');
        const productName = product.productName || product.name;
        const productImage = product.image || getImageFromShape(product.shape);
        
        return `
        <div class="product-card ${isDemo ? 'demo-product' : ''}">
            ${isDemo ? '<div class="demo-badge">DEMO</div>' : ''}
            <div class="product-image">${getProductImageHtml(productImage, productName)}</div>
            <div class="product-name">${productName}</div>
            <div class="product-info">Farmer: ${product.farmerName}</div>
            <div class="product-info">Available: ${product.quantity} kg</div>
            <div class="product-price">ETB ${product.price}/kg</div>
            <button class="btn btn-add-cart" onclick="addToCart('${product.id}', ${isDemo})">
                Add to Cart
            </button>
        </div>
    `;
    }).join('');
}

function handleSortBuyerProducts(e) {
    const sortBy = e.target.value;
    
    // Get demo products and real products
    const demoProducts = getDemoProducts();
    const realProducts = getProducts().filter(p => !p.id.startsWith('demo-'));
    
    // Merge arrays
    let allProducts = [...demoProducts, ...realProducts];
    
    if (sortBy === 'price-low') {
        allProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        allProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'quantity') {
        allProducts.sort((a, b) => b.quantity - a.quantity);
    }
    
    const container = document.getElementById('productsGrid');
    if (allProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌾</div>
                <div class="empty-state-text">No products available.</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allProducts.map(product => {
        const isDemo = product.id && product.id.startsWith('demo-');
        const productName = product.productName || product.name;
        const productImage = product.image || getImageFromShape(product.shape);
        
        return `
        <div class="product-card ${isDemo ? 'demo-product' : ''}">
            ${isDemo ? '<div class="demo-badge">DEMO</div>' : ''}
            <div class="product-image">${getProductImageHtml(productImage, productName)}</div>
            <div class="product-name">${productName}</div>
            <div class="product-info">Farmer: ${product.farmerName}</div>
            <div class="product-info">Available: ${product.quantity} kg</div>
            <div class="product-price">ETB ${product.price}/kg</div>
            <button class="btn btn-add-cart" onclick="addToCart('${product.id}', ${isDemo})">
                Add to Cart
            </button>
        </div>
    `;
    }).join('');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Map product names to image files
function getProductImagePath(imageName, productName = '') {
    if (!imageName) {
        // Try to infer from product name
        const name = (productName || '').toLowerCase();
        const imageMap = {
            'tomato': 'tomato.jpg',
            'potato': 'pottato.jpg', // Note: typo in filename
            'carrot': 'carrot.jpg',
            'onion': 'onion.jpg',
            'cabbage': 'onion.jpg', // Fallback
            'apple': 'apple.jpg',
            'avocado': 'avacado.jpg', // Note: typo in filename
            'avacado': 'avacado.jpg',
            'pepper': 'pepper.jpg',
            'teff': 'teff.jpg',
            'wheat': 'wheat.jpg'
        };
        
        for (const [key, value] of Object.entries(imageMap)) {
            if (name.includes(key)) {
                imageName = value;
                break;
            }
        }
    }
    
    // Normalize image name
    if (imageName) {
        // Handle common variations
        if (imageName === 'potato.jpg') imageName = 'pottato.jpg';
        if (imageName === 'avocado.jpg') imageName = 'avacado.jpg';
        
        // Check if it's a base64/data URL (uploaded image)
        if (imageName.startsWith('data:image/') || imageName.startsWith('blob:')) {
            return imageName;
        }
        
        // Return path to image file
        return `images/${imageName}`;
    }
    
    // Fallback - return null to trigger emoji fallback
    return null;
}

// Get product image HTML (with fallback)
function getProductImageHtml(imageName, productName = '') {
    const imagePath = getProductImagePath(imageName, productName);
    const fallbackEmoji = getProductEmoji(imageName) || '🌾';
    
    // If no image path, show emoji fallback directly
    if (!imagePath) {
        return `<div class="product-image-fallback" style="display: flex;">${fallbackEmoji}</div>`;
    }
    
    // If it's a data URL (uploaded image), use it directly
    if (imagePath.startsWith('data:image/')) {
        return `<img src="${imagePath}" alt="${productName}" class="product-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                 <div class="product-image-fallback" style="display: none;">${fallbackEmoji}</div>`;
    }
    
    // For file paths, try to load image with fallback
    return `<img src="${imagePath}" alt="${productName}" class="product-img" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" />
             <div class="product-image-fallback" style="display: none;">${fallbackEmoji}</div>`;
}

// Legacy function for emoji fallback
function getProductEmoji(imageName) {
    const emojiMap = {
        'tomato.jpg': '🍅',
        'pottato.jpg': '🥔',
        'potato.jpg': '🥔',
        'carrot.jpg': '🥕',
        'onion.jpg': '🧅',
        'cabbage.jpg': '🥬',
        'apple.jpg': '🍎',
        'avacado.jpg': '🥑',
        'avocado.jpg': '🥑',
        'pepper.jpg': '🌶️',
        'teff.jpg': '🌾',
        'wheat.jpg': '🌾'
    };
    return emojiMap[imageName] || '🌾';
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-family: 'Roboto', sans-serif;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ------------------ Rating Storage & UI ------------------

function getRatings() {
    return JSON.parse(localStorage.getItem('agrilink_ratings') || '[]');
}

function saveRatings(ratings) {
    localStorage.setItem('agrilink_ratings', JSON.stringify(ratings));
}

function saveRating(farmerId, buyerId, rating) {
    const ratings = getRatings();
    ratings.push({ farmerId, buyerId: buyerId || null, rating: Number(rating), date: new Date().toISOString() });
    saveRatings(ratings);
}

function getRatingsForFarmer(farmerId) {
    return getRatings().filter(r => r.farmerId === farmerId);
}

function getAverageRating(farmerId) {
    const ratings = getRatingsForFarmer(farmerId);
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((s, r) => s + Number(r.rating), 0);
    return sum / ratings.length;
}

// Rating modal queue and handlers
let ratingQueue = [];

function promptRatingsForFarmers(list) {
    // list: [{farmerId, farmerName}, ...]
    ratingQueue = list.slice();
    showNextRating();
}

function showNextRating() {
    if (!ratingQueue || ratingQueue.length === 0) return;
    const next = ratingQueue.shift();
    openRatingModal(next.farmerId, next.farmerName);
}

function openRatingModal(farmerId, farmerName) {
    const modal = document.getElementById('ratingModal');
    if (!modal) return;
    const title = document.getElementById('ratingModalTitle');
    const subtitleName = document.getElementById('ratingFarmerName');
    const starContainer = document.getElementById('starRating');
    const submitBtn = document.getElementById('submitRatingBtn');
    const closeBtn = document.getElementById('ratingModalClose');

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    title.textContent = 'Rate the Farmer';
    subtitleName.textContent = farmerName || 'the farmer';
    starContainer.dataset.rating = 0;

    // reset stars
    const stars = starContainer.querySelectorAll('.star');
    stars.forEach(s => s.classList.remove('selected', 'hovered'));

    // star hover/click handlers
    function onStarOver(e) {
        const v = Number(e.target.dataset.value) || 0;
        stars.forEach(s => {
            const val = Number(s.dataset.value);
            if (val <= v) s.classList.add('hovered'); else s.classList.remove('hovered');
        });
    }
    function onStarOut() {
        stars.forEach(s => s.classList.remove('hovered'));
    }
    function onStarClick(e) {
        const v = Number(e.target.dataset.value) || 0;
        starContainer.dataset.rating = v;
        stars.forEach(s => {
            const val = Number(s.dataset.value);
            if (val <= v) s.classList.add('selected'); else s.classList.remove('selected');
        });
    }

    stars.forEach(s => {
        s.addEventListener('mouseover', onStarOver);
        s.addEventListener('mouseout', onStarOut);
        s.addEventListener('click', onStarClick);
    });

    function closeModalAndCleanup() {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        // remove handlers
        stars.forEach(s => {
            s.removeEventListener('mouseover', onStarOver);
            s.removeEventListener('mouseout', onStarOut);
            s.removeEventListener('click', onStarClick);
        });
        submitBtn.removeEventListener('click', onSubmit);
        closeBtn.removeEventListener('click', onClose);
    }

    function onSubmit() {
        const rating = Number(starContainer.dataset.rating) || 0;
        const currentUser = getCurrentUser();
        const buyerId = currentUser ? currentUser.id : null;
        if (rating < 1 || rating > 5) {
            showNotification('Please select 1-5 stars to submit a rating.', 'error');
            return;
        }
        saveRating(farmerId, buyerId, rating);
        showNotification('Thanks for your rating!', 'success');
        closeModalAndCleanup();
        // show next in queue if any
        setTimeout(showNextRating, 300);
    }
    function onClose() {
        closeModalAndCleanup();
        // skip rating and go to next
        setTimeout(showNextRating, 300);
    }

    submitBtn.addEventListener('click', onSubmit);
    closeBtn.addEventListener('click', onClose);
}

