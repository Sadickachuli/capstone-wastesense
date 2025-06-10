# WasteSense - Smart Waste Management App

A modern web application for efficient waste management in Ablekuma North, Ghana. WasteSense empowers residents to report full bins, enables dispatchers to optimize collection and input waste composition (either manually or via an ML-powered image upload), and allows recyclers to track, analyze, and forecast waste deliveries. The platform leverages real-time updates, a YOLO-based machine learning waste detection model, and a forecasting model for smarter waste management.

---

## Table of Contents
- [Description](#description)
- [Features](#features)
- [GitHub Repository](#github-repository)
- [Setup & Installation](#setup--installation)
- [Designs (Screenshots)](#designs-screenshots)
- [Deployment Plan](#deployment-plan)
- [Video Demo](#video-demo)
- [Machine Learning Model](#machine-learning-model)
- [Forecasting Model](#forecasting-model)
- [Code Structure](#code-structure)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Description
WasteSense is a full-stack web application designed to streamline waste management in Ablekuma North. It supports three main user roles:
- **Residents:** Report full bins, view pickup schedules, and receive notifications.
- **Dispatchers:** Monitor bin status, manage collections, input waste composition (either manually or by uploading an image for ML analysis), and receive threshold-based notifications.
- **Recyclers:** Get notified about waste composition, track deliveries, analyze recycling insights, and view waste forecasts for planning.

The app integrates a YOLO-based machine learning model for image-based waste detection (for dispatchers) and a forecasting model (for recyclers) to enable automated, data-driven waste management. Real-time dashboard updates and notifications keep all users informed and engaged.

---

## Features
### For Residents
- Report full bins with location
- View pickup schedules
- Track report history
- Receive notifications for upcoming pickups

### For Dispatchers
- View real-time bin status and report counts
- Receive notifications when bin report thresholds are reached
- Input waste composition for dumping sites:
  - **Manual input:** Enter percentages for plastic, paper, glass, metal, and organic waste, plus current capacity.
  - **ML-powered input:** Upload an image of the waste pile; the ML waste detection model analyzes the image and automatically fills in the composition and estimated weight for confirmation.
- Optimize collection routes (ML-powered)
- Track performance metrics

### For Recyclers
- Get notified about new waste composition data
- Track incoming deliveries
- View recycling insights and analytics
- **Forecasting:** Access forecasts for tomorrow's waste (total tonnage and composition by district/site) and historical/trend analytics for both forecasted and detected waste composition.
- Manage facility information

### Machine Learning & API
- **YOLO waste detection model:** Detects and classifies waste items in uploaded images, estimates total weight, and returns annotated images for dispatcher/recycler review.
- ML service for waste composition prediction (YOLO-based)
- FastAPI-based API for image upload and waste detection
- Annotated image and weight estimation returned from API

### Forecasting
- Forecasting model predicts next-day waste tonnage and composition for each district/site, supporting recycler planning and analytics.

---

## GitHub Repository
[https://github.com/yourusername/wastesense-app](https://github.com/yourusername/wastesense-app)

---

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Python 3.8+
- (Optional) Docker for ML service

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/wastesense-app.git
cd wastesense-app
```

### 2. Frontend Setup
```bash
npm install
npm run dev
# App runs at http://localhost:5173
```

#### Environment Variables (Frontend)
Create a `.env` file in the root directory:
```
VITE_API_URL=your_api_url
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run dev
# Backend runs at http://localhost:5000 (or your configured port)
```

#### Environment Variables (Backend)
Create a `.env` file in `backend/`:
```
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
```

### 4. Machine Learning Service Setup
```bash
cd ml_service
pip install -r requirements.txt
python main.py
# ML service runs at http://localhost:8001 (or your configured port)
```

### 5. WasteSense API Service Setup (YOLO Waste Detection)
```bash
cd wastesense-api/wastesense-api
pip install -r requirements.txt
# Make sure the YOLO model weights file (best.pt) is present in this directory.
uvicorn app:app --reload
# API runs at http://localhost:8000
```
- **Note:** The YOLO model weights file (`best.pt`) is required for waste detection. You can train your own or request the provided weights.

---

## Designs (Screenshots)
> **Add screenshots of your app interfaces here.**
> - Resident dashboard
> - Dispatcher dashboard (with real-time updates, manual and ML waste composition input)
> - Recycler insights (with forecasting and analytics)
> - ML/Prediction results

*To add: Place images in a `/screenshots` folder and embed them here using markdown:*
```
![Resident Dashboard](screenshots/resident_dashboard.png)
```

---

## Deployment Plan
- **Frontend:** Deploy to Vercel, Netlify, or similar static hosting.
- **Backend:** Deploy to Render, Heroku, or a cloud VM (Node.js server).
- **ML Service:** Deploy as a Docker container or on a cloud VM (Python server).
- **WasteSense API (YOLO):** Deploy as a Docker container or on a cloud VM (FastAPI server). Ensure `best.pt` is present.
- **Environment Variables:** Set securely in your deployment platform.
- **Database:** Use a managed PostgreSQL/MySQL service or cloud VM.

---

## Video Demo
> **Add a 5-10 minute video demo link here (YouTube, Loom, etc.)**
> - Walk through all user roles and main features
> - Show ML prediction, forecasting, and real-time updates

---

## Machine Learning Model
WasteSense uses a YOLOv8 (You Only Look Once, version 8) deep learning model to detect and classify waste items from images. The model is trained on a diverse dataset of waste types and is capable of:
- Detecting multiple waste items in a single image
- Classifying each item into predefined waste categories
- Estimating the total weight of detected waste using average weights per class
- Returning an annotated image with bounding boxes and class labels

**How it's used:**
- **On the dispatcher dashboard:** Dispatchers can upload an image of a waste pile at a dumping site. The YOLO model analyzes the image and automatically fills in the waste composition and estimated weight, which the dispatcher can then confirm and update for the site. Alternatively, dispatchers can manually input the composition if preferred.

The YOLO model is served via a FastAPI application (`wastesense-api/wastesense-api/app.py`). When an image is uploaded, the API returns:
- A list of detected waste classes, bounding boxes, and confidence scores
- The estimated total weight of the waste in the image
- An annotated image (base64-encoded) for visualization

**Model Weights:**
- The model weights file (`best.pt`) must be present in the API directory. You can train your own YOLO model or request the provided weights.

**Integration:**
- The waste detection API is used by dispatchers to analyze waste composition after collection, supporting data-driven recycling and reporting. Recyclers can view detected composition trends in their analytics.

---

## Forecasting Model
WasteSense includes a forecasting model that predicts the next day's waste generation and composition for each district/site. This model enables recyclers to:
- View forecasts for total waste tonnage and composition for tomorrow (by district/site)
- Analyze historical and trend data for both forecasted and detected waste composition
- Export analytics for planning and reporting

Forecasts are visualized on the recycler dashboard with charts and tables, supporting proactive recycling operations and resource allocation.

---

## Code Structure
```
.
├── backend/                  # Node.js/Express backend (API, DB, business logic)
│   ├── src/
│   ├── migrations/
│   └── ...
├── ml_service/               # Python ML microservice (waste prediction)
│   ├── main.py
│   ├── model.py
│   ├── generate_synthetic_data.py
│   └── ...
├── src/                      # React frontend
│   ├── pages/
│   ├── components/
│   ├── context/
│   └── ...
├── wastesense-api/           # WasteSense API (YOLO/ML FastAPI service)
│   └── wastesense-api/
│       ├── app.py            # FastAPI app (YOLO waste detection)
│       ├── conf.py           # Configurations
│       ├── test.py           # API tests
│       ├── best.pt           # YOLO model weights (waste detection)
│       ├── annotated_images/ # Output images
│       ├── images/           # Input images
│       ├── notebook/         # Jupyter notebooks (ML training, etc.)
│       ├── requirements.txt  # Python dependencies
│       └── README.md
├── package.json
├── README.md
└── ...
```

### Folder Descriptions
- **src/**: Frontend React app (all user interfaces)
- **backend/**: Node.js backend (API, DB, business logic)
- **ml_service/**: Python ML microservice for waste prediction
- **wastesense-api/wastesense-api/**: FastAPI service for YOLO-based waste detection. Receives images, runs inference, and returns detected waste classes, weights, and annotated images. Requires `best.pt` model weights.

---

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments
- [Tailwind CSS](https://tailwindcss.com)
- [Headless UI](https://headlessui.dev)
- [Heroicons](https://heroicons.com)
- [React Leaflet](https://react-leaflet.js.org)
- [Recharts](https://recharts.org)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Ultralytics YOLO](https://docs.ultralytics.com/) 