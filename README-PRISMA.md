# 🚀 SOULPATH Prisma Database Setup

## 📋 Overview

This guide will help you set up your SOULPATH database using Prisma with Supabase. Prisma provides a type-safe database client and schema management for your Next.js application.

## 🎯 What You'll Get

- ✅ **Complete database schema** with all necessary tables
- ✅ **Type-safe database client** for your Next.js app
- ✅ **Initial data seeding** with default content
- ✅ **Multi-language support** (English/Spanish)
- ✅ **Admin dashboard** that works without errors

## 🔧 Prerequisites

- ✅ Node.js and npm installed
- ✅ Supabase project with database access
- ✅ Your `.env.local` file with Supabase credentials

## 📁 Files Created

```
prisma/
├── schema.prisma          # Database schema definition
└── seed.ts               # Initial data seeding script

setup-database.sh         # Unix/Mac setup script
setup-database.bat        # Windows setup script
setup-prisma.md           # This guide
```

## 🚀 Quick Setup (Choose Your Platform)

### **macOS/Linux:**
```bash
./setup-database.sh
```

### **Windows:**
```cmd
setup-database.bat
```

### **Manual Setup:**
```bash
# 1. Add DATABASE_URL to .env.local
# 2. Generate Prisma client
npm run db:generate

# 3. Push schema to database
npm run db:push

# 4. Seed initial data
npm run db:seed
```

## 🔑 Environment Setup

### **1. Get Your Database Password**
1. Go to [supabase.com](https://supabase.com)
2. Open your SOULPATH project
3. Go to **Settings** → **Database**
4. Copy the **Database Password**

### **2. Add to .env.local**
```bash
# Add this line to your .env.local file
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.hwxrstqeuouefyrwjsjt.supabase.co:5432/postgres"
```

**Replace `[YOUR-PASSWORD]` with your actual database password**

## 🗄️ Database Schema

### **Core Tables:**
- **`profiles`** - User profiles and authentication
- **`email_config`** - SMTP and email settings
- **`email_templates`** - Email templates (EN/ES)
- **`content`** - Website content (EN/ES)
- **`logo_settings`** - Logo and branding
- **`seo`** - SEO metadata
- **`schedules`** - Business hours
- **`clients`** - Client management
- **`bookings`** - Appointment scheduling
- **`images`** - Image management
- **`profile_images`** - Profile photos

### **Features:**
- ✅ **Multi-language support** (English/Spanish)
- ✅ **Proper relationships** between tables
- ✅ **Default values** for all content
- ✅ **Timestamps** for tracking changes
- ✅ **Row Level Security** ready for Supabase

## 📊 Available Commands

```bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed initial data
npm run db:studio      # Open Prisma Studio
npm run db:pull        # Pull schema from database

# Development
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server
```

## 🌱 Initial Data

The seed script creates:
- **Email configuration** with Gmail SMTP settings
- **Email templates** in English and Spanish
- **Website content** with default text
- **Logo settings** with "SOULPATH" text
- **SEO settings** with wellness keywords
- **Business schedule** (Monday 9AM-5PM)
- **Test client** and **test booking**
- **Admin profile** for existing users
- **Profile image** for hero section

## 🔍 Troubleshooting

### **Connection Error:**
```bash
# Test database connection
npm run db:pull
```

**Common issues:**
- ❌ **Wrong password** in DATABASE_URL
- ❌ **Network restrictions** blocking connection
- ❌ **Database not accessible** from your IP

### **Permission Error:**
- Ensure your Supabase service role key has full access
- Check if RLS policies are properly configured

### **Table Already Exists:**
```bash
# Reset database (⚠️ WARNING: Deletes all data)
npx prisma db push --force-reset
```

### **Seed Script Errors:**
```bash
# Check if tables exist
npm run db:studio

# Re-run seed
npm run db:seed
```

## 🎉 After Successful Setup

1. **Test admin dashboard** - should work without 500 errors
2. **Create real content** through the admin interface
3. **Upload images** and configure branding
4. **Set up email templates** for notifications
5. **Add real clients** and bookings

## 🔧 Integration with Your App

### **Using Prisma Client:**
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Example: Get all content
const content = await prisma.content.findFirst()

// Example: Update logo
await prisma.logoSettings.update({
  where: { id: 1 },
  data: { text: 'New Logo Text' }
})
```

### **Replacing Supabase Calls:**
You can gradually replace Supabase client calls with Prisma for better type safety and performance.

## 📞 Need Help?

- **Prisma Docs**: [pris.ly/docs](https://pris.ly/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Prisma Discord**: [pris.ly/discord](https://pris.ly/discord)

## 🎯 Next Steps

1. **Run the setup script** for your platform
2. **Test the admin dashboard** login
3. **Customize content** through the admin interface
4. **Add real data** for your business
5. **Deploy to production** when ready

---

**Happy coding! 🚀**

Your SOULPATH application will now have a robust, type-safe database that works perfectly with your admin dashboard.
