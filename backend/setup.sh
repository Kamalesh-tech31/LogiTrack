#!/bin/bash
# Setup script for MongoDB migration

echo "🚀 Devfusion Backend - MongoDB Migration Setup"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed. Please check your Node.js installation."
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your MongoDB URI."
else
    echo "✅ .env file already exists."
fi

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env with your MongoDB connection string"
echo "2. Start MongoDB:"
echo "   - Local: mongod"
echo "   - Cloud: Use MongoDB Atlas connection string"
echo "3. Run the server: npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - MIGRATION_GUIDE.md - Complete migration guide"
echo "   - MONGODB_SETUP.md - MongoDB setup instructions"
echo "   - MIGRATION_SUMMARY.md - Summary of changes"
echo ""
