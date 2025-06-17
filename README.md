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
[https://github.com/Sadickachuli/capstone-wastesense.git](https://github.com/Sadickachuli/capstone-wastesense.git)

API: [https://github.com/Sadickachuli/waste-sense-api.git](https://github.com/Sadickachuli/waste-sense-api.git)

---

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Python 3.8+
- (Optional) Docker for ML service

### 1. Clone the repository
   ```bash
git clone https://github.com/Sadickachuli/capstone-wastesense.git
   cd wastesense-app
   ```

### 2. Frontend Setup
   ```bash
   npm install
npm run dev
# App runs at http://localhost:5173
   ```

### 3. Backend Setup
   ```bash
cd backend
npm install
   npm run dev
# Backend runs on port 3001
```
### 4. Machine Learning Service Setup
```bash
cd ml_service
pip install -r requirements.txt
uvicorn main:app --reload
```

### 5. WasteSense API Service Setup (YOLO Waste Detection)
```bash
cd wastesense-api/wastesense-api
pip install -r requirements.txt
# Make sure the YOLO model weights file (best.pt) is present in this directory.
uvicorn app:app --reload
```
- **Note:** The YOLO model weights file (`best.pt`) is required for waste detection. You can train your own or request the provided weights.

---

## Designs (Screenshots)
> - Sign In

![09 06 2025_18 06 28_REC](https://github.com/user-attachments/assets/782013f6-9f12-4927-9a17-ca1c624d2145)

> - Recycler insights (with forecasting and analytics)

![09 06 2025_18 08 59_REC](https://github.com/user-attachments/assets/8dfa2b01-183f-4a08-b4f0-a8cfc28a9e10) ![09 06 2025_18 09 31_REC](https://github.com/user-attachments/assets/c5dfcbd6-ff5d-491b-bbfe-a979afc615a1) ![09 06 2025_18 09 58_REC](https://github.com/user-attachments/assets/cd10d29a-b080-4a49-ae55-60cf17a3cf5b) ![09 06 2025_18 10 26_REC](https://github.com/user-attachments/assets/ce00e20d-4838-46be-8746-9c916e1a0166) ![09 06 2025_18 11 02_REC](https://github.com/user-attachments/assets/0679f3d6-77c1-4247-8d08-66e8a2e5e243)


> - Dispatcher dashboard (with real-time updates, manual and ML waste composition input)

![09 06 2025_18 15 56_REC](https://github.com/user-attachments/assets/f2f4883c-724a-49b5-b2d3-f8d7b412da91) ![09 06 2025_18 48 48_REC](https://github.com/user-attachments/assets/c6992bcb-5fb6-4dcd-a98d-152a45fe3a0d) ![09 06 2025_18 16 24_REC](https://github.com/user-attachments/assets/16ddc407-a98b-445f-98d1-24619b1a7a30) ![09 06 2025_18 16 56_REC](https://github.com/user-attachments/assets/f43a7aa5-0781-4cd6-a872-ffbd132c182b)

> - Resident dashboard

![09 06 2025_18 17 58_REC](https://github.com/user-attachments/assets/cb00a0cc-60b1-4455-9c39-a2017279329b) ![09 06 2025_18 18 56_REC](https://github.com/user-attachments/assets/105a9611-e010-4240-8a72-dde9d40ed251)


---

## Deployment Plan
- **Frontend:** Deploy to Vercel, Netlify, or similar static hosting.
- **Backend:** Deploy to Render, Heroku, or a cloud VM (Node.js server).
- **ML Service:** Deploy as a Docker container or on a cloud VM (Python server).
- **WasteSense API (YOLO):** Deploy as a Docker container or on a cloud VM (FastAPI server).
- **Database:** Use a managed PostgreSQL/MySQL service or cloud VM.

---

## Video Demo
> **https://youtu.be/kqI5h2c6mvs?si=te9iNPK6nAmrgsyg**

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
- Deloyed API on Render: https://waste-sense-api.onrender.com/ 

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
