#!/bin/bash

# Vietnamese QR Code Scanning App - Development Startup Script
echo "🚀 Starting Vietnamese QR Code Scanning App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Angular CLI is installed globally
if ! command -v ng &> /dev/null; then
    echo "📦 Installing Angular CLI globally..."
    npm install -g @angular/cli
fi

# Start the development server
echo "🌐 Starting development server on http://localhost:4200"
echo "📱 QR Scanner will be available at: http://localhost:4200"
echo "🔧 Supabase URL: https://vtwvtrbmgfjhszwajqln.supabase.co"
echo ""
echo "💡 Tips:"
echo "   - Make sure to allow camera access when prompted"
echo "   - Use HTTPS for production deployment"
echo "   - Test with Vietnamese CCCD/VNeID QR codes"
echo ""

ng serve --host 0.0.0.0 --port 4200