# Vercel Deployment Guide

This guide walks you through deploying the SchedulePro frontend to Vercel.

---

## Prerequisites

- Vercel account (free tier works)
- GitHub repository with your code pushed
- Backend deployed to Render (or another hosting service)

---

## Step 1: Create New Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the repository (e.g., `ai-coding` or `scheduling-app`)
5. Configure the project:

### Framework Preset
- **Framework**: Vite
- Vercel should auto-detect this

### Build Settings
- **Root Directory**: `schpro-frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Project Name
- Choose a name (e.g., `schedulepro` or `schedulepro-frontend`)
- This will be your subdomain: `schedulepro.vercel.app`

---

## Step 2: Configure Environment Variables

**BEFORE deploying**, add environment variables:

1. In the deployment configuration screen, scroll to **"Environment Variables"**
2. Add the following:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` | Production, Preview, Development |
| `VITE_APP_NAME` | `SchedulePro` | Production, Preview, Development |

**Important Notes:**
- Replace `https://your-backend.onrender.com` with your actual Render backend URL
- Make sure to include `/api` at the end of the URL
- The URL should start with `https://` (not `http://`)
- Don't include a trailing slash after `/api`

### Where to Find Your Render Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click your backend service
3. Copy the URL at the top (e.g., `https://schedulepro-backend.onrender.com`)
4. Add `/api` to it: `https://schedulepro-backend.onrender.com/api`

---

## Step 3: Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Deploy to CDN
3. Wait 1-3 minutes for deployment to complete
4. You'll get a URL like: `https://schedulepro.vercel.app`

---

## Step 4: Update Backend CORS

Your backend needs to allow requests from the Vercel URL.

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click your backend service
3. Go to **Environment** tab
4. Update `FRONTEND_URL`:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://schedulepro.vercel.app` (your Vercel URL)
5. Save changes
6. Backend will automatically redeploy

---

## Step 5: Verify Deployment

Test your deployment:

1. **Open your Vercel URL** in a browser
2. **Test login/registration:**
   - Should see login page
   - Register a new account
   - Login with credentials
3. **Test data operations:**
   - Create a person
   - Edit a person
   - Delete/restore a person
4. **Check browser console** for any errors

---

## Managing Environment Variables (After Deployment)

To update environment variables later:

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Add/Edit/Delete variables
5. **Important:** After changing environment variables:
   - Go to **Deployments** tab
   - Click three dots on latest deployment
   - Click **"Redeploy"**
   - Changes only take effect after redeployment

---

## Auto-Deploy on Git Push

Vercel automatically deploys when you push to Git:

### Production Deployments
- Push to `main` branch triggers production deployment
- Updates `https://schedulepro.vercel.app`

### Preview Deployments
- Push to any other branch triggers preview deployment
- Get unique URL for testing (e.g., `https://schedulepro-git-feature-branch.vercel.app`)

### Pull Request Deployments
- Every PR gets its own deployment
- Preview changes before merging

**To deploy:**
```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will detect the push and deploy automatically.

---

## Custom Domain (Optional)

Add your own domain:

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Click **"Add"**
4. Enter your domain (e.g., `schedulepro.com`)
5. Follow DNS configuration instructions
6. Vercel provides automatic HTTPS

**After adding custom domain:**
- Update Render backend `FRONTEND_URL` to your custom domain
- Redeploy backend

---

## Local Development vs Production

### Local Development (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Production (Vercel Environment Variables)
```
VITE_API_BASE_URL=https://schedulepro-backend.onrender.com/api
```

**Important:**
- `.env` file is for **local development only**
- `.env` is in `.gitignore` and **NOT** deployed to Vercel
- Vercel uses **environment variables** set in dashboard
- Never commit `.env` to Git (contains local config only)

---

## Troubleshooting

### Issue: "Failed to load resource: net::ERR_FAILED"

**Problem:** API calls failing

**Solutions:**
1. Check `VITE_API_BASE_URL` is correct in Vercel dashboard
2. Verify backend URL includes `/api` at the end
3. Make sure backend `FRONTEND_URL` matches your Vercel URL exactly
4. Redeploy after changing environment variables

### Issue: CORS errors

**Problem:** "Access to fetch at '...' has been blocked by CORS policy"

**Solutions:**
1. Verify backend `FRONTEND_URL` in Render matches your Vercel URL
2. Check for trailing slashes - should not have one
3. Ensure HTTPS (not HTTP) in production URLs
4. Redeploy backend after updating `FRONTEND_URL`

### Issue: 401 Unauthorized errors

**Problem:** Authentication failing

**Solutions:**
1. Clear browser localStorage: `localStorage.clear()`
2. Refresh and login again
3. Check backend API is running: `https://your-backend.onrender.com/health`
4. Verify Supabase credentials are correct in backend

### Issue: Build fails on Vercel

**Problem:** "Build failed" error

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify `Root Directory` is set to `schpro-frontend`
3. Ensure `package.json` has build script: `"build": "vite build"`
4. Check for missing dependencies: `npm install` locally first

### Issue: Changes not appearing after push

**Problem:** Code updated but site shows old version

**Solutions:**
1. Wait 2-3 minutes for deployment to complete
2. Check deployment status in Vercel dashboard
3. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Clear browser cache
5. Check if deployment succeeded or failed in dashboard

### Issue: Environment variables not working

**Problem:** `import.meta.env.VITE_API_BASE_URL` is undefined

**Solutions:**
1. Environment variables must start with `VITE_` prefix
2. Redeploy after adding/changing variables
3. Check variable is set for correct environment (Production/Preview)
4. Verify no typos in variable name

---

## Vercel Free Tier Limits

- ✅ 100 GB bandwidth/month
- ✅ Unlimited websites
- ✅ Automatic HTTPS
- ✅ CDN (global edge network)
- ✅ Automatic deployments from Git
- ✅ Preview deployments for PRs
- ⚠️ 6000 build minutes/month (100 hours)
- ⚠️ 100 GB-hours serverless function execution

**Note:** Static sites (like this React app) don't count toward function execution time.

---

## Monitoring & Analytics

### View Deployments

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. See all deployments with:
   - Build logs
   - Deployment time
   - Commit message
   - Preview URL

### View Logs

1. Click any deployment
2. See **Build Logs** for build process
3. See **Function Logs** for runtime errors (if using serverless functions)

### Analytics (Pro Plan)

- Real-time visitor analytics
- Performance metrics
- Core Web Vitals

---

## Branch Deployments Strategy

### Recommended Setup

**Main Branch (`main`):**
- Production deployments
- URL: `https://schedulepro.vercel.app`
- Connected to production backend

**Feature Branches:**
- Preview deployments
- URL: `https://schedulepro-git-feature-name.vercel.app`
- Can use same backend or staging backend

**To use different backends for production vs preview:**
1. Set environment variable for specific environments
2. Production: `VITE_API_BASE_URL=https://schedulepro-backend.onrender.com/api`
3. Preview: `VITE_API_BASE_URL=https://schedulepro-backend-staging.onrender.com/api`

---

## Rollback Deployments

If a deployment breaks:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Find a previous working deployment
3. Click three dots → **"Promote to Production"**
4. Instantly rollback to previous version

---

## Performance Optimization

### Already Optimized (Vite defaults)

- ✅ Code splitting
- ✅ Asset minification
- ✅ Tree shaking
- ✅ Gzip compression
- ✅ CDN distribution

### Additional Optimizations

**Enable Speed Insights (Vercel Pro):**
1. Settings → Speed Insights → Enable
2. Monitor Core Web Vitals

**Caching:**
- Vercel automatically caches static assets
- Cache headers configured by Vite

---

## Security Best Practices

1. ✅ **Never commit `.env` to Git**
   - Already in `.gitignore`
   - Contains local development config only

2. ✅ **Use HTTPS URLs in production**
   - Vercel provides automatic HTTPS
   - Always use `https://` for backend URL

3. ✅ **Keep dependencies updated**
   ```bash
   npm outdated
   npm update
   ```

4. ✅ **Review preview deployments before merging**
   - Test changes on preview URL
   - Check for security vulnerabilities

---

## Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Update backend CORS to allow Vercel URL
3. ✅ Test authentication flow
4. ⏳ Set up custom domain (optional)
5. ⏳ Configure staging environment (optional)
6. ⏳ Set up CI/CD tests (optional)

---

## Support

**Vercel Docs:** https://vercel.com/docs
**Vite Docs:** https://vitejs.dev/guide/

**Common Commands:**

```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Deploy from command line
vercel

# Production deployment
vercel --prod

# View logs
vercel logs

# List projects
vercel ls
```

---

*Last Updated: February 7, 2026*
