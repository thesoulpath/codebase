# 🚀 Prisma Setup Guide for SOULPATH

## 📋 Prerequisites
- ✅ Prisma installed (`npm install prisma @prisma/client`)
- ✅ Supabase project with database access
- ✅ Your `.env.local` file with Supabase credentials

## 🔧 Step 1: Configure Database URL

Add this to your `.env.local` file:

```bash
# Prisma Database URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.hwxrstqeuouefyrwjsjt.supabase.co:5432/postgres"
```

**Replace `[YOUR-PASSWORD]` with your Supabase database password**

## 🔍 Step 2: Get Your Database Password

1. Go to [supabase.com](https://supabase.com)
2. Open your SOULPATH project
3. Go to **Settings** → **Database**
4. Copy the **Database Password**

## 🗄️ Step 3: Generate Prisma Client

```bash
# Generate Prisma client from schema
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Optional: View your database in Prisma Studio
npx prisma studio
```

## 📊 Step 4: Seed Initial Data

```bash
# Run the seed script
npx prisma db seed
```

## 🔍 Step 5: Verify Tables

```bash
# Check database status
npx prisma db pull

# View schema
npx prisma format
```

## 🎯 What This Schema Creates

### **Core Tables:**
- **`profiles`** - User profiles and roles
- **`email_config`** - SMTP settings
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

## 🚨 Troubleshooting

### **Connection Error:**
```bash
# Test connection
npx prisma db pull
```

### **Permission Error:**
- Ensure your Supabase service role key has full access
- Check if RLS policies are properly configured

### **Table Already Exists:**
```bash
# Reset database (⚠️ WARNING: This deletes all data)
npx prisma db push --force-reset
```

## 🎉 Next Steps

After successful setup:

1. **Test admin dashboard** - should work without 500 errors
2. **Create real content** through the admin interface
3. **Upload images** and configure branding
4. **Set up email templates** for notifications

## 📞 Need Help?

- Check Prisma logs: `npx prisma --help`
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Prisma docs: [pris.ly/docs](https://pris.ly/docs)
