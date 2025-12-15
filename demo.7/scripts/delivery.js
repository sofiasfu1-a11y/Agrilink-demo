// Delivery Panel JavaScript
let selectedDeliveryId = null;

// Static driver info for demo
const currentDriver = {
    id: 'DA001',
    name: 'Meles Delivery',
    carId: 'ABC-1234',
    photo: 'sofi/OIP.webp'
};

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

// Display deliveries
function displayDeliveries() {
    loadData();
    
    const pendingDeliveries = agrilinkData.deliveries.filter(d => d.status === 'Pending');
    const completedDeliveries = agrilinkData.deliveries.filter(d => d.status === 'Delivered');
    
    // Update stats
    document.getElementById('pendingCount').textContent = pendingDeliveries.length;
    document.getElementById('deliveredCount').textContent = completedDeliveries.length;
    
    // Display pending deliveries
    const pendingList = document.getElementById('deliveriesList');
    if (pendingDeliveries.length === 0) {
        pendingList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No pending deliveries</div>';
    } else {
        pendingList.innerHTML = pendingDeliveries.map(delivery => {
            return `
                <div class="delivery-card">
                    <div class="delivery-header">
                        <div class="delivery-id">${delivery.id}</div>
                        <div class="delivery-status pending">${delivery.status}</div>
                    </div>
                    <div class="delivery-info">
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Crop:</span>
                            <span class="delivery-info-value">${delivery.cropEn || delivery.product || 'N/A'} ${delivery.crop ? '(' + delivery.crop + ')' : ''}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Quantity:</span>
                            <span class="delivery-info-value">${delivery.quantity} ${delivery.unit || 'kg'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Farmer:</span>
                            <span class="delivery-info-value">${delivery.farmerName || 'N/A'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Buyer:</span>
                            <span class="delivery-info-value">${delivery.buyerName || 'N/A'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Pickup:</span>
                            <span class="delivery-info-value">📍 ${delivery.pickupLocation || delivery.farmerLocation || 'N/A'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Drop-off:</span>
                            <span class="delivery-info-value">📍 ${delivery.dropoffLocation || delivery.buyerLocation || 'N/A'}</span>
                        </div>
                        ${delivery.buyerCode ? `
                        <div class="delivery-info-item buyer-code-display">
                            <span class="delivery-info-label">Buyer Code:</span>
                            <span class="delivery-info-value code-highlight">${delivery.buyerCode}</span>
                        </div>
                        ` : ''}
                        ${delivery.deliveryAgentId ? `
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Assigned Agent:</span>
                            <span class="delivery-info-value">${delivery.deliveryAgentId}</span>
                        </div>
                        ` : ''}
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Date Created:</span>
                            <span class="delivery-info-value">${delivery.dateCreated}</span>
                        </div>
                    </div>
                    <div class="delivery-actions">
                        <button class="btn-deliver" onclick="openConfirmModal('${delivery.id}')">Mark as Delivered</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Display completed deliveries
    const completedList = document.getElementById('completedList');
    if (completedDeliveries.length === 0) {
        completedList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No completed deliveries</div>';
    } else {
        completedList.innerHTML = completedDeliveries.map(delivery => {
            return `
                <div class="delivery-card delivered">
                    <div class="delivery-header">
                        <div class="delivery-id">${delivery.id}</div>
                        <div class="delivery-status delivered">${delivery.status}</div>
                    </div>
                    <div class="delivery-info">
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Crop:</span>
                            <span class="delivery-info-value">${delivery.cropEn || delivery.product || 'N/A'} ${delivery.crop ? '(' + delivery.crop + ')' : ''}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Quantity:</span>
                            <span class="delivery-info-value">${delivery.quantity} ${delivery.unit || 'kg'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Farmer:</span>
                            <span class="delivery-info-value">${delivery.farmerName || 'N/A'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Buyer:</span>
                            <span class="delivery-info-value">${delivery.buyerName || 'N/A'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Delivered Date:</span>
                            <span class="delivery-info-value">${delivery.dateDelivered || 'N/A'} ${delivery.dateDeliveredTime ? 'at ' + delivery.dateDeliveredTime : ''}</span>
                        </div>
                        ${delivery.deliveryAgentId ? `
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Delivery Agent:</span>
                            <span class="delivery-info-value">${delivery.deliveryAgentId}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Open confirmation modal
function openConfirmModal(deliveryId) {
    selectedDeliveryId = deliveryId;
    const modal = document.getElementById('confirmModal');
    
    // Pre-fill delivery agent ID with current driver ID
    document.getElementById('deliveryAgentIdInput').value = currentDriver.id;
    document.getElementById('farmerCodeInput').value = '';
    document.getElementById('buyerCodeInput').value = '';
    document.getElementById('deliveryError').textContent = '';
    
    // Load delivery and order info to show in modal
    loadData();
    const delivery = agrilinkData.deliveries.find(d => d.id === deliveryId);
    if (delivery) {
        const order = agrilinkData.orders.find(o => o.id === delivery.orderId);
        if (order) {
            // Show order info in modal header
            const modalContent = document.querySelector('#confirmModal .modal-content');
            const existingInfo = document.getElementById('deliveryInfoDisplay');
            if (existingInfo) existingInfo.remove();
            
            const agent = agrilinkData.deliveryAgents ? agrilinkData.deliveryAgents.find(a => a.id === delivery.deliveryAgentId) : null;
            
            const infoDiv = document.createElement('div');
            infoDiv.id = 'deliveryInfoDisplay';
            infoDiv.className = 'delivery-info-display';
            
            const cropName = delivery.cropEn || delivery.product || 'N/A';
            let infoHtml = `<p><strong>Order:</strong> ${delivery.orderId} | <strong>Crop:</strong> ${cropName} | <strong>Quantity:</strong> ${delivery.quantity} ${delivery.unit || order.unit || 'kg'}</p>`;
            
            if (delivery.buyerCode) {
                infoHtml += `<p><strong>Buyer Code:</strong> <span style="font-size: 1.2em; font-weight: bold; letter-spacing: 2px; color: #0c5460;">${delivery.buyerCode}</span></p>`;
            }
            
            if (agent) {
                infoHtml += `<p><strong>Delivery Agent:</strong> ${agent.name} (Car ID: ${agent.carId})</p>`;
            }
            
            infoDiv.innerHTML = infoHtml;
            const instruction = document.querySelector('#confirmModal .modal-instruction');
            instruction.after(infoDiv);
        }
    }
    
    modal.classList.add('show');
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('deliveryAgentIdInput').focus();
    }, 100);
}

// Close confirmation modal
function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('show');
    selectedDeliveryId = null;
    
    // Remove info display if exists
    const infoDisplay = document.getElementById('deliveryInfoDisplay');
    if (infoDisplay) {
        infoDisplay.remove();
    }
}

// Confirm delivery
function confirmDelivery() {
    const deliveryAgentId = document.getElementById('deliveryAgentIdInput').value.trim().toUpperCase();
    const farmerCode = document.getElementById('farmerCodeInput').value.trim();
    const buyerCode = document.getElementById('buyerCodeInput').value.trim();
    const errorDiv = document.getElementById('deliveryError');
    
    // Validate inputs
    if (!deliveryAgentId) {
        errorDiv.textContent = 'Please enter your Delivery Agent ID';
        return;
    }
    
    if (!farmerCode || farmerCode.length !== 4) {
        errorDiv.textContent = 'Please enter a valid 4-digit Farmer Code';
        return;
    }
    
    if (!buyerCode || buyerCode.length !== 4) {
        errorDiv.textContent = 'Please enter a valid 4-digit Buyer Code';
        return;
    }
    
    loadData();
    
    const delivery = agrilinkData.deliveries.find(d => d.id === selectedDeliveryId);
    if (!delivery) {
        errorDiv.textContent = 'Delivery not found';
        return;
    }
    
    if (delivery.status === 'Delivered') {
        errorDiv.textContent = 'This delivery has already been confirmed';
        return;
    }
    
    // Get the order to verify codes
    const order = agrilinkData.orders.find(o => o.id === delivery.orderId);
    if (!order) {
        errorDiv.textContent = 'Order not found';
        return;
    }
    
    // Verify codes
    // Note: deliveryAgentId can be any valid ID on first confirmation
    // farmerCode and buyerCode must match exactly
    
    if (farmerCode !== order.farmerCode) {
        errorDiv.textContent = 'Error: Farmer Code is incorrect. Please check and try again.';
        return;
    }
    
    if (buyerCode !== order.buyerCode) {
        errorDiv.textContent = 'Error: Buyer Code is incorrect. Please check and try again.';
        return;
    }
    
    // If order already has a deliveryAgentId, verify it matches
    if (order.deliveryAgentId && order.deliveryAgentId !== deliveryAgentId) {
        errorDiv.textContent = 'Error: Delivery Agent ID does not match the assigned agent. Please check and try again.';
        return;
    }
    
    // All codes verified - proceed with delivery confirmation
    const now = new Date();
    const dateDelivered = now.toISOString().split('T')[0];
    const timeDelivered = now.toTimeString().split(' ')[0];
    const deliveryTimestamp = now.getTime(); // Unix timestamp in milliseconds
    
    // Update delivery status
    delivery.status = 'Delivered';
    delivery.dateDelivered = dateDelivered;
    delivery.dateDeliveredTime = timeDelivered;
    delivery.deliveryAgentId = deliveryAgentId;
    delivery.codesVerified = true;
    
    // Update order status
    order.status = 'Delivered';
    order.deliveryAgentId = deliveryAgentId;
    order.codesVerified = true;
    order.deliveryTimestamp = deliveryTimestamp; // Store timestamp for refund window calculation
    
    // Automatically release payment
    const payment = agrilinkData.payments.find(p => p.deliveryId === delivery.id);
    if (payment && payment.status === 'Pending Release') {
        payment.status = 'Released';
        payment.dateReleased = dateDelivered;
        
        // Update farmer balance
        const farmer = agrilinkData.farmers.find(f => f.id === payment.farmerId);
        if (farmer) {
            farmer.balance += payment.amount;
            farmer.totalEarned += payment.amount;
        }
        
        delivery.paymentReleased = true;
        order.paymentReleased = true;
    }
    
    // Add to audit log
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: now.toISOString(),
        action: 'Delivery Confirmed',
        userId: deliveryAgentId,
        details: `Delivery ${selectedDeliveryId} confirmed. All codes verified. Payment released automatically.`
    });
    
    saveData();
    
    closeConfirmModal();
    showToast('✅ Delivery confirmed successfully! Payment released automatically.');
    
    // Refresh display
    setTimeout(() => {
        displayDeliveries();
    }, 500);
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('successToast');
    toast.textContent = message;
    toast.className = 'toast show';
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Display driver info at the top
    document.getElementById('driverId').textContent = currentDriver.id;
    document.getElementById('driverName').textContent = currentDriver.name;
    
    // Pre-fill delivery agent ID in confirmation modal with current driver ID
    const deliveryAgentInput = document.getElementById('deliveryAgentIdInput');
    if (deliveryAgentInput) {
        // Set default value to current driver ID
        deliveryAgentInput.placeholder = currentDriver.id;
    }
    
    // Close modal on X click
    document.querySelector('.close').addEventListener('click', closeConfirmModal);
    
    // Close modal on outside click
    document.getElementById('confirmModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeConfirmModal();
        }
    });
    
    // Only allow numeric input for codes
    document.getElementById('farmerCodeInput').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    document.getElementById('buyerCodeInput').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    // Confirm on Enter key in any input
    [document.getElementById('deliveryAgentIdInput'), 
     document.getElementById('farmerCodeInput'), 
     document.getElementById('buyerCodeInput')].forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    confirmDelivery();
                }
            });
        }
    });
    
    // Initial display
    displayDeliveries();
    
    // Auto-refresh every 2 seconds
    setInterval(displayDeliveries, 2000);
});

