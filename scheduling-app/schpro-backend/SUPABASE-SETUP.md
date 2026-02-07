# Supabase Setup Guide for SchedulePro

Follow these steps to set up your Supabase database.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click **"Sign up"** or **"Sign in"** if you have an account
3. Click **"New Project"**
4. Fill in the form:
   - **Name**: `SchedulePro` (or your preferred name)
   - **Database Password**: Create a strong password and **SAVE IT**
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Select **Free** (sufficient for MVP)
5. Click **"Create new project"**
6. ⏳ Wait 2-3 minutes for your project to initialize

## Step 2: Get Your API Credentials

Once your project is ready:

1. In the left sidebar, click the **Settings** icon (⚙️)
2. Click **"API"**
3. You'll see these credentials:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```

### API Keys

**anon public** (safe to use in frontend):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**service_role** (⚠️ KEEP SECRET - server only):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Click "Reveal" to see the full key)*

### Update Your .env File

Open `schpro-backend/.env` and replace the placeholder values:

```env
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

## Step 3: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor** (</> icon in sidebar)
2. Click **"New query"**
3. Open the file `schpro-backend/database-schema.sql` in your code editor
4. **Copy ALL the SQL** (2900+ lines)
5. **Paste** it into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. ✅ You should see: `Success. No rows returned`

### What This Creates

The SQL creates:
- ✅ 8 tables (companies, people, vehicles, equipment, bookings, 3 junction tables)
- ✅ All indexes for performance
- ✅ Row Level Security (RLS) policies for multi-tenancy
- ✅ Foreign key constraints
- ✅ Unique constraints (email, license plates, serial numbers)

## Step 4: Enable Email Authentication

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Make sure **Email** is enabled (it should be by default)
3. For MVP, you can disable email confirmation:
   - Go to **Authentication** > **Settings**
   - Find **"Enable email confirmations"**
   - Toggle it OFF (we can enable it later for production)

## Step 5: Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - ✅ companies
   - ✅ people
   - ✅ vehicles
   - ✅ equipment
   - ✅ bookings
   - ✅ booking_people
   - ✅ booking_vehicles
   - ✅ booking_equipment

3. Click on any table to see its columns and structure

## Step 6: Test the Connection

In your terminal, run:

```bash
cd schpro-backend
npm run dev
```

You should see:
```
🚀 SchedulePro API server running on http://localhost:3000
📊 Health check: http://localhost:3000/health
```

Visit `http://localhost:3000/health` in your browser. If you see:
```json
{
  "status": "ok",
  "message": "SchedulePro API is running",
  "timestamp": "2026-02-05T..."
}
```

**✅ You're all set!** The backend is connected to Supabase.

## Troubleshooting

### Error: "Missing Supabase environment variables"

- Make sure you updated the `.env` file with your real credentials
- Restart the server after updating `.env`

### Error: "relation 'companies' does not exist"

- The SQL didn't run successfully in Supabase
- Go back to SQL Editor and run the schema again
- Check for any error messages in the SQL Editor output

### Error: "Invalid API key"

- Double-check you copied the entire key (they're very long)
- Make sure you used `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)
- Try regenerating the keys in Supabase Settings > API

## Next Steps

Once Supabase is set up:
1. ✅ Database schema created
2. ✅ API credentials configured
3. ✅ Server connects to Supabase
4. 🚀 Ready to build authentication endpoints!

---

**Need help?** Check the Supabase docs: https://supabase.com/docs
