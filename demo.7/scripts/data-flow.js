// Data Flow Animation Controller
class DataFlowAnimator {
    constructor() {
        this.flows = [
            {
                id: 'farmer-buyer',
                from: 'farmer',
                to: 'buyer',
                label: 'Product Info',
                packet: 'packet-farmer-buyer',
                arrow: 'arrow-farmer-buyer',
                labelEl: 'label-farmer-buyer',
                data: {
                    crop: 'Teff',
                    quantity: '100 quintals',
                    price: '3200 ETB/quintal',
                    farmerId: 'F001'
                },
                path: 'M 100 100 Q 400 50 700 100',
                duration: 2000
            },
            {
                id: 'buyer-delivery',
                from: 'buyer',
                to: 'delivery',
                label: 'Order + Codes',
                packet: 'packet-buyer-delivery',
                arrow: 'arrow-buyer-delivery',
                labelEl: 'label-buyer-delivery',
                data: {
                    orderId: 'O001',
                    buyerCode: '4321',
                    farmerCode: '9876',
                    product: 'Teff',
                    quantity: '50 quintals'
                },
                path: 'M 700 150 Q 750 300 700 450',
                duration: 2000
            },
            {
                id: 'delivery-admin',
                from: 'delivery',
                to: 'admin',
                label: 'Delivery Status',
                packet: 'packet-delivery-admin',
                arrow: 'arrow-delivery-admin',
                labelEl: 'label-delivery-admin',
                data: {
                    deliveryId: 'D001',
                    status: 'Delivered',
                    codesVerified: true,
                    timestamp: '2024-01-20 14:30'
                },
                path: 'M 700 500 Q 400 550 100 500',
                duration: 2000
            },
            {
                id: 'admin-farmer',
                from: 'admin',
                to: 'farmer',
                label: 'Payment Release',
                packet: 'packet-admin-farmer',
                arrow: 'arrow-admin-farmer',
                labelEl: 'label-admin-farmer',
                data: {
                    paymentId: 'P001',
                    amount: '160,000 ETB',
                    status: 'Released',
                    farmerBalance: 'Updated'
                },
                path: 'M 100 500 Q 50 300 100 100',
                duration: 2000
            }
        ];
        
        this.currentFlowIndex = 0;
        this.isAnimating = false;
        this.tooltip = document.getElementById('tooltip');
        this.init();
    }
    
    init() {
        // Add hover listeners to arrows
        this.flows.forEach(flow => {
            const arrowElement = document.getElementById(flow.arrow);
            if (arrowElement) {
                arrowElement.addEventListener('mouseenter', (e) => this.showTooltip(e, flow));
                arrowElement.addEventListener('mouseleave', () => this.hideTooltip());
                arrowElement.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
            }
        });
        
        // Start animation loop
        this.startAnimation();
    }
    
    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animateFlow(0);
    }
    
    async animateFlow(index) {
        if (index >= this.flows.length) {
            // Loop back to start
            await this.delay(1000);
            this.currentFlowIndex = 0;
            this.animateFlow(0);
            return;
        }
        
        const flow = this.flows[index];
        this.currentFlowIndex = index;
        
        // Activate flow
        await this.activateFlow(flow);
        
        // Wait before next flow
        await this.delay(500);
        
        // Move to next flow
        this.animateFlow(index + 1);
    }
    
    async activateFlow(flow) {
        // Get elements
        const fromActor = document.getElementById(flow.from);
        const toActor = document.getElementById(flow.to);
        const packet = document.getElementById(flow.packet);
        const arrow = document.getElementById(flow.arrow);
        const label = document.getElementById(flow.labelEl);
        const arrowPath = arrow?.querySelector('.arrow-path');
        
        // Activate sending actor
        fromActor?.classList.add('sending');
        label?.classList.add('active');
        arrowPath?.classList.add('active');
        
        // Show and animate packet
        if (packet) {
            packet.classList.add('active');
            await this.animatePacket(packet, flow);
        }
        
        // Activate receiving actor
        toActor?.classList.add('receiving');
        
        // Wait for animation
        await this.delay(flow.duration);
        
        // Deactivate
        fromActor?.classList.remove('sending');
        toActor?.classList.remove('receiving');
        label?.classList.remove('active');
        arrowPath?.classList.remove('active');
        packet?.classList.remove('active');
        
        // Reset packet position
        if (packet) {
            this.resetPacketPosition(packet, flow);
        }
    }
    
    async animatePacket(packet, flow) {
        const path = flow.path;
        const duration = flow.duration;
        
        // Parse SVG path to extract coordinates
        // Format: M x1 y1 Q cx cy x2 y2
        const pathMatch = path.match(/M\s+(\d+)\s+(\d+)\s+Q\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (!pathMatch) return;
        
        const startX = parseInt(pathMatch[1]);
        const startY = parseInt(pathMatch[2]);
        const controlX = parseInt(pathMatch[3]);
        const controlY = parseInt(pathMatch[4]);
        const endX = parseInt(pathMatch[5]);
        const endY = parseInt(pathMatch[6]);
        
        // Set initial position
        packet.style.left = `${startX}px`;
        packet.style.top = `${startY}px`;
        
        // Animate along quadratic bezier curve
        const steps = 60;
        const stepDuration = duration / steps;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // Quadratic bezier curve formula: (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
            const x = Math.round((1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX);
            const y = Math.round((1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY);
            
            packet.style.left = `${x}px`;
            packet.style.top = `${y}px`;
            
            await this.delay(stepDuration);
        }
    }
    
    resetPacketPosition(packet, flow) {
        // Reset to starting position based on flow
        const positions = {
            'farmer-buyer': { left: '100px', top: '100px' },
            'buyer-delivery': { left: '700px', top: '150px' },
            'delivery-admin': { left: '700px', top: '500px' },
            'admin-farmer': { left: '100px', top: '500px' }
        };
        
        const pos = positions[flow.id];
        if (pos) {
            packet.style.left = pos.left;
            packet.style.top = pos.top;
        }
    }
    
    showTooltip(event, flow) {
        if (!this.tooltip) return;
        
        const dataText = Object.entries(flow.data)
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br>');
        
        this.tooltip.innerHTML = `
            <div style="margin-bottom: 5px; font-weight: bold; color: #4CAF50;">
                ${flow.label}
            </div>
            <div style="font-size: 0.85rem;">
                ${dataText}
            </div>
        `;
        
        this.tooltip.classList.add('show');
        this.updateTooltipPosition(event);
    }
    
    updateTooltipPosition(event) {
        if (!this.tooltip) return;
        
        const x = event.clientX + 15;
        const y = event.clientY - 15;
        
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const animator = new DataFlowAnimator();
    
    // Add click handlers to actors for additional interactivity
    document.querySelectorAll('.actor').forEach(actor => {
        actor.addEventListener('click', () => {
            const actorName = actor.dataset.actor;
            alert(`${actorName} clicked!\n\nThis actor is part of the AGRILINK marketplace data flow.`);
        });
    });
});

