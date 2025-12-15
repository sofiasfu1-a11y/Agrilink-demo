// Shared mock data for AGRILINK marketplace
// All panels read/write to this file to simulate real-time updates

const agrilinkData = {
  // Farmers data
  farmers: [
    {
      id: 'F001',
      name: 'አበበ ተስፋዬ',
      location: 'አዲስ አበባ',
      phone: '+251911234567',
      passcode: '1234',
      balance: 0,
      totalSold: 0,
      totalEarned: 0,
      rating: 4.5,
      numRatings: 2,
      successfulDeliveries: 5
    },
    {
      id: 'F002',
      name: 'ማርያም አለማየሁ',
      location: 'ደብረ ማርቆስ',
      phone: '+251922345678',
      passcode: '5678',
      balance: 0,
      totalSold: 0,
      totalEarned: 0,
      rating: 4.8,
      numRatings: 3,
      successfulDeliveries: 8
    }
  ],

  // Delivery Agents
  deliveryAgents: [
    {
      id: 'DA001',
      name: 'Meles Delivery',
      carId: 'ABC-1234',
      photo: 'sofi/OIP.webp'
    },
    {
      id: 'DA002',
      name: 'Kebede Transport',
      carId: 'XYZ-5678',
      photo: 'sofi/OIP.webp'
    },
    {
      id: 'DA003',
      name: 'Tadesse Logistics',
      carId: 'DEF-9012',
      photo: 'sofi/OIP.webp'
    }
  ],

  // Product listings
  listings: [
    {
      id: 'L001',
      farmerId: 'F001',
      farmerName: 'Farmer Abebe',
      farmerLocation: 'Addis Ababa',
      crop: 'ጤፍ',
      cropEn: 'Teff',
      name: 'Teff',
      image: 'images/teff.jpg',
      quantity: 100,
      pricePerUnit: 3200,
      unit: 'quintal',
      dateListed: '2024-01-15',
      status: 'available'
    },
    {
      id: 'L002',
      farmerId: 'F001',
      farmerName: 'Farmer Abebe',
      farmerLocation: 'Addis Ababa',
      crop: 'ቲማቲም',
      cropEn: 'Tomato',
      name: 'Tomato',
      image: 'images/tomato.jpg',
      quantity: 200,
      pricePerUnit: 30,
      unit: 'kg',
      dateListed: '2024-01-16',
      status: 'available'
    },
    {
      id: 'L003',
      farmerId: 'F002',
      farmerName: 'Farmer Mariam',
      farmerLocation: 'Debre Markos',
      crop: 'ሽንኩርት',
      cropEn: 'Onion',
      name: 'Onion',
      image: 'images/onion.jpg',
      quantity: 150,
      pricePerUnit: 40,
      unit: 'kg',
      dateListed: '2024-01-17',
      status: 'available'
    },
    {
      id: 'L004',
      farmerId: 'F002',
      farmerName: 'Farmer Mariam',
      farmerLocation: 'Debre Markos',
      crop: 'ድንች',
      cropEn: 'Potato',
      name: 'Potato',
      image: 'images/pottato.jpg',
      quantity: 300,
      pricePerUnit: 25,
      unit: 'kg',
      dateListed: '2024-01-18',
      status: 'available'
    },
    {
      id: 'L005',
      farmerId: 'F001',
      farmerName: 'Farmer Abebe',
      farmerLocation: 'Addis Ababa',
      crop: 'ሙዝ',
      cropEn: 'Banana',
      name: 'Banana',
      image: 'images/apple.jpg', // Using available image as placeholder
      quantity: 180,
      pricePerUnit: 35,
      unit: 'kg',
      dateListed: '2024-01-19',
      status: 'available'
    },
    {
      id: 'L006',
      farmerId: 'F002',
      farmerName: 'Farmer Mariam',
      farmerLocation: 'Debre Markos',
      crop: 'አቫካዶ',
      cropEn: 'Avocado',
      name: 'Avocado',
      image: 'images/avacado.jpg',
      quantity: 120,
      pricePerUnit: 60,
      unit: 'kg',
      dateListed: '2024-01-20',
      status: 'available'
    }
  ],

  // Buyers data
  buyers: [
    {
      id: 'B001',
      name: 'John Smith',
      email: 'john@example.com',
      location: 'Addis Ababa'
    },
    {
      id: 'B002',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      location: 'Dire Dawa'
    }
  ],

  // Orders
  orders: [
    {
      id: 'O001',
      buyerId: 'B001',
      buyerName: 'John Smith',
      listingId: 'L001',
      crop: 'ጤፍ',
      cropEn: 'Teff',
      quantity: 50,
      pricePerUnit: 50,
      totalPrice: 2500,
      farmerId: 'F001',
      farmerName: 'አበበ ተስፋዬ',
      farmerLocation: 'አዲስ አበባ',
      buyerLocation: 'Addis Ababa',
      dateOrdered: '2024-01-18',
      status: 'Waiting for Delivery',
      farmerCode: '9876',  // Code sent to farmer via SMS
      buyerCode: '4321',   // Code generated at buyer checkout
      deliveryAgentId: null, // Will be set when delivery is confirmed
      codesVerified: false,
      paymentReleased: false,
      rated: false,  // Whether buyer has rated the farmer
      deliveryTimestamp: null,  // Unix timestamp in ms when delivery was confirmed
      refundRequested: false,  // Whether buyer has requested a refund
      refundProcessed: false  // Whether refund has been processed
    }
  ],

  // Deliveries
  deliveries: [
    {
      id: 'D001',
      orderId: 'O001',
      buyerId: 'B001',
      buyerName: 'John Smith',
      farmerId: 'F001',
      farmerName: 'አበበ ተስፋዬ',
      crop: 'ጤፍ',
      cropEn: 'Teff',
      quantity: 50,
      pickupLocation: 'አዲስ አበባ',
      dropoffLocation: 'Addis Ababa',
      dateCreated: '2024-01-18',
      dateDelivered: null,
      dateDeliveredTime: null,
      status: 'Pending',
      deliveryAgentId: null,
      codesVerified: false,
      paymentReleased: false
    }
  ],

  // Payments
  payments: [
    {
      id: 'P001',
      orderId: 'O001',
      deliveryId: 'D001',
      farmerId: 'F001',
      amount: 2500,
      status: 'Pending Release',
      dateCreated: '2024-01-18',
      dateReleased: null
    }
  ],

  // Demand metrics (for market news)
  demandMetrics: {
    'ጤፍ': { totalOrders: 5, avgPrice: 50 },
    'ቲማቲም': { totalOrders: 8, avgPrice: 30 },
    'ሽንኩርት': { totalOrders: 6, avgPrice: 40 },
    'ድንች': { totalOrders: 3, avgPrice: 25 },
    'ሙዝ': { totalOrders: 4, avgPrice: 35 },
    'አቫካዶ': { totalOrders: 2, avgPrice: 60 }
  },

  // Audit log
  auditLog: [
    {
      id: 'A001',
      timestamp: '2024-01-18T10:00:00',
      action: 'Listing Created',
      userId: 'F001',
      details: 'Farmer listed 100kg of Teff'
    },
    {
      id: 'A002',
      timestamp: '2024-01-18T11:00:00',
      action: 'Order Placed',
      userId: 'B001',
      details: 'Buyer ordered 50kg of Teff'
    }
  ]
};

// Helper functions to save/load data
function saveData() {
  localStorage.setItem('agrilinkData', JSON.stringify(agrilinkData));
}

function loadData() {
  const saved = localStorage.getItem('agrilinkData');
  if (saved) {
    Object.assign(agrilinkData, JSON.parse(saved));
  }
}

// Initialize: load saved data or use defaults
loadData();

// Auto-save on any modification (simulate real-time updates)
const originalData = JSON.parse(JSON.stringify(agrilinkData));
setInterval(() => {
  const currentData = JSON.stringify(agrilinkData);
  if (currentData !== JSON.stringify(originalData)) {
    saveData();
    Object.assign(originalData, JSON.parse(currentData));
  }
}, 1000);

