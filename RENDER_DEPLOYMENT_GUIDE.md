# 🚀 WasteSense Render Deployment Guide

## 📋 Pre-Deployment Checklist
- ✅ Code pushed to GitHub
- ✅ YOLO API already deployed at `waste-sense-api.onrender.com`
- ✅ LLM detection ready (needs OpenAI API key)
- 🔄 Ready to deploy remaining 4 services

---

## 🎯 **Step 1: Create Render Account & Connect GitHub**

1. Go to **[render.com](https://render.com)** and sign up
2. Click **"New +"** → **"Connect a repository"**
3. Connect your GitHub account
4. Select your **wastesense-app** repository

---

## 🗄️ **Step 2: Deploy PostgreSQL Database**

1. Click **"New +"** → **"PostgreSQL"**
2. **Settings**:
   ```
   Name: wastesense-db
   Database: wastesense
   User: wastesense_user
   Region: US East (Ohio) - closest to Ghana
   Plan: Free ($0/month)
   ```
3. Click **"Create Database"**
4. **📝 COPY the External Database URL** - you'll need this!

---

## 🖥️ **Step 3: Deploy Backend API**

1. Click **"New +"** → **"Web Service"**
2. Select your **wastesense-app** repository
3. **Settings**:
   ```
   Name: wastesense-backend
   Region: US East (Ohio)
   Branch: main
   Runtime: Node
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm start
   Plan: Free ($0/month)
   ```

4. **Environment Variables** (click "Advanced"):
   ```
   DATABASE_URL=postgresql://[paste-your-db-url-here]
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=wastesense-super-secure-jwt-secret-key-32chars
   YOLO_API_URL=https://waste-sense-api.onrender.com
   OPENAI_API_KEY=your-openai-api-key-here
   CORS_ORIGINS=https://wastesense-frontend.onrender.com
   ```

5. Click **"Create Web Service"**

---

## 🤖 **Step 4: Deploy ML Forecasting Service**

1. Click **"New +"** → **"Web Service"**
2. Select your **wastesense-app** repository
3. **Settings**:
   ```
   Name: wastesense-ml-forecasting
   Region: US East (Ohio)
   Branch: main
   Runtime: Python 3
   Root Directory: ml_service
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   Plan: Free ($0/month)
   ```

4. **Environment Variables**:
   ```
   PORT=8000
   ENVIRONMENT=production
   ```

5. Click **"Create Web Service"**

---

## 🌐 **Step 5: Deploy Frontend**

1. Click **"New +"** → **"Static Site"**
2. Select your **wastesense-app** repository
3. **Settings**:
   ```
   Name: wastesense-frontend
   Branch: main
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Environment Variables**:
   ```
   VITE_API_URL=https://wastesense-backend.onrender.com/api
   VITE_ML_SERVICE_URL=https://wastesense-ml-forecasting.onrender.com
   VITE_YOLO_API_URL=https://waste-sense-api.onrender.com
   ```

5. Click **"Create Static Site"**

---

## 🔧 **Step 6: Update Backend Environment Variables**

Once your ML service is deployed, update the backend:

1. Go to **wastesense-backend** service
2. Go to **Environment** tab
3. **Add**:
   ```
   ML_SERVICE_URL=https://wastesense-ml-forecasting.onrender.com
   ```

---

## 🗃️ **Step 7: Run Database Migrations**

1. Go to your **wastesense-backend** service
2. Go to **Shell** tab (or use logs)
3. Run:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

---

## 🧪 **Step 8: Test Your Deployment**

### Test URLs:
```bash
# Frontend
https://wastesense-frontend.onrender.com

# Backend API Health
https://wastesense-backend.onrender.com/health

# Backend Config
https://wastesense-backend.onrender.com/api/auth/config

# ML Forecasting
https://wastesense-ml-forecasting.onrender.com/forecast/next-day

# YOLO API (already deployed)
https://waste-sense-api.onrender.com/docs
```

### Test the Complete Flow:
1. **Visit frontend** → Login as dispatcher
2. **Upload waste image** → Test both YOLO and LLM detection
3. **Check resident dashboard** → Verify reports work
4. **Check recycler insights** → Verify forecasting works

---

## 🔑 **Step 9: Get OpenAI API Key (for LLM Detection)**

1. Go to **[platform.openai.com](https://platform.openai.com)**
2. Create account and get API key
3. Add to backend environment variables:
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

---

## ⚠️ **Important Notes**

### Free Tier Limitations:
- **Services sleep after 15 minutes** of inactivity
- **750 hours/month** total across all services
- **First request may be slow** (cold start)

### Production Considerations:
- Upgrade to **paid plans** for 24/7 uptime
- Consider **custom domain** for professional look
- Set up **monitoring** and **alerts**

---

## 🔧 **Troubleshooting**

### Common Issues:

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure database is running

2. **Frontend Can't Connect to Backend**
   - Verify VITE_API_URL is correct
   - Check CORS_ORIGINS setting

3. **ML Service Out of Memory**
   - Upgrade to paid plan
   - Optimize model loading

4. **YOLO Detection Fails**
   - Check if waste-sense-api.onrender.com is up
   - Verify image upload size limits

---

## 🎉 **Your Live URLs**

After deployment, you'll have:

```
🌐 Frontend: https://wastesense-frontend.onrender.com
🔧 Backend: https://wastesense-backend.onrender.com
🤖 ML Service: https://wastesense-ml-forecasting.onrender.com
🗄️ Database: [render-managed-postgresql]
👁️ YOLO API: https://waste-sense-api.onrender.com (already live)
```

---

## 📱 **Share with Ghana Users**

Once deployed, share this URL with users in Ghana:
**https://wastesense-frontend.onrender.com**

### Default Login Credentials:
```
Dispatcher: dispatcher@example.com / password
Recycler: recycler@example.com / password
Resident: resident@example.com / password
```

---

## 🎯 **Next Steps**

1. **Deploy all services** following this guide
2. **Test thoroughly** with real waste images
3. **Share with Ghana users** for feedback
4. **Monitor performance** and optimize
5. **Consider upgrading** to paid plans for production

---

**🚀 Your WasteSense application will be live and ready for Ghana users!** 