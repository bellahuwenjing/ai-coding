# Render.com Deployment Guide

This guide walks you through deploying the SchedulePro backend API to Render.com.

---

## Prerequisites

- Render.com account (free tier works)
- GitHub repository with your code pushed
- Supabase project set up with database schema applied

---

## Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `scheduling-app` repository
5. Configure the service:
   - **Name**: `schedulepro-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `schpro-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

---

## Step 2: Configure Environment Variables

In the Render dashboard, go to **Environment** tab and add these variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | (leave blank) | Render sets this automatically |
| `SUPABASE_URL` | `https://uflzwrlszgoydiopvfuk.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | Copy from `schpro-backend/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Copy from `schpro-backend/.env` |
| `FRONTEND_URL` | `http://localhost:5173` | Change to production frontend URL after deploying frontend |

### Where to Find Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" first)

---

## Step 3: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Start the server with `npm start`
3. Wait for deployment to complete (usually 2-3 minutes)
4. You'll get a URL like: `https://schedulepro-backend.onrender.com`

---

## Step 4: Verify Deployment

Test your API is working:

```bash
# Health check
curl https://schedulepro-backend.onrender.com/health

# Should return:
# {"status":"ok","message":"SchedulePro API is running","timestamp":"..."}
```

---

## Step 5: Update Frontend Configuration

Once backend is deployed, update your frontend to use the production API:

**Local Development** (`schpro-frontend/.env`):
```env
VITE_API_BASE_URL=https://schedulepro-backend.onrender.com/api
```

**For Frontend Deployment** (Vercel/Netlify):
Set environment variable:
```
VITE_API_BASE_URL=https://schedulepro-backend.onrender.com/api
```

---

## Step 6: Update CORS Configuration

After deploying your frontend, update the `FRONTEND_URL` environment variable in Render:

1. Go to Render Dashboard → Your Service → **Environment**
2. Edit `FRONTEND_URL` to your production frontend URL:
   - Vercel: `https://yourapp.vercel.app`
   - Netlify: `https://yourapp.netlify.app`
   - Custom domain: `https://yourdomain.com`
3. Save changes
4. Render will automatically redeploy with new CORS settings

---

## Common Issues & Solutions

### Issue: "Route not found" errors

**Solution:** Make sure `Root Directory` is set to `schpro-backend` in Render settings.

### Issue: "Missing Supabase environment variables"

**Solution:** Double-check all environment variables are set correctly in Render dashboard. Restart the service after adding them.

### Issue: CORS errors from frontend

**Solution:**
1. Verify `FRONTEND_URL` matches your exact frontend URL (including `https://` and no trailing slash)
2. Redeploy the backend after updating `FRONTEND_URL`

### Issue: 502 Bad Gateway

**Solution:**
1. Check Render logs for errors
2. Verify your Supabase credentials are correct
3. Ensure Supabase project is not paused (free tier pauses after inactivity)

### Issue: Cold starts (Free tier)

**Behavior:** Free tier services spin down after 15 minutes of inactivity. First request after inactivity takes 30-60 seconds.

**Solution:**
- Upgrade to paid tier for 24/7 availability
- Or accept the cold start delay for MVP/testing

---

## Render Free Tier Limits

- ✅ 750 hours/month (enough for one service running 24/7)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Auto-deploy on git push
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ Limited to 512 MB RAM

---

## Monitoring & Logs

**View Logs:**
1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab
3. See real-time logs of your application

**Metrics:**
- Go to **"Metrics"** tab to see:
  - CPU usage
  - Memory usage
  - Request volume

---

## Auto-Deploy

Render automatically deploys when you push to the configured branch:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render will detect the push and redeploy automatically.

---

## Next Steps

1. ✅ Deploy backend to Render
2. ⏳ Deploy frontend to Vercel/Netlify
3. ⏳ Update `FRONTEND_URL` in Render with production frontend URL
4. ⏳ Test full authentication flow
5. ⏳ Set up custom domain (optional)

---

## Support

**Render Docs:** https://render.com/docs
**Supabase Docs:** https://supabase.com/docs

**Common Commands:**

```bash
# View logs
render logs

# Restart service (if Render CLI installed)
render services restart schedulepro-backend

# Manual redeploy
# Go to Render Dashboard → Service → Manual Deploy → "Clear build cache & deploy"
```

---

*Last Updated: February 6, 2026*
