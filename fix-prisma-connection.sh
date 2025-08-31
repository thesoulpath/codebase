#!/bin/bash

echo "🔧 Fixing Prisma connection issue for macOS..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Create backup
cp .env.local .env.local.backup
echo "✅ Created backup: .env.local.backup"

# Fix the DATABASE_URL by removing pgbouncer (macOS compatible)
echo "🔍 Current DATABASE_URL:"
grep "DATABASE_URL" .env.local

echo ""
echo "📝 Updating DATABASE_URL to remove pgbouncer..."

# Use sed for macOS (note the empty string after -i)
sed -i '' 's/?pgbouncer=true//' .env.local

echo "✅ Updated DATABASE_URL"
echo "🔍 New DATABASE_URL:"
grep "DATABASE_URL" .env.local

echo ""
echo "🧪 Testing Prisma connection..."
echo "Running: npx prisma db push --accept-data-loss"
echo ""

# Test Prisma
npx prisma db push --accept-data-loss

echo ""
echo "🎯 If Prisma worked, your database schema is now updated!"
echo "💡 If you need to restore the backup: cp .env.local.backup .env.local"
