# Production Hosting & Deployment Guide

This guide provides step-by-step instructions for deploying your **Attendance Management SaaS** application to production on **Vercel** with **MongoDB Atlas**.

---

## Architecture Overview

- **Framework**: Next.js 15 (App Router, Server Actions, API Routes)
- **Frontend / Backend Hosting**: [Vercel](https://vercel.com) (Serverless / Edge)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Managed Cloud Database)
- **Authentication**: NextAuth.js (JWT Session Strategy)

---

## Prerequisites

Before starting, make sure you have:
1. A **[GitHub](https://github.com/)** account.
2. A free **[Vercel](https://vercel.com/)** account.
3. A free **[MongoDB Atlas](https://www.mongodb.com/atlas)** account.

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

Because Vercel serverless functions do not persist local disk files across invocations, a cloud database is required.

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a new **Free Shared Cluster (M0)**:
   - Provider: **AWS** or your preferred cloud
   - Region: Select a region closest to your users (e.g., `us-east-1` or `eu-west-1`)
3. **Configure Database Access (User Credentials)**:
   - Navigate to **Security** > **Database Access** > **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: e.g., `Attendancedb`
   - Password: Choose or generate a strong password (e.g. `YourStrongPassword123!`).
   - Database User Privileges: **Read and write to any database**.
4. **Configure Network Access (IP Whitelist)**:
   > ⚠️ **IMPORTANT**: Vercel uses dynamic serverless IP addresses.
   - Navigate to **Security** > **Network Access** > **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**.
5. **Get your Connection String**:
   - Go to **Database** > **Clusters** > Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It will look like:
     ```text
     mongodb+srv://Attendancedb:<password>@attendancedb.t56fghx.mongodb.net/Attendancedb?retryWrites=true&w=majority&appName=Attendancedb
     ```
   - Replace `<password>` with your database user password.

---

## Step 2: Push Your Code to GitHub

1. Initialize git in your project directory (if not already done):
   ```bash
   git init
   ```
2. Verify that `.gitignore` is present so `.env.local` is **NOT** tracked:
   ```bash
   git status
   ```
3. Stage and commit all files:
   ```bash
   git add .
   git commit -m "feat: prepare attendance management app for production hosting"
   ```
4. Create a new repository on [GitHub](https://github.com/new) and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/attendance-management-app.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy to Vercel

### Method A: Via Vercel Web Dashboard (Recommended)

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`attendance-management-app`).
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `next build` (leave default)
   - **Output Directory**: `.next` (leave default)
5. Expand the **Environment Variables** section and add the following 4 required variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@<your-cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `NEXTAUTH_SECRET` | `<your-32-byte-secret-key>` | Secret for signing JWT sessions (see below to generate) |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | The production URL assigned by Vercel |
| `NEXT_PUBLIC_APP_URL` | `https://your-app-name.vercel.app` | Public URL used for generating student QR check-in links |
| `SEED_SECRET` | `<optional_custom_secret>` *(optional)* | Secret token to trigger `/api/seed` in production |

> 💡 **Tip for generating `NEXTAUTH_SECRET`:**
> Run this command in any terminal to generate a secure 32-byte base64 string:
> ```bash
> openssl rand -base64 32
> ```
> Or in PowerShell / Node:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

6. Click **Deploy**. Vercel will build and deploy your app in about 1–2 minutes!

---

## Step 4: Seed the Production Database

To populate your MongoDB Atlas cluster with the default Course Representative admin user and sample cohort data:

### Option 1: Run the Seed Script Locally with Atlas URI
1. Open your local `.env.local` file and ensure `MONGODB_URI` points to your MongoDB Atlas cluster.
2. Run the seed script:
   ```bash
   npm run seed
   ```
3. You will see:
   ```text
   Connecting to MongoDB for seeding...
   Creating default Admin user...
   Seeding 20 students...
   Creating 3 sample sessions...
   Database seeded successfully!
   ```

### Option 2: Use the Production Seed API Endpoint
If you configured `SEED_SECRET` in your Vercel Environment Variables, make a POST request (or open in browser) to:
```text
https://your-app-name.vercel.app/api/seed?secret=YOUR_SEED_SECRET
```

---

## Step 5: Log In & Verify

1. Navigate to your deployed production URL: `https://your-app-name.vercel.app`
2. Click **Sign In** (or navigate to `/login`).
3. Enter the default administrator credentials:
   - **Email**: `admin@cohort.edu`
   - **Password**: `Admin123!`
4. Verify the following:
   - **Dashboard**: Check that attendance rate, active sessions, and student counters display accurately.
   - **Sessions**: Open a session, click **Show QR Code**, test **Fullscreen Projector Mode**, and test scanning the QR code on a mobile device.
   - **Check-in Page**: Verify that students can check in via the `/attendance/[slug]` link.
   - **Export**: Test exporting session attendance to `.xlsx` Excel spreadsheets.

---

## Production Maintenance & Security Best Practices

1. **Change Default Admin Password**:
   - Once logged in to the dashboard, update the administrator password or add representative accounts.
2. **Custom Domain**:
   - In Vercel, navigate to **Settings** > **Domains** to add your custom domain (e.g. `attendance.yourdomain.com`).
   - If you change domains, update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` in the Vercel Environment Variables dashboard.
3. **MongoDB Atlas Backups**:
   - Atlas free tier includes basic automated snapshots. For critical cohorts, export data via the app's Excel export feature or enable continuous cloud backups.
