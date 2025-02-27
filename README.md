# Team Tasks AI

## Project Overview
This project is developed for the **Azure AI Developer Hackathon**. Team Tasks AI is a collaborative task management web application that integrates AI-powered check-ins and summaries, allowing teams to manage tasks efficiently.

## Tech Stack
### **Frontend:**
- **React.js (Vite)** - Web application framework
- **TailwindCSS / Material UI** - UI Styling
- **React Router** - Navigation
- **Redux / Zustand** - State Management
- **Axios** - API calls to backend

### **Backend:**
- **Node.js + Express.js** - Backend Framework
- **Azure Functions** - Serverless API
- **Azure Cosmos DB** - NoSQL Database
- **Azure OpenAI GPT** - AI-generated summaries
- **Azure Cognitive Services** - Speech-to-Text, Sentiment Analysis

### **Infrastructure & Deployment:**
- **Azure Static Web Apps** - Hosting Web Frontend
- **Azure App Service** - Hosting API
- **Azure Monitor** - Logging & performance tracking
- **GitHub Actions** - CI/CD for automated deployment

## Folder Structure
```
team-tasks-ai/
│── backend/                # Backend API (Node.js, Express.js)
│   │── server.js           # Main entry point
│   │── .env                # Environment variables
│   │── routes/             # API routes (auth, teams, tasks, check-ins)
│   │── models/             # Database models
│   │── middleware/         # Middleware (Auth, Logging, Error Handling)
│   │── services/           # Business logic & AI integrations
│   │── utils/              # Helper functions
│   │── package.json        # Backend dependencies
│   │── README.md           # Backend documentation
│
│── frontend/               # Frontend Web App (React.js)
│   │── src/                # React source files
│   │   │── components/     # Reusable UI components
│   │   │── pages/         # Page-level components (Dashboard, Check-ins, Tasks)
│   │   │── hooks/         # Custom React hooks
│   │   │── context/       # Global state management (Redux/Zustand)
│   │   │── services/      # API calls to backend
│   │   │── styles/        # TailwindCSS or custom styles
│   │   │── App.js         # Main React component
│   │   │── index.js       # React entry point
│   │── public/            # Static assets
│   │── package.json       # Frontend dependencies
│   │── README.md          # Frontend documentation
│
│── infra/                  # Infrastructure as Code (Azure deployment)
│   │── azure-pipelines.yml # CI/CD pipeline (GitHub Actions or Azure DevOps)
│   │── terraform/          # Terraform scripts for infrastructure provisioning
│   │── Dockerfile          # Docker containerization (optional)
│
│── .gitignore              # Ignore files for Git
│── README.md               # Main project documentation
│── LICENSE                 # Open-source license (MIT recommended)
```

## Getting Started
### **1. Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/TeamTasksAI.git
cd team-tasks-ai
```

### **2. Backend Setup**
```bash
cd backend
npm install
```
Create a `.env` file and add your credentials:
```
PORT=5000
AZURE_OPENAI_KEY=your_key_here
AZURE_COSMOS_DB_URI=your_db_uri_here
```
Run the server:
```bash
npm start
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### **4. Deployment**
- Deploy **frontend** to **Azure Static Web Apps**
- Deploy **backend** to **Azure App Service** or **Azure Functions**
- Set up **CI/CD with GitHub Actions**

## API Endpoints
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/team/create` | Create a new team |
| `POST` | `/api/task/add` | Add a task to a team |
| `POST` | `/api/checkin/submit` | Submit a check-in |

## License
This project is licensed under the **Apache 2.0**.

## Contributors
- **Your Name** (@ismailab1) - Project Lead
- Looking for **Frontend, Backend, UI/UX, and AI Engineers!**
