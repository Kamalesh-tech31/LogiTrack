const generateOrderId = () => {
  const prefix = "LT"
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 10000)
  return `${prefix}${timestamp}${random}`
}

const calculateDeliveryDate = (days = 2) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price)
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(phone)
}

module.exports = {
  generateOrderId,
  calculateDeliveryDate,
  formatPrice,
  validateEmail,
  validatePhoneNumber,
}
