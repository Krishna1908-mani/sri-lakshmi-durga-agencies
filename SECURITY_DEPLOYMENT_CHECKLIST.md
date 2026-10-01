# Security & Secret Rotation Checklist: Sri Lakshmi Durga Agencies

This document outlines essential security practices and step-by-step procedures for rotating sensitive credentials before launching the website to the public.

---

## 1. Secrets That Must NEVER Be Exposed

Verify that the following secrets exist **ONLY** in backend server environment variables (Render Dashboard) and **NEVER** in frontend files, Git repositories, or client bundles:

1. `SUPABASE_SECRET_KEY` (service_role key)
2. `RAZORPAY_KEY_SECRET`
3. `JWT_SECRET`
4. `EMAIL_PASS` (Gmail app password)

---

## 2. Pre-Launch Credential Rotation Procedure

If any test or development credentials were used across multiple environments during development, rotate them prior to public launch using this sequence:

### A. Rotate Supabase Service Role Key
1. Go to **Supabase Dashboard** -> **Project Settings** -> **API**.
2. Scroll to **Project API keys**.
3. Next to `service_role` (secret), click **Rotate key** (or generate replacement).
4. Update `SUPABASE_SECRET_KEY` in your **Render Environment Variables**.
5. Restart / redeploy the Render Web Service.
6. Verify products, users, and orders load properly.

### B. Generate a Strong Production JWT Secret
1. Generate a random 64-character secret in your terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `JWT_SECRET` in **Render Environment Variables**.
3. Redeploy the backend. Existing sessions will prompt users to re-login with their credentials.

### C. Switch Razorpay from Test Mode to Live Mode
1. In your **Razorpay Dashboard**, complete business KYC verification.
2. Toggle the dashboard switch from **Test Mode** to **Live Mode**.
3. Navigate to **Account & Settings** -> **API Keys** -> **Generate Key**.
4. Update in Render:
   - `RAZORPAY_KEY_ID = rzp_live_xxxxxxxx`
   - `RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxx`
5. Update in Vercel:
   - `VITE_RAZORPAY_KEY_ID = rzp_live_xxxxxxxx`
6. Redeploy both services.

### D. Verify Dedicated Notification Email
1. Use a dedicated Google Account for store notifications (e.g. `orders@srilakshmidurga.com` or `srilakshmidurgaagencies@gmail.com`).
2. Enable 2-Step Verification on the Google account.
3. Generate a new **App Password** (16 characters) specifically for Render.
4. Set `EMAIL_USER` and `EMAIL_PASS` in Render.

---

## 3. Production Security Checklist

- [x] **Row Level Security (RLS)**: Enabled on `products`, `home_banners`, `coupons`, `users`, and `orders`.
- [x] **Service Role Access**: Sensitive tables (`users`, `orders`, `coupons`) restricted to server-side `service_role`.
- [x] **Rate Limiting**: General API rate limiting (300 req / 15 min) and authentication rate limiting (25 req / 15 min) active via `express-rate-limit`.
- [x] **Security Headers**: Production HTTP security headers active via `helmet`.
- [x] **CORS Policy**: Configured to accept only specified `FRONTEND_URL` origins with credentials in production.
- [x] **Payment Verification**: Server-side HMAC SHA-256 signature verification enforced before creating orders.
- [x] **Storage Safeguards**: Uploads restricted to protected admin endpoints with MIME validation and 10MB limits.
- [x] **Error Shielding**: Stack traces and internal error payloads suppressed from production HTTP responses.
