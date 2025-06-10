# WasteSense - Smart Waste Management App

A modern web application for efficient waste management in Ablekuma North, Ghana. WasteSense empowers residents to report full bins, enables dispatchers to optimize collection and input waste composition, and allows recyclers to track and analyze waste deliveries. The platform leverages real-time updates and machine learning for smarter waste management.

---

## Table of Contents
- [Description](#description)
- [Features](#features)
- [GitHub Repository](#github-repository)
- [Setup & Installation](#setup--installation)
- [Designs (Screenshots)](#designs-screenshots)
- [Deployment Plan](#deployment-plan)
- [Video Demo](#video-demo)
- [Code Structure](#code-structure)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Description
WasteSense is a full-stack web application designed to streamline waste management in Ablekuma North. It supports three main user roles:
- **Residents:** Report full bins, view pickup schedules, and receive notifications.
- **Dispatchers:** Monitor bin status, manage collections, input waste composition, and receive threshold-based notifications.
- **Recyclers:** Get notified about waste composition, track deliveries, and analyze recycling insights.

The app integrates a machine learning service for waste composition analysis and supports real-time dashboard updates.

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
- Input waste composition after collection
- Optimize collection routes (ML-powered)
- Track performance metrics

### For Recyclers
- Get notified about new waste composition data
- Track incoming deliveries
- View recycling insights and analytics
- Manage facility information

### Machine Learning & API
- ML service for waste composition prediction (YOLO-based)
- FastAPI-based API for image upload and waste detection
- Annotated image and weight estimation returned from API

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

### 5. WasteSense API Service Setup
```bash
cd wastesense-api/wastesense-api
pip install -r requirements.txt
uvicorn app:app --reload
# API runs at http://localhost:8000
```

---

## Designs (Screenshots)
> **Add screenshots of your app interfaces here.**
> - Resident dashboard
> - Dispatcher dashboard (with real-time updates)
> - Recycler insights
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
- **WasteSense API:** Deploy as a Docker container or on a cloud VM (FastAPI server).
- **Environment Variables:** Set securely in your deployment platform.
- **Database:** Use a managed PostgreSQL/MySQL service or cloud VM.

---

## Video Demo
> **Add a 5-10 minute video demo link here (YouTube, Loom, etc.)**
> - Walk through all user roles and main features
> - Show ML prediction and real-time updates

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
│       ├── best.pt           # YOLO model weights
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
- **wastesense-api/wastesense-api/**: FastAPI service for YOLO-based waste detection

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