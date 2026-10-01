# Sri Lakshmi Durga Agencies 🛍️

Full-stack E-Commerce Web Application built with React (Vite) + Express.js + MongoDB + Razorpay.

---

## 📁 Project Structure

```text
Sri Lakshmi Durga Agencies/
├── backend/                  # Node.js + Express API Server
│   ├── config/               # Database connection (Mongoose)
│   ├── middleware/           # Auth, file uploads, error handling
│   ├── models/               # MongoDB models (User, Product, Order, etc.)
│   ├── routes/               # Express API endpoints
│   ├── uploads/              # Uploaded product & banner images
│   ├── .env.example          # Sample backend environment variables
│   ├── package.json
│   └── server.js             # Server entry point
├── frontend/                 # React SPA (Vite)
│   ├── public/
│   ├── src/                  # React components, pages, state & API client
│   ├── .env.example          # Sample frontend environment variables
│   ├── package.json
│   └── vite.config.js
├── render.yaml               # Render Blueprint configuration
└── .gitignore                # Git ignore rules for node_modules and secrets
```

---

## 🚀 Deployment to Render

You can deploy both the Backend Web Service and Frontend Static Site onto Render easily using either **Render Blueprints** (recommended) or **Manual Setup**.

### Method 1: Render Blueprint (Automatic 1-Click Setup)

1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository:
   `https://github.com/Krishna1908-mani/sri-lakshmi-durga-agencies`
4. Render will detect [`render.yaml`](file:///d:/Sri%20Lakshmi%20Durga%20Agencies/render.yaml) and create both services:
   - **`sri-lakshmi-durga-backend`** (Web Service)
   - **`sri-lakshmi-durga-frontend`** (Static Site)
5. Fill in the required environment variables (see below) and click **Apply**.

---

### Method 2: Manual Setup on Render

#### Step 1: Deploy Backend Web Service
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `sri-lakshmi-durga-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. In **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ladies_store?retryWrites=true&w=majority` *(MongoDB Atlas)*
   - `FRONTEND_URL`: `https://sri-lakshmi-durga-frontend.onrender.com` *(your frontend Render URL)*
   - `JWT_SECRET`: *(secure secret key)*
   - `RAZORPAY_KEY_ID`: *(your Razorpay Key ID)*
   - `RAZORPAY_KEY_SECRET`: *(your Razorpay Key Secret)*
   - `EMAIL_USER`: *(your Gmail address for notifications)*
   - `EMAIL_PASS`: *(your Gmail 16-character App Password)*
   - `ADMIN_EMAIL`: *(admin recipient email)*
5. Click **Deploy Web Service** and copy your backend URL (e.g., `https://sri-lakshmi-durga-backend.onrender.com`).

#### Step 2: Deploy Frontend Static Site
1. In Render Dashboard, click **New +** > **Static Site**.
2. Connect the same GitHub repository.
3. Configure:
   - **Name**: `sri-lakshmi-durga-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Redirects / Rewrites**:
   - Add rewrite rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://sri-lakshmi-durga-backend.onrender.com/api`
   - `VITE_RAZORPAY_KEY_ID`: *(your Razorpay Key ID)*
6. Click **Deploy Static Site**.

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and adjust variables
cp .env.example .env
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Copy .env.example to .env and adjust variables
cp .env.example .env
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
