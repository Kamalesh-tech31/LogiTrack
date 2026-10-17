require('dotenv').config();
const connectDB = require('./src/config/db');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Order = require('./src/models/Order');

(async () => {
  try {
    await connectDB();
    const uid = '6a2bd7fde6b62137954100af';
    const user = await User.findById(uid).lean();
    console.log('USER FOUND:', !!user);
    if (user) console.log('USER:', JSON.stringify(user, null, 2));

    const orders = await Order.find().sort({ createdAt: -1 }).limit(10).lean();
    console.log('ORDERS COUNT:', orders.length);
    orders.forEach((o, idx) => {
      console.log(`ORDER ${idx}:`, o.orderId, o.customerName, o.totalPrice, o.status);
    });
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    mongoose.connection.close();
  }
})();
