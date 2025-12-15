// Admin Panel JavaScript

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

// Update summary cards
function updateSummary() {
    loadData();
    
    document.getElementById('totalFarmers').textContent = agrilinkData.farmers.length;
    document.getElementById('activeListings').textContent = agrilinkData.listings.filter(l => l.status === 'available').length;
    document.getElementById('pendingDeliveries').textContent = agrilinkData.deliveries.filter(d => d.status === 'Pending').length;
    
    // Count auto-released payments
    const autoReleased = agrilinkData.payments.filter(p => p.status === 'Released').length;
    document.getElementById('paymentsAutoReleased').textContent = autoReleased;
    
    // Count exceptions (deliveries with issues)
    const exceptions = getExceptions();
    document.getElementById('exceptionsCount').textContent = exceptions.length;
    
    // Show/hide exception alert
    const exceptionAlert = document.getElementById('exceptionAlert');
    if (exceptions.length > 0) {
        exceptionAlert.style.display = 'flex';
    } else {
        exceptionAlert.style.display = 'none';
    }
}

// Get exceptions (deliveries with issues)
function getExceptions() {
    loadData();
    const exceptions = [];
    
    agrilinkData.deliveries.forEach(delivery => {
        const order = agrilinkData.orders.find(o => o.id === delivery.orderId);
        if (!order) return;
        
        // Exception conditions:
        // 1. Codes not verified but delivery is marked as delivered
        // 2. Delivery status is not Delivered but codes are verified (inconsistent)
        // 3. Payment not released but delivery is completed and codes verified
        const isException = 
            (delivery.status === 'Delivered' && !delivery.codesVerified) ||
            (delivery.status !== 'Delivered' && delivery.codesVerified) ||
            (delivery.status === 'Delivered' && delivery.codesVerified && !delivery.paymentReleased);
        
        if (isException) {
            exceptions.push({ delivery, order });
        }
    });
    
    return exceptions;
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Refresh the tab content
    refreshTab(tabName);
}

// Refresh tab content
function refreshTab(tabName) {
    loadData();
    
    switch(tabName) {
        case 'deliveries':
            displayDeliveries();
            break;
        case 'payments':
            displayPayments();
            break;
        case 'refunds':
            displayRefunds();
            break;
        case 'farmers':
            displayFarmers();
            break;
        case 'orders':
            displayOrders();
            break;
        case 'audit':
            displayAuditLog();
            break;
    }
}

// Display deliveries
function displayDeliveries() {
    loadData();
    const tbody = document.getElementById('deliveriesTableBody');
    const showExceptionsOnly = document.getElementById('showExceptionsOnly')?.checked || false;
    
    let deliveries = agrilinkData.deliveries;
    
    // Filter for exceptions if toggle is on
    if (showExceptionsOnly) {
        const exceptions = getExceptions();
        deliveries = exceptions.map(e => e.delivery);
    }
    
    tbody.innerHTML = deliveries.map(delivery => {
        const order = agrilinkData.orders.find(o => o.id === delivery.orderId);
        const isException = getExceptions().some(e => e.delivery.id === delivery.id);
        
        // Determine row class
        let rowClass = '';
        if (isException) {
            rowClass = 'exception-row';
        } else if (delivery.status === 'Delivered') {
            rowClass = 'delivered';
        } else {
            rowClass = 'pending';
        }
        
        // Codes verified status
        const codesVerified = delivery.codesVerified ? 'Yes' : 'No';
        const codesVerifiedClass = delivery.codesVerified ? 'verified' : 'not-verified';
        
        // Payment released status
        const paymentReleased = delivery.paymentReleased ? 'Yes' : 'No';
        const paymentReleasedClass = delivery.paymentReleased ? 'released' : 'pending-release';
        
        return `
            <tr class="${rowClass}">
                <td>${delivery.id}</td>
                <td>${delivery.orderId}</td>
                <td>${delivery.cropEn} (${delivery.crop})</td>
                <td>${delivery.quantity} kg</td>
                <td>${delivery.farmerName}</td>
                <td>${delivery.buyerName}</td>
                <td><span class="status-badge ${codesVerifiedClass}">${codesVerified}</span></td>
                <td><span class="status-badge ${delivery.status.toLowerCase()}">${delivery.status}</span></td>
                <td><span class="status-badge ${paymentReleasedClass}">${paymentReleased}</span></td>
                <td>${delivery.dateDelivered || 'N/A'} ${delivery.dateDeliveredTime ? 'at ' + delivery.dateDeliveredTime : ''}</td>
                <td>
                    ${isException ? 
                        `<button class="btn-action btn-investigate" onclick="investigateException('${delivery.id}')">Investigate</button>
                         <button class="btn-action btn-override" onclick="manualOverride('${delivery.id}')">Override</button>` : 
                        '<span style="color: #999;">-</span>'
                    }
                </td>
            </tr>
        `;
    }).join('');
    
    // Display exceptions section
    displayExceptions();
}

// Display exceptions section
function displayExceptions() {
    const exceptions = getExceptions();
    const exceptionSection = document.getElementById('exceptionSection');
    const exceptionsTableBody = document.getElementById('exceptionsTableBody');
    
    if (exceptions.length === 0) {
        exceptionSection.style.display = 'none';
        return;
    }
    
    exceptionSection.style.display = 'block';
    
    exceptionsTableBody.innerHTML = exceptions.map(({ delivery, order }) => {
        let issue = '';
        if (delivery.status === 'Delivered' && !delivery.codesVerified) {
            issue = 'Codes not verified';
        } else if (delivery.status !== 'Delivered' && delivery.codesVerified) {
            issue = 'Status inconsistency';
        } else if (delivery.status === 'Delivered' && delivery.codesVerified && !delivery.paymentReleased) {
            issue = 'Payment not released';
        }
        
        return `
            <tr class="exception-row">
                <td>${delivery.id}</td>
                <td><span class="issue-badge">${issue}</span></td>
                <td>${delivery.cropEn} (${delivery.crop})</td>
                <td>${delivery.farmerName}</td>
                <td>${delivery.buyerName}</td>
                <td><span class="status-badge ${delivery.status.toLowerCase()}">${delivery.status}</span></td>
                <td>
                    <button class="btn-action btn-investigate" onclick="investigateException('${delivery.id}')">Investigate</button>
                    <button class="btn-action btn-override" onclick="manualOverride('${delivery.id}')">Override</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Display payments
function displayPayments() {
    loadData();
    const tbody = document.getElementById('paymentsTableBody');
    
    tbody.innerHTML = agrilinkData.payments.map(payment => {
        const farmer = agrilinkData.farmers.find(f => f.id === payment.farmerId);
        const statusClass = payment.status === 'Released' ? 'released' : payment.status === 'Refunded' ? 'refunded' : 'pending-release';
        const delivery = agrilinkData.deliveries.find(d => d.id === payment.deliveryId);
        const releaseMethod = delivery && delivery.codesVerified ? 'Auto (Codes Verified)' : 'Manual';
        
        return `
            <tr>
                <td>${payment.id}</td>
                <td>${payment.orderId}</td>
                <td>${farmer ? farmer.name : 'N/A'}</td>
                <td>${payment.amount} ETB</td>
                <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
                <td>${payment.dateCreated}</td>
                <td>${payment.dateReleased || 'N/A'}</td>
                <td><span class="release-method">${payment.status === 'Released' ? releaseMethod : payment.status === 'Refunded' ? 'Refunded' : 'Pending'}</span></td>
            </tr>
        `;
    }).join('');
}

// Display refunds
function displayRefunds() {
    loadData();
    const tbody = document.getElementById('refundsTableBody');
    
    // Get all orders with refund requests
    const refundOrders = agrilinkData.orders.filter(o => o.refundRequested);
    
    // Sort by status (pending first) and then by date
    refundOrders.sort((a, b) => {
        const statusOrder = { 'pending': 0, 'approved': 1, 'rejected': 2 };
        const aStatus = statusOrder[a.refundStatus] ?? 3;
        const bStatus = statusOrder[b.refundStatus] ?? 3;
        if (aStatus !== bStatus) return aStatus - bStatus;
        return new Date(b.refundTimestamp || 0) - new Date(a.refundTimestamp || 0);
    });
    
    if (refundOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No refund requests</td></tr>';
        return;
    }
    
    tbody.innerHTML = refundOrders.map(order => {
        const buyer = agrilinkData.buyers ? agrilinkData.buyers.find(b => b.id === order.buyerId) : null;
        const buyerName = buyer ? buyer.name : order.buyerName || 'Unknown';
        const buyerId = order.buyerId || 'N/A';
        const productName = order.name || order.cropEn || order.crop || 'Product';
        const refundReason = order.refundReason || 'No reason provided';
        const refundStatus = order.refundStatus || 'pending';
        const deliveryStatus = order.status || 'Unknown';
        
        // Get buyer passcode (masked for security)
        const buyerPasscode = buyer && buyer.accountPasscode ? '****' : 'N/A';
        
        // Determine refund status display
        let statusBadge = '';
        let statusClass = '';
        if (refundStatus === 'approved') {
            statusBadge = '✅ Approved';
            statusClass = 'refund-approved';
        } else if (refundStatus === 'rejected') {
            statusBadge = '❌ Rejected';
            statusClass = 'refund-rejected';
        } else {
            statusBadge = '⏳ Pending';
            statusClass = 'refund-pending';
        }
        
        // Format refund timestamp
        const refundDate = order.refundTimestamp 
            ? new Date(order.refundTimestamp).toLocaleString() 
            : 'N/A';
        
        // Show action buttons only for pending refunds
        const actionButtons = refundStatus === 'pending' 
            ? `
                <button class="btn-action btn-approve" onclick="approveRefund('${order.id}')">Approve</button>
                <button class="btn-action btn-reject" onclick="rejectRefund('${order.id}')">Reject</button>
            `
            : '<span class="status-badge ' + statusClass + '">' + statusBadge + '</span>';
        
        return `
            <tr class="${statusClass}-row">
                <td>${order.id}</td>
                <td>${buyerName}<br><small style="color: #999;">${buyerId}</small></td>
                <td>${productName}</td>
                <td><span class="refund-reason" title="${refundReason}">${refundReason.length > 30 ? refundReason.substring(0, 30) + '...' : refundReason}</span></td>
                <td><span class="status-badge ${deliveryStatus.toLowerCase().replace(' ', '-')}">${deliveryStatus}</span></td>
                <td>${buyerPasscode}</td>
                <td><span class="status-badge ${statusClass}">${statusBadge}</span></td>
                <td>${refundDate}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

// Approve refund
function approveRefund(orderId) {
    if (!confirm('Are you sure you want to approve this refund request?')) {
        return;
    }
    
    loadData();
    const order = agrilinkData.orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Verify conditions
    if (order.status !== 'Delivered') {
        alert('Cannot approve refund: Order is not delivered');
        return;
    }
    
    // Check 24-hour window (optional, for demo we allow it)
    if (order.deliveryTimestamp) {
        const now = Date.now();
        const deliveryTime = order.deliveryTimestamp;
        const hoursSinceDelivery = (now - deliveryTime) / (1000 * 60 * 60);
        
        if (hoursSinceDelivery > 24) {
            if (!confirm('Refund request is outside 24-hour window. Still approve?')) {
                return;
            }
        }
    }
    
    // Update order status
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
    if (!agrilinkData.auditLog) {
        agrilinkData.auditLog = [];
    }
    
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Refund Approved',
        userId: 'ADMIN',
        details: `Admin approved refund for order ${orderId} (${order.totalPrice} ETB). Reason: ${order.refundReason || 'N/A'}`
    });
    
    saveData();
    
    // Refresh display
    displayRefunds();
    updateSummary();
    
    alert('✅ Refund approved successfully! Money has been returned to buyer account.');
}

// Reject refund
function rejectRefund(orderId) {
    const rejectionNote = prompt('Enter rejection reason (optional):');
    
    loadData();
    const order = agrilinkData.orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Update order status
    order.refundStatus = 'rejected';
    order.refundRejectionNote = rejectionNote || 'No reason provided';
    
    // Add to audit log
    if (!agrilinkData.auditLog) {
        agrilinkData.auditLog = [];
    }
    
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Refund Rejected',
        userId: 'ADMIN',
        details: `Admin rejected refund for order ${orderId}. Reason: ${order.refundRejectionNote}`
    });
    
    saveData();
    
    // Refresh display
    displayRefunds();
    updateSummary();
    
    alert('❌ Refund request rejected.');
}

// Display farmers
function displayFarmers() {
    const tbody = document.getElementById('farmersTableBody');
    
    tbody.innerHTML = agrilinkData.farmers.map(farmer => {
        // Calculate totals
        let totalSold = 0;
        let totalEarned = 0;
        
        agrilinkData.orders.forEach(order => {
            if (order.farmerId === farmer.id) {
                totalSold += order.quantity;
            }
        });
        
        agrilinkData.payments.forEach(payment => {
            if (payment.farmerId === farmer.id && payment.status === 'Released') {
                totalEarned += payment.amount;
            }
        });
        
        return `
            <tr>
                <td>${farmer.id}</td>
                <td>${farmer.name}</td>
                <td>${farmer.location}</td>
                <td>${farmer.phone}</td>
                <td>${totalSold} kg</td>
                <td>${totalEarned} ETB</td>
                <td>${farmer.balance} ETB</td>
                <td>
                    <button class="btn-action btn-view" onclick="viewFarmerDetails('${farmer.id}')">View</button>
                    <button class="btn-action btn-suspend" onclick="suspendFarmer('${farmer.id}')">Suspend</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Display orders
function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    tbody.innerHTML = agrilinkData.orders.map(order => {
        return `
            <tr>
                <td>${order.id}</td>
                <td>${order.buyerName}</td>
                <td>${order.cropEn} (${order.crop})</td>
                <td>${order.quantity} kg</td>
                <td>${order.totalPrice} ETB</td>
                <td>${order.farmerName}</td>
                <td><span class="status-badge ${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></td>
                <td>${order.dateOrdered}</td>
            </tr>
        `;
    }).join('');
}

// Display audit log
function displayAuditLog() {
    const tbody = document.getElementById('auditTableBody');
    
    // Sort by timestamp (newest first)
    const sortedLogs = [...agrilinkData.auditLog].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    tbody.innerHTML = sortedLogs.map(log => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleString();
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${log.action}</td>
                <td>${log.userId}</td>
                <td>${log.details}</td>
            </tr>
        `;
    }).join('');
}

// Toggle exception filter
function toggleExceptionFilter() {
    displayDeliveries();
}

// Investigate exception
function investigateException(deliveryId) {
    loadData();
    const delivery = agrilinkData.deliveries.find(d => d.id === deliveryId);
    const order = agrilinkData.orders.find(o => o.id === delivery.orderId);
    
    if (!delivery || !order) {
        showToast('Delivery or order not found', 'error');
        return;
    }
    
    let investigationReport = `Investigation Report - ${deliveryId}\n\n`;
    investigationReport += `Order ID: ${order.id}\n`;
    investigationReport += `Product: ${delivery.cropEn} (${delivery.crop})\n`;
    investigationReport += `Quantity: ${delivery.quantity} kg\n`;
    investigationReport += `Farmer: ${delivery.farmerName}\n`;
    investigationReport += `Buyer: ${delivery.buyerName}\n\n`;
    investigationReport += `Status Check:\n`;
    investigationReport += `- Delivery Status: ${delivery.status}\n`;
    investigationReport += `- Codes Verified: ${delivery.codesVerified ? 'Yes' : 'No'}\n`;
    investigationReport += `- Payment Released: ${delivery.paymentReleased ? 'Yes' : 'No'}\n\n`;
    
    if (delivery.status === 'Delivered' && !delivery.codesVerified) {
        investigationReport += `⚠️ ISSUE: Delivery marked as delivered but codes were not verified.\n`;
        investigationReport += `Expected: Codes should be verified before delivery confirmation.\n`;
    } else if (delivery.status !== 'Delivered' && delivery.codesVerified) {
        investigationReport += `⚠️ ISSUE: Codes verified but delivery status is not "Delivered".\n`;
        investigationReport += `Expected: Delivery status should be "Delivered" when codes are verified.\n`;
    } else if (delivery.status === 'Delivered' && delivery.codesVerified && !delivery.paymentReleased) {
        investigationReport += `⚠️ ISSUE: Delivery completed and codes verified but payment not released.\n`;
        investigationReport += `Expected: Payment should be automatically released.\n`;
    }
    
    investigationReport += `\nCodes Information:\n`;
    investigationReport += `- Farmer Code: ${order.farmerCode || 'N/A'}\n`;
    investigationReport += `- Buyer Code: ${order.buyerCode || 'N/A'}\n`;
    investigationReport += `- Delivery Agent ID: ${delivery.deliveryAgentId || 'N/A'}\n`;
    
    alert(investigationReport);
}

// Manual override (for exceptions only)
function manualOverride(deliveryId) {
    if (!confirm('Manually override this exception? This will mark codes as verified and release payment. (Demo only)')) {
        return;
    }
    
    loadData();
    const delivery = agrilinkData.deliveries.find(d => d.id === deliveryId);
    const order = agrilinkData.orders.find(o => o.id === delivery.orderId);
    
    if (!delivery || !order) {
        showToast('Delivery or order not found', 'error');
        return;
    }
    
    // Override: mark codes as verified
    delivery.codesVerified = true;
    order.codesVerified = true;
    
    // If delivery is marked as delivered, release payment
    if (delivery.status === 'Delivered' && !delivery.paymentReleased) {
        const payment = agrilinkData.payments.find(p => p.deliveryId === deliveryId);
        if (payment && payment.status === 'Pending Release') {
            payment.status = 'Released';
            payment.dateReleased = new Date().toISOString().split('T')[0];
            
            // Update farmer balance
            const farmer = agrilinkData.farmers.find(f => f.id === payment.farmerId);
            if (farmer) {
                farmer.balance += payment.amount;
                farmer.totalEarned += payment.amount;
            }
            
            delivery.paymentReleased = true;
            order.paymentReleased = true;
        }
    }
    
    // Add to audit log
    agrilinkData.auditLog.push({
        id: 'A' + String(agrilinkData.auditLog.length + 1).padStart(3, '0'),
        timestamp: new Date().toISOString(),
        action: 'Manual Override',
        userId: 'ADMIN',
        details: `Admin manually overrode exception for delivery ${deliveryId}. Codes verified and payment released.`
    });
    
    saveData();
    showToast('✅ Exception manually overridden. Payment released.');
    
    // Refresh displays
    updateSummary();
    refreshTab('deliveries');
    refreshTab('payments');
    refreshTab('farmers');
}

// View farmer details
function viewFarmerDetails(farmerId) {
    loadData();
    const farmer = agrilinkData.farmers.find(f => f.id === farmerId);
    if (!farmer) return;
    
    const orders = agrilinkData.orders.filter(o => o.farmerId === farmerId);
    const payments = agrilinkData.payments.filter(p => p.farmerId === farmerId);
    
    alert(`Farmer Details:\n\n` +
          `Name: ${farmer.name}\n` +
          `Location: ${farmer.location}\n` +
          `Phone: ${farmer.phone}\n` +
          `Total Orders: ${orders.length}\n` +
          `Total Payments: ${payments.length}\n` +
          `Balance: ${farmer.balance} ETB`);
}

// Suspend farmer (demo only)
function suspendFarmer(farmerId) {
    if (confirm('Are you sure you want to suspend this farmer? (Demo only - no actual action)')) {
        showToast('Farmer suspension feature (demo only)');
    }
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateSummary();
    displayDeliveries();
    
    // Auto-refresh every 2 seconds
    setInterval(() => {
        updateSummary();
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const tabName = activeTab.id.replace('Tab', '');
            refreshTab(tabName);
        }
    }, 2000);
});

