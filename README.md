# WasteSense - Smart Waste Management App

A modern web application for efficient waste management in Ablekuma North. This application helps residents report full bins, Uses Machine Learning to enable dispatchers to optimize collection routes, and allows recyclers to track deliveries at waste dumping sites to know the composition, weight, and location of waste dumping site.

## Features

### For Residents
- Report full bins with location
- View pickup schedules
- Track report history
- Receive notifications for upcoming pickups

### For Dispatchers
- View real-time bin status
- Optimize collection routes
- Manage fleet status
- Track performance metrics

### For Recyclers
- Track incoming deliveries
- Confirm waste composition
- View recycling insights
- Manage facility information

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Routing**: React Router v6
- **Form Handling**: Formik with Yup
- **UI Components**: Headless UI & Heroicons
- **Maps**: React Leaflet
- **Charts**: Recharts
- **Notifications**: React Toastify

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wastesense-app.git
   cd wastesense-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Create a `.env` file in the root directory with the following variables:
```env
VITE_API_URL=your_api_url
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## Project Structure

```
src/
├── api/          # API integration
├── components/   # Reusable components
├── context/     # React Context providers
├── hooks/       # Custom hooks
├── pages/       # Page components
├── routes/      # Route configurations
├── types/       # TypeScript types
└── utils/       # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com)
- [Headless UI](https://headlessui.dev)
- [Heroicons](https://heroicons.com)
- [React Leaflet](https://react-leaflet.js.org)
- [Recharts](https://recharts.org) 