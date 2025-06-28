#!/bin/bash

# WasteSense Render Deployment Preparation Script
# This script prepares your application for Render deployment

set -e

echo "🚀 Preparing WasteSense for Render deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Deployment Checklist:${NC}"
echo "✅ YOLO API already deployed: https://waste-sense-api.onrender.com"
echo "✅ Code pushed to GitHub"
echo "🔄 Ready to deploy: Backend, ML Service, Frontend, Database"

echo -e "\n${YELLOW}📝 Environment Variables Needed:${NC}"
echo "Backend:"
echo "- DATABASE_URL (from Render PostgreSQL)"
echo "- JWT_SECRET (auto-generated)"
echo "- OPENAI_API_KEY (get from OpenAI)"
echo "- YOLO_API_URL=https://waste-sense-api.onrender.com"

echo -e "\n${GREEN}🎯 Deployment URLs (after deployment):${NC}"
echo "Frontend: https://wastesense-frontend.onrender.com"
echo "Backend: https://wastesense-backend.onrender.com"
echo "ML Service: https://wastesense-ml-forecasting.onrender.com"
echo "YOLO API: https://waste-sense-api.onrender.com (already live)"

echo -e "\n${BLUE}📖 Next Steps:${NC}"
echo "1. Go to render.com and connect your GitHub repo"
echo "2. Follow the RENDER_DEPLOYMENT_GUIDE.md step by step"
echo "3. Create services in this order:"
echo "   a) PostgreSQL Database"
echo "   b) Backend API"
echo "   c) ML Forecasting Service"
echo "   d) Frontend Static Site"
echo "4. Run database migrations"
echo "5. Test all endpoints"

echo -e "\n${GREEN}🔑 Don't forget:${NC}"
echo "- Get OpenAI API key for LLM detection"
echo "- Update environment variables after each service deployment"
echo "- Test with real waste images"

echo -e "\n${YELLOW}⚠️  Important:${NC}"
echo "Free tier services sleep after 15 minutes of inactivity"
echo "First request may be slow (cold start)"
echo "Consider upgrading to paid plans for production use"

echo -e "\n🎉 Ready to deploy! Follow RENDER_DEPLOYMENT_GUIDE.md" 