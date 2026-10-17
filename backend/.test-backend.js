const http = require('http');

// Test 1: Health check
const testHealthCheck = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('=== HEALTH CHECK ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve();
      });
    }).on('error', (err) => {
      console.error('Health check failed:', err.message);
      resolve();
    });
  });
};

// Test 2: POST to /api/orders
const testOrderAPI = () => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      userId: '60d5ec49c1234567890abcd1',
      items: [
        {
          productId: '60d5ec49c1234567890abcd2',
          quantity: 1,
        }
      ]
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n=== ORDER API TEST ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', data.slice(0, 500));
        resolve();
      });
    }).on('error', (err) => {
      console.error('Order API test failed:', err.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
};

(async () => {
  console.log('Starting backend tests...\n');
  await testHealthCheck();
  await testOrderAPI();
  console.log('\nTests completed');
})();
