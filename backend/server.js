// Root backend loader for the MongoDB-powered server.
// If you start the backend with `node server.js`, this will load the MongoDB Express app from src/server.js.
require('dotenv').config();

const path = require('path');
const appPath = path.join(__dirname, 'src', 'server.js');

console.log(`Loading backend server from ${appPath}`);
require(appPath);
