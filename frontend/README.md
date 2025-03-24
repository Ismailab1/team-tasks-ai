# Team Tasks AI - Frontend

## Project Overview
This project is developed for the **Azure AI Developer Hackathon**. It serves as the frontend for Team Tasks AI, a collaborative task management web app that integrates AI-powered check-ins and summaries.

## Tech Stack
- **React.js (Vite)** - Web application framework
- **TailwindCSS / Material UI** - UI Styling
- **React Router** - Navigation
- **Redux / Zustand** - State Management
- **Axios** - API calls to backend

## Folder Structure
```
frontend/
│── src/                # React source files
│   │── components/     # Reusable UI components
│   │── pages/         # Page-level components (Dashboard, Check-ins, Tasks)
│   │── hooks/         # Custom React hooks
│   │── services/      # API calls to backend
│   │── styles/        # TailwindCSS or custom styles
│   │── App.tsx        # Main React component
│   │── main.tsx       # React entry point
│── store/             # Global state management (Redux)
│   │── store.ts       # Temporary Store File (Redux)
│── public/            # Static assets
│── node_modules/      # Installed Modules
│── dist/              # Name of a build directory
│── package.json       # Frontend dependencies
│── index.html         # Root HTML file
│── package.json       # Node.js Configuration
│── package-lock.json  # Dependency Lock (Consistency)
│── postcss.config.js  # Configure postcss 
│── eslint.config.js   # Configure eslint 
│── vite.config.js     # Configure vite 
│── Dockerfile         # Configures the Docker Container 
│── docker-compose.yml # Configures docker-compose to run Docker Container 
│── README.md          # Frontend documentation
```


## Getting Started
### **1. Clone the repository:** 
```bash
git clone https://github.com/Ismailab1/team-tasks-ai.git
cd frontend
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Run the Development Server**
```bash
npm run dev
```

## API Integration
The frontend communicates with the backend via REST API.
Example API call:
```javascript
import axios from 'axios';

const fetchTasks = async () => {
  const response = await axios.get('/api/task/list');
  return response.data;
};
```

## Deployment
- Deploy frontend to **Azure Static Web Apps**
- Set up **CI/CD with GitHub Actions**

## License
This project is licensed under the **Apache 2.0**.

## Contributors
- **Ismail Abdullah** (@ismailab1) - Project Lead
- **Name** (@githubUsername) - Frontend
- **Name** (@githubUsername) - Frontend
- **Name** (@githubUsername) - Backend
- **Name** (@githubUsername) - UI/UX
- **Name** (@githubUsername) - Project Management
