# 🚀 WasteSense Azure Deployment Guide
## Using GitHub Education Student Pack

### 📋 **Prerequisites**
1. ✅ GitHub Education Pack approved
2. ✅ Azure account with $100 credits (no credit card required)
3. ✅ Azure CLI installed
4. ✅ Your WasteSense repo: `Sadickachuli/capstone-wastesense`

---

## 🏗️ **Architecture Overview**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │     Backend      │    │      Database       │
│ Azure Static    │◄──►│ Azure App        │◄──►│ Azure PostgreSQL    │
│ Web Apps (FREE) │    │ Service ($13/mo) │    │ Basic ($20/mo)      │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   ML Service     │
                       │ Container Instances│
                       │   ($15/mo)       │
                       └──────────────────┘
```

---

## 🎯 **Step 1: Get GitHub Education Benefits**

1. **Apply for GitHub Education Pack**
   ```bash
   # Visit: https://education.github.com/pack
   # Use your .edu email or upload student ID
   # Wait 1-3 days for approval
   ```

2. **Claim Azure Credits**
   - Find "Microsoft Azure" in your approved pack
   - Click "Get Offer"
   - Create Azure account (NO credit card required)
   - Receive $100 in credits + free services

---

## 🚀 **Step 2: Deploy WasteSense to Azure**

### **Frontend Deployment (FREE)**
```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login to Azure
az login

# 3. Create resource group
az group create --name wastesense-rg --location eastus

# 4. Create Static Web App (automatically deploys from GitHub)
az staticwebapp create \
  --name wastesense-frontend \
  --resource-group wastesense-rg \
  --source https://github.com/Sadickachuli/capstone-wastesense \
  --location "East US" \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --app-artifact-location "dist"
```

### **Backend Deployment**
```bash
# 1. Create App Service Plan (Basic tier)
az appservice plan create \
  --name wastesense-plan \
  --resource-group wastesense-rg \
  --sku B1 \
  --is-linux

# 2. Create Web App for backend
az webapp create \
  --name wastesense-api \
  --resource-group wastesense-rg \
  --plan wastesense-plan \
  --runtime "NODE|18-lts"

# 3. Configure deployment from GitHub
az webapp deployment source config \
  --name wastesense-api \
  --resource-group wastesense-rg \
  --repo-url https://github.com/Sadickachuli/capstone-wastesense \
  --branch main \
  --manual-integration
```

### **Database Setup**
```bash
# Create PostgreSQL server
az postgres server create \
  --name wastesense-db-$(date +%s) \
  --resource-group wastesense-rg \
  --location eastus \
  --admin-user wastesense_admin \
  --admin-password YourSecurePassword123! \
  --sku-name B_Gen5_1 \
  --storage-size 51200 \
  --version 11

# Create database
az postgres db create \
  --name wastesense \
  --server-name wastesense-db-$(date +%s) \
  --resource-group wastesense-rg
```

### **ML Service Container**
```bash
# Deploy ML service (if containerized)
az container create \
  --name wastesense-ml \
  --resource-group wastesense-rg \
  --image [your-dockerhub-ml-image] \
  --ports 5000 \
  --memory 2 \
  --cpu 1 \
  --environment-variables MODEL_PATH=/app/models
```

---

## ⚙️ **Step 3: Configuration**

### **Environment Variables for Backend**
```bash
# Set backend environment variables
az webapp config appsettings set \
  --name wastesense-api \
  --resource-group wastesense-rg \
  --settings \
    DATABASE_URL="postgresql://wastesense_admin:YourSecurePassword123!@wastesense-db.postgres.database.azure.com:5432/wastesense" \
    ML_SERVICE_URL="http://wastesense-ml.eastus.azurecontainer.io:5000" \
    NODE_ENV="production" \
    PORT="8080"
```

### **Frontend Environment (Azure Static Web Apps)**
Create `staticwebapp.config.json` in your root:
```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://wastesense-api.azurewebsites.net/api/*"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

---

## 💰 **Cost Breakdown (GitHub Education Credits)**

| Service | Cost/Month | Covered by Credits |
|---------|------------|-------------------|
| Static Web Apps | **FREE** | ✅ Always free |
| App Service (B1) | $13 | ✅ 7+ months coverage |
| PostgreSQL (Basic) | $20 | ✅ 5 months coverage |
| Container Instances | $15 | ✅ 6+ months coverage |
| Storage | $2 | ✅ 50 months coverage |
| **Total** | **~$50/month** | **2+ months free** |

---

## 🔄 **Alternative Quick Options**

### **Option B: Heroku (Simpler)**
```bash
# If you prefer easier deployment:
# 1. Get Heroku from GitHub Pack ($13/month for 24 months)
# 2. Install Heroku CLI
# 3. Deploy with simple commands:

heroku create wastesense-app
heroku addons:create heroku-postgresql:mini
git push heroku main
```

### **Option C: DigitalOcean (Full Control)**
```bash
# Best for learning DevOps:
# 1. Get $200 credit for 1 year
# 2. Create Ubuntu droplet ($12/month)
# 3. Manual setup with Docker/Docker Compose
# 4. Full control over infrastructure
```

---

## 🎯 **Recommended Path for You**

**For WasteSense specifically, I recommend:**

1. **Start with Azure** (best GitHub Education value)
2. **Use the $100 credits** for 2+ months of full hosting
3. **Learn cloud deployment** (valuable skill)
4. **If you need longer-term hosting**, switch to Heroku for the remaining 22 months

---

## 🚦 **Quick Start Commands**

```bash
# Clone and prepare
git clone https://github.com/Sadickachuli/capstone-wastesense.git
cd capstone-wastesense

# Install Azure CLI and login
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login

# Deploy everything (5 minutes)
./scripts/deploy-azure.sh  # We can create this script
```

Would you like me to help you set up any of these deployment options? Azure gives you the most learning value and free credits! 🚀 