# Exercise Library

A full-stack web application for browsing and searching exercises with video demonstrations. Built with React frontend and Node.js/Express backend.

## Features

- 📚 **Exercise Database**: Upload and manage exercise data via Excel files
- 🔍 **Advanced Search**: Search exercises by name, difficulty, muscle group, and equipment
- 🎥 **Video Links**: Direct links to YouTube demonstrations and explanations
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 📄 **Pagination**: Efficient browsing with paginated results
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **XLSX** - Excel file parsing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Axios** - HTTP client
- **CSS3** - Styling with responsive design

## Project Structure

```
exercise-library/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json       # Backend dependencies
│   └── uploads/           # Excel file storage
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   ├── public/
│   │   └── index.html     # HTML template
│   └── package.json       # Frontend dependencies
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd exercise-library
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd ../backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

5. **Start the frontend development server**
   ```bash
   cd ../frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

6. **Upload an Excel file**
   - Place your Excel file in the `backend/uploads/` directory
   - Name it `exercise-database.xlsx`
   - The file should have columns: Exercise, Difficulty Level, Target Muscle Group, Primary Equipment, Body Region, Short YouTube Demonstration, In-Depth YouTube Explanation

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd ../backend
   npm start
   ```

The app will be available at `http://localhost:3001`

## API Endpoints

### GET `/api/exercises`
Get all exercises with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term
- `difficulty` (string): Filter by difficulty level
- `muscle` (string): Filter by muscle group
- `equipment` (string): Filter by equipment

**Response:**
```json
{
  "exercises": [...],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

### GET `/api/filters`
Get unique filter values for dropdowns.

**Response:**
```json
{
  "difficulties": ["Beginner", "Intermediate", "Advanced"],
  "muscles": ["Chest", "Back", "Legs"],
  "equipment": ["Dumbbells", "Barbell", "Bodyweight"]
}
```

### POST `/api/upload`
Upload an Excel file.

**Request:** Multipart form data with file field named 'file'

**Response:**
```json
{
  "message": "File uploaded and processed successfully",
  "count": 150
}
```

## Excel File Format

Your Excel file should have the following columns:
- **Exercise** - Exercise name
- **Difficulty Level** - Beginner, Intermediate, Advanced
- **Target Muscle Group** - Primary muscle group
- **Primary Equipment** - Equipment needed
- **Body Region** - Body part
- **Short YouTube Demonstration** - URL to demo video
- **In-Depth YouTube Explanation** - URL to detailed explanation

## Deployment

### Render.com (Recommended)

1. **Create a Render account** at [render.com](https://render.com)

2. **Deploy Backend:**
   - Create a new Web Service
   - Connect your GitHub repository
   - Set Root Directory to `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Set Environment Variable: `NODE_ENV=production`

3. **Deploy Frontend:**
   - Create a new Static Site
   - Connect your GitHub repository
   - Set Root Directory to `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

### Alternative: Combined Deployment

For a single deployment, the backend serves the frontend build:

1. Build the frontend: `cd frontend && npm run build`
2. Copy the build folder to backend: `cp -r frontend/build backend/`
3. Deploy only the backend to your hosting service

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue on GitHub or contact the development team. 