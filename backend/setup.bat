@echo off
REM Setup script for MongoDB migration on Windows

echo.
echo 🚀 Devfusion Backend - MongoDB Migration Setup
echo ==================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ npm install failed. Please check your Node.js installation.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ✅ .env file created. Please update it with your MongoDB URI.
) else (
    echo ✅ .env file already exists.
)

echo.
echo ==================================================
echo ✅ Setup Complete!
echo.
echo 📋 Next Steps:
echo 1. Update .env with your MongoDB connection string
echo 2. Start MongoDB:
echo    - Local: mongod
echo    - Cloud: Use MongoDB Atlas connection string
echo 3. Run the server: npm run dev
echo.
echo 📚 Documentation:
echo    - MIGRATION_GUIDE.md - Complete migration guide
echo    - MONGODB_SETUP.md - MongoDB setup instructions
echo    - MIGRATION_SUMMARY.md - Summary of changes
echo.
pause
