// Generate unique booking ID
function generateBookingId() {
  const prefix = 'BK';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// Generate vendor ID
function generateVendorId() {
  const prefix = 'VND';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// Calculate nights between dates
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Validate Sri Lankan phone number
function validatePhoneNumber(phone) {
  const sriLankanPhoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
  return sriLankanPhoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate secure random token
function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Calculate commission based on service type and amount
function calculateCommission(amount, serviceType = 'accommodation') {
  const rates = {
    accommodation: 0.12,
    tour: 0.15,
    transport: 0.08,
    wellness: 0.10
  };
  
  const rate = rates[serviceType] || 0.10;
  return Math.round(amount * rate * 100) / 100;
}

// Format date for Sri Lankan timezone
function formatDateSriLanka(date) {
  return new Date(date).toLocaleDateString('en-LK', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Sanitize user input
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

module.exports = {
  generateBookingId,
  generateVendorId,
  formatCurrency,
  calculateNights,
  validatePhoneNumber,
  validateEmail,
  generateSecureToken,
  calculateCommission,
  formatDateSriLanka,
  sanitizeInput
};