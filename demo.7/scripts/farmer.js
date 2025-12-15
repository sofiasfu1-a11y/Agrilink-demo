// Farmer Panel JavaScript
let currentFarmer = null;

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

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Map crop to image from images folder - maps product names to actual image filenames
function getCropImage(cropEn) {
    if (!cropEn) return 'images/teff.jpg';
    
    // Convert to lowercase for matching
    const nameLower = cropEn.toLowerCase();
    
    // Map product names to actual image filenames in images folder
    // Note: Some filenames have different spellings (pottato, avacado)
    const imageMap = {
        'teff': 'images/teff.jpg',
        'tomato': 'images/tomato.jpg',
        'onion': 'images/onion.jpg',
        'potato': 'images/pottato.jpg',  // Filename is pottato.jpg
        'avocado': 'images/avacado.jpg',  // Filename is avacado.jpg
        'banana': 'images/apple.jpg',  // No banana.jpg, using apple.jpg
        'carrot': 'images/carrot.jpg',
        'pepper': 'images/pepper.jpg',
        'wheat': 'images/wheat.jpg'
    };
    
    return imageMap[nameLower] || 'images/teff.jpg';
}

// Map crop to English name
function getCropName(cropEn) {
    const nameMap = {
        'Teff': 'Teff',
        'Tomato': 'Tomato',
        'Onion': 'Onion',
        'Potato': 'Potato',
        'Banana': 'Banana',
        'Avocado': 'Avocado'
    };
    return nameMap[cropEn] || cropEn;
}

// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    const passcodeInput = document.getElementById('passcodeInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');

    // Only allow numeric input
    passcodeInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Login on button click
    loginBtn.addEventListener('click', function() {
        const passcode = passcodeInput.value;
        if (passcode.length === 4) {
            const farmer = agrilinkData.farmers.find(f => f.passcode === passcode);
            if (farmer) {
                currentFarmer = farmer;
                loginError.textContent = '';
                showScreen('mainMenu');
                passcodeInput.value = '';
            } else {
                loginError.textContent = '❌ የተሳሳተ የይለፍ ቃል';
                setTimeout(() => {
                    loginError.textContent = '';
                }, 3000);
            }
        } else {
            loginError.textContent = 'እባክዎ 4 አሃዝ የይለፍ ቃል ያስገቡ';
        }
    });

    // Login on Enter key
    passcodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    // Crop selection
    document.querySelectorAll('.crop-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.crop-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            const crop = this.dataset.crop;
            const cropEn = this.dataset.cropEn;
            document.getElementById('selectedCropName').textContent = crop;
            document.getElementById('sellForm').style.display = 'flex';
            document.getElementById('quantityInput').value = '';
            document.getElementById('priceInput').value = '';
        });
    });

    // Confirm sell
    document.getElementById('confirmSellBtn').addEventListener('click', function() {
        const selectedCard = document.querySelector('.crop-card.selected');
        if (!selectedCard) {
            showToast('እባክዎ ምርት ይምረጡ', 'error');
            return;
        }

        const crop = selectedCard.dataset.crop;
        const cropEn = selectedCard.dataset.cropEn;
        const quantity = parseInt(document.getElementById('quantityInput').value);
        const price = parseInt(document.getElementById('priceInput').value);

        if (!quantity || quantity <= 0) {
            showToast('እባክዎ ትክክለኛ መጠን ያስገቡ', 'error');
            return;
        }

        if (!price || price <= 0) {
            showToast('እባክዎ ትክክለኛ ዋጋ ያስገቡ', 'error');
            return;
        }

        // Generate farmer code (4-digit code for delivery verification)
        const farmerCode = String(Math.floor(1000 + Math.random() * 9000));

        // Generate unique product ID (alphanumeric, 8 characters)
        const productId = 'PRD' + String(Math.floor(100000 + Math.random() * 900000));

        // Generate mock driver info for demo
        const mockDriverNames = [
            'መለስ አሽከርካሪ',
            'ከበደ ትራንስፖርት',
            'ተስፋዬ ዲሊቨሪ',
            'ማርያም አሽከርካሪ',
            'ደምሴ ትራንስፖርት'
        ];
        const mockDriverName = mockDriverNames[Math.floor(Math.random() * mockDriverNames.length)];
        const mockDriverLicense = 'DL-' + String(Math.floor(10000 + Math.random() * 90000));

        // Create new listing
        const newListing = {
            id: 'L' + String(agrilinkData.listings.length + 1).padStart(3, '0'),
            productId: productId,  // Unique product ID
            farmerId: currentFarmer.id,
            farmerName: currentFarmer.name,
            farmerLocation: currentFarmer.location,
            crop: crop,
            cropEn: cropEn,
            name: getCropName(cropEn),  // English product name
            image: getCropImage(cropEn),  // Image from images folder
            quantity: quantity,
            pricePerUnit: price,
            unit: 'kg',
            dateListed: new Date().toISOString().split('T')[0],
            status: 'available',
            farmerCode: farmerCode,  // Store code for when order is placed
            driverName: mockDriverName,  // Mock driver name
            driverLicense: mockDriverLicense  // Mock driver license
        };

        agrilinkData.listings.push(newListing);
        saveData();

        // Add to audit log
        agrilinkData.auditLog.push({
            id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
            timestamp: new Date().toISOString(),
            action: 'Listing Created',
            userId: currentFarmer.id,
            details: `Farmer listed ${quantity}kg of ${cropEn} with Product ID: ${productId}`
        });
        saveData();

        // Show SMS notification with farmer code (demo simulation)
        const smsMessage = `📱 SMS Simulation:\n\nAGRILINK: Your verification code for ${cropEn} listing is: ${farmerCode}\n\nThis code will be required when delivery is confirmed.`;
        alert(smsMessage);
        
        // Show product info modal with product ID and driver info
        showProductInfoModal(productId, mockDriverName, mockDriverLicense);
        
        showToast('✅ ምርት በተሳካ ሁኔታ ተመዝግቧል!');
        
        // Reset form
        document.querySelectorAll('.crop-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('sellForm').style.display = 'none';
        document.getElementById('quantityInput').value = '';
        document.getElementById('priceInput').value = '';

        setTimeout(() => {
            showScreen('mainMenu');
        }, 2000);
    });

    // Load balance data
    updateBalance();
    updateMarketNews();
});

// Update balance screen
function updateBalance() {
    if (!currentFarmer) return;

    loadData();
    
    // Calculate totals from payments
    let totalSold = 0;
    let totalEarned = 0;

    agrilinkData.payments.forEach(payment => {
        if (payment.farmerId === currentFarmer.id && payment.status === 'Released') {
            totalEarned += payment.amount;
        }
    });

    agrilinkData.orders.forEach(order => {
        if (order.farmerId === currentFarmer.id) {
            totalSold += order.quantity;
        }
    });

    document.getElementById('totalSold').textContent = totalSold + ' ኪ.ግ';
    document.getElementById('totalEarned').textContent = totalEarned + ' ብር';
}

// Update market news
function updateMarketNews() {
    loadData();

    // Calculate popular products from orders
    const productOrders = {};
    agrilinkData.orders.forEach(order => {
        if (!productOrders[order.crop]) {
            productOrders[order.crop] = 0;
        }
        productOrders[order.crop]++;
    });

    // Get top 3
    const popular = Object.entries(productOrders)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const popularHtml = popular.map(([crop, count], index) => {
        return `
            <div class="popular-item">
                <span class="rank">${index + 1}</span>
                <span>${crop}</span>
                <span>${count} ትዕዛዞች</span>
            </div>
        `;
    }).join('');

    document.getElementById('popularProducts').innerHTML = popularHtml || '<div style="text-align: center; padding: 20px; font-size: 1.5em;">እስካሁን ምንም ትዕዛዞች የሉም</div>';

    // Market prices
    const pricesHtml = Object.entries(agrilinkData.demandMetrics).map(([crop, data]) => {
        return `
            <div class="price-item">
                <span>${crop}</span>
                <span>${data.avgPrice} ብር/ኪ.ግ</span>
            </div>
        `;
    }).join('');

    document.getElementById('marketPrices').innerHTML = pricesHtml;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') {
        toast.style.background = 'rgba(255, 68, 68, 0.95)';
        toast.style.color = '#fff';
    } else {
        toast.style.background = 'rgba(56, 239, 125, 0.95)';
        toast.style.color = '#000';
    }
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show product info modal
function showProductInfoModal(productId, driverName, driverLicense) {
    const modal = document.getElementById('productInfoModal');
    document.getElementById('productIdDisplay').textContent = productId;
    document.getElementById('driverNameDisplay').textContent = driverName;
    document.getElementById('driverLicenseDisplay').textContent = driverLicense;
    modal.classList.add('show');
}

// Close product info modal
function closeProductInfoModal() {
    const modal = document.getElementById('productInfoModal');
    modal.classList.remove('show');
}

// Logout
function logout() {
    currentFarmer = null;
    showScreen('loginScreen');
    document.getElementById('passcodeInput').value = '';
}

    // Close modal when clicking outside
    const productInfoModal = document.getElementById('productInfoModal');
    if (productInfoModal) {
        productInfoModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeProductInfoModal();
            }
        });
    }

    // Refresh data when screen is shown
    document.addEventListener('DOMContentLoaded', function() {
        // Refresh balance when balance screen is shown
        const balanceScreen = document.getElementById('balanceScreen');
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (balanceScreen.classList.contains('active')) {
                    updateBalance();
                }
                if (document.getElementById('newsScreen').classList.contains('active')) {
                    updateMarketNews();
                }
            });
        });
        observer.observe(balanceScreen, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.getElementById('newsScreen'), { attributes: true, attributeFilter: ['class'] });
    });

