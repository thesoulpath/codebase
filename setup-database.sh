#!/bin/bash

echo "🚀 SOULPATH Database Setup Script"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials first."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env.local; then
    echo "⚠️  Warning: DATABASE_URL not found in .env.local"
    echo "Please add your Supabase database URL to .env.local:"
    echo ""
    echo "DATABASE_URL=\"postgresql://postgres:[YOUR-PASSWORD]@db.hwxrstqeuouefyrwjsjt.supabase.co:5432/postgres\""
    echo ""
    echo "Replace [YOUR-PASSWORD] with your Supabase database password"
    echo ""
    read -p "Press Enter to continue after adding DATABASE_URL..."
fi

echo "🔧 Step 1: Generating Prisma client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated successfully"
echo ""

echo "🗄️  Step 2: Pushing schema to database..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema to database"
    echo "This might be due to:"
    echo "  - Incorrect DATABASE_URL"
    echo "  - Database connection issues"
    echo "  - Permission problems"
    echo ""
    echo "Please check your .env.local file and try again"
    exit 1
fi

echo "✅ Database schema pushed successfully"
echo ""

echo "🌱 Step 3: Seeding database with initial data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    echo "This might be due to:"
    echo "  - Tables not created properly"
    echo "  - Data insertion errors"
    echo ""
    echo "Please check the error messages above"
    exit 1
fi

echo "✅ Database seeded successfully"
echo ""

echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to http://localhost:3000"
echo "2. Click Login button"
echo "3. Use admin2@soulpath.lat / Admin456!@#"
echo "4. Your admin dashboard should now work perfectly!"
echo ""
echo "🔍 Optional: View your database with Prisma Studio"
echo "   npm run db:studio"
echo ""

echo "🚀 Happy coding!"
