# Deployment Guide: Sri Lakshmi Durga Agencies

This guide provides step-by-step instructions to deploy the full-stack application to **Render** (Backend API) and **Vercel** (Frontend Storefront & Admin), backed by **Supabase PostgreSQL & Storage**.

---

## Architecture Overview

```text
Storefront / Admin Customers
             ↓
    Vercel (React + Vite SPA)
             ↓  (VITE_API_URL)
     Render (Node.js + Express)
             ↓
    Supabase PostgreSQL & Storage
```

---

## 1. Prerequisites

Before starting, ensure you have accounts on:
1. [GitHub](https://github.com)
2. [Render](https://render.com)
3. [Vercel](https://vercel.com)
4. [Supabase](https://supabase.com)
5. [Razorpay Dashboard](https://dashboard.razorpay.com)

---

## 2. Step 1: Push Latest Changes to GitHub

Ensure all `.env` files are ignored (only `.env.example` should be tracked).

```bash
git status
git add .
git commit -m "Prepare production deployment configurations"
git push origin main
```

---

## 3. Step 2: Deploy Backend to Render

1. Log into your **[Render Dashboard](https://dashboard.render.com)**.
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository: `sri-lakshmi-durga-agencies`.
4. Configure the Web Service settings:
   - **Name**: `sri-lakshmi-durga-backend` (or your choice)
   - **Region**: Singapore or Frankfurt (choose nearest to your users)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Advanced** -> **Health Check Path** and set:
   ```text
   /api/health
   ```
6. Add the following **Environment Variables** (under "Environment"):

| Key | Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` *(Render sets this automatically, but you can define it)* |
| `SUPABASE_URL` | Your Supabase Project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_SECRET_KEY` | Your Supabase Secret / `service_role` key |
| `JWT_SECRET` | A secure random 32+ character string |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID (`rzp_test_...` or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |
| `EMAIL_USER` | Your notification Gmail address |
| `EMAIL_PASS` | Gmail 16-character App Password |
| `ADMIN_EMAIL` | Admin receiver email for order alerts |
| `FRONTEND_URL` | Leave empty for now, or set to your temporary localhost. You will set this to your Vercel URL in Step 5. |

7. Click **Create Web Service**.
8. Wait for the build to complete. Once deployed, copy your Render backend URL:
   ```text
   https://sri-lakshmi-durga-backend.onrender.com
   ```
9. Verify health check in your browser:
   `https://sri-lakshmi-durga-backend.onrender.com/api/health`
   Should return: `{"success": true, "status": "ok", ...}`

---

## 4. Step 3: Deploy Frontend to Vercel

1. Log into your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `sri-lakshmi-durga-agencies`.
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and select **`frontend`**
   - **Build Command**: `npm run build` *(auto-detected)*
   - **Output Directory**: `dist` *(auto-detected)*
5. Expand **Environment Variables** and add the following:

| Key | Value / Description |
| :--- | :--- |
| `VITE_API_URL` | Your Render backend URL with `/api`: `https://sri-lakshmi-durga-backend.onrender.com/api` |
| `VITE_SUPABASE_URL` | Your Supabase Project URL (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Publishable / Anon key |
| `VITE_RAZORPAY_KEY_ID` | Your Razorpay Key ID |

6. Click **Deploy**.
7. Once deployed, Vercel will assign your domain, for example:
   ```text
   https://sri-lakshmi-durga-agencies.vercel.app
   ```

---

## 5. Step 4: Link Frontend URL in Render (CORS)

Now that Vercel has generated your frontend domain:
1. Return to your **Render Dashboard** -> `sri-lakshmi-durga-backend`.
2. Go to **Environment**.
3. Update `FRONTEND_URL`:
   ```text
   https://sri-lakshmi-durga-agencies.vercel.app
   ```
   *(If you also use a custom domain later, separate them with commas, e.g. `https://sri-lakshmi-durga-agencies.vercel.app,https://srilakshmidurga.com`)*
4. Click **Save Changes**. Render will automatically redeploy the backend with the new CORS origin.

---

## 6. Step 5: Verification & Testing

Visit your live Vercel website:
1. **Home Page**: Hero banner and featured products load from Supabase.
2. **Shop Page**: Category filtering, price sorting, search.
3. **Product Details & Reviews**: Ratings and review submission.
4. **Customer Auth**: Register a new account, test login and profile page.
5. **Admin Panel**: Login at `/admin/login`, test adding/editing products, updating banners, and creating coupons.
6. **Checkout Flow**: Add product to cart, apply coupon `WELCOME50`, test Cash on Delivery and Razorpay test payment.
7. **Direct URL Refresh**: Refresh on `/shop`, `/admin/dashboard`, or `/my-orders` to confirm Vercel SPA routing (`vercel.json`) works without 404 errors.
