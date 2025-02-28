# Team Tasks AI - Backend

## Project Overview
This project is developed for the **Azure AI Developer Hackathon**. It is the backend system for Team Tasks AI, a collaborative task management web app that integrates AI-powered check-ins and summaries.

## Tech Stack
- **Node.js + Express.js** (Backend Framework)
- **Azure Functions** (Serverless API)
- **Azure Cosmos DB** (NoSQL Database)
- **Azure OpenAI GPT** (AI-powered summaries)
- **Azure Cognitive Services** (Speech-to-Text, Sentiment Analysis)

## Folder Structure
```
backend/
│── server.js        # Main entry point
│── .env             # Environment variables
│── routes/
│   ├── auth.js      # Authentication endpoints
│   ├── team.js      # Team management endpoints
│   ├── task.js      # Task management endpoints
│   ├── checkin.js   # Check-in & AI summary endpoints
│── models/          # Database models
│── middleware/      # Middleware (Auth, Logging, Error Handling)
│── services/        # Business logic & AI integrations
│── utils/           # Helper functions
│── tests/           # Unit and integration tests
│── package.json     # Backend dependencies
│── README.md        # Backend documentation
```

## Getting Started
### **1. Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/TeamTasksAI.git
cd backend
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Set Up Environment Variables**
Create a `.env` file and add your credentials:
```
PORT=5000
AZURE_OPENAI_KEY=your_key_here
AZURE_COSMOS_DB_URI=your_db_uri_here
```

### **4. Run the Server**
```bash
npm start
```

## API Endpoints
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/team/create` | Create a new team |
| `POST` | `/api/task/add` | Add a task to a team with multiple assignees |
| `PUT`  | `/api/task/update/:task_id` | Update a task, including multiple assignees |
| `GET`  | `/api/task/list/:team_id` | Get all tasks for a team |
| `DELETE` | `/api/task/delete/:task_id` | Delete a task |
| `POST` | `/api/checkin/submit` | Submit a check-in |

### **Task API Changes**
- **Task Creation (`/api/task/add`)**: Now accepts an array of `assigned_to` user IDs.
- **Task Update (`/api/task/update/:task_id`)**: Allows modifying `assigned_to` to add or remove assignees.
- **Task Retrieval (`/api/task/list/:team_id`)**: Returns tasks with multiple assignees in an array.

#### **Example Payload for Creating a Task with Multiple Assignees:**
```json
{
  "team_id": "team123",
  "title": "Build Check-In API",
  "description": "Develop the AI-powered check-in system",
  "assigned_to": ["abc123", "def456"],
  "status": "In Progress",
  "priority": "High",
  "due_date": "2024-03-05"
}
```

## Deployment
- Deploy backend to **Azure App Service** or **Azure Functions**
- Set up **CI/CD with GitHub Actions** for automated deployment

## License
This project is licensed under the **Apache 2.0**.

## Contributors
- **Your Name** (@ismailab1) - Project Lead
- Looking for **Frontend, Backend, UI/UX, and AI Engineers!**