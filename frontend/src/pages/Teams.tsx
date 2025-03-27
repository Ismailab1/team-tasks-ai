// src/pages/Teams.tsx
import { useState, useEffect } from 'react';
import { Users, List, CheckSquare, FileText, Clock, Filter, Search, Plus } from 'lucide-react';

// Define types
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  assigned_to: string[];
  due_date: string;
  team_id: string;
}

interface Report {
  id: string;
  created_by: string;
  content: string;
  team_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | undefined;
}

interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  members: TeamMember[];
}

function Teams() {
  // State for data
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [, setPersonalTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'stream' | 'tasks' | 'reports'>('stream');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');

  // Get sample data (would be replaced with API calls)
  useEffect(() => {
    // Simulated API calls with timeout to mimic network request
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In real implementation, these would be actual API calls using apiClient
        // const teamsResponse = await apiClient.get('/api/teams');
        // const tasksResponse = await apiClient.get('/api/tasks');
        // const reportsResponse = await apiClient.get('/api/reports');
        
        // Sample data for development
        const sampleTeams: Team[] = [
          {
            id: '1',
            name: 'Frontend Development',
            description: 'Team responsible for UI/UX implementation',
            created_by: 'user123',
            members: [
              { id: 'user123', name: 'John Doe', email: 'john@example.com', role: 'Team Lead' },
              { id: 'user124', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer' },
            ]
          },
          {
            id: '2',
            name: 'Backend Development',
            description: 'API and database implementation team',
            created_by: 'user125',
            members: [
              { id: 'user125', name: 'Mike Johnson', email: 'mike@example.com', role: 'Team Lead' },
              { id: 'user126', name: 'Sarah Williams', email: 'sarah@example.com', role: 'Developer' },
            ]
          }
        ];
        
        const sampleTasks: Task[] = [
          {
            id: 't1',
            title: 'Implement Chatbot Component',
            description: 'Create reusable chatbot component with proper state management',
            status: 'In Progress',
            priority: 'High',
            assigned_to: ['user123', 'user124'],
            due_date: '2024-03-28',
            team_id: '1'
          },
          {
            id: 't2',
            title: 'Design Teams Page',
            description: 'Create UI for teams page including stream, tasks and reports',
            status: 'To Do',
            priority: 'Medium',
            assigned_to: ['user124'],
            due_date: '2024-03-29',
            team_id: '1'
          },
          {
            id: 't3',
            title: 'Implement Authentication API',
            description: 'Create authentication endpoints for login and registration',
            status: 'Done',
            priority: 'High',
            assigned_to: ['user125', 'user126'],
            due_date: '2024-03-25',
            team_id: '2'
          }
        ];
        
        const sampleReports: Report[] = [
          {
            id: 'r1',
            created_by: 'user123',
            content: 'Weekly progress report: completed 3 tasks, 2 tasks in progress, blocked by design approval',
            team_id: '1',
            created_at: '2024-03-24T14:30:00Z'
          },
          {
            id: 'r2',
            created_by: 'user125',
            content: 'Backend deployment completed successfully. New APIs available for testing',
            team_id: '2',
            created_at: '2024-03-25T09:15:00Z'
          }
        ];
        
        // Set state with sample data
        setTeams(sampleTeams);
        setTasks(sampleTasks);
        setReports(sampleReports);
        
        // Set active team to first one by default
        if (sampleTeams.length > 0) {
          setActiveTeam(sampleTeams[0]);
          
          // Filter personal tasks (tasks assigned to current user)
          // In real app, this would use the current user ID from auth context
          const currentUserId = 'user123'; // Simulated current user
          const userTasks = sampleTasks.filter(task => 
            task.assigned_to.includes(currentUserId)
          );
          setPersonalTasks(userTasks);
        }
        
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter tasks based on search and filter options
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (taskFilter === 'all') return matchesSearch && task.team_id === activeTeam?.id;
    if (taskFilter === 'todo') return matchesSearch && task.status === 'To Do' && task.team_id === activeTeam?.id;
    if (taskFilter === 'inprogress') return matchesSearch && task.status === 'In Progress' && task.team_id === activeTeam?.id;
    if (taskFilter === 'done') return matchesSearch && task.status === 'Done' && task.team_id === activeTeam?.id;
    return matchesSearch;
  });

  // Filter team reports
  const teamReports = reports.filter(report => report.team_id === activeTeam?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading teams data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar - Teams List */}
        <div className="w-full md:w-64 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Teams</h2>
            <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-2">
            {teams.map(team => (
              <button
                key={team.id}
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeTeam?.id === team.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'
                }`}
                onClick={() => setActiveTeam(team)}
              >
                <Users className="w-5 h-5 mr-3" />
                <span className="font-medium">{team.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Team Header */}
          {activeTeam && (
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h1 className="text-2xl font-bold">{activeTeam.name}</h1>
              <p className="text-gray-600 mt-1">{activeTeam.description}</p>
              
              <div className="flex mt-4 items-center">
                <div className="flex -space-x-2 mr-4">
                  {activeTeam.members.map(member => (
                    <div 
                      key={member.id} 
                      className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center overflow-hidden"
                      title={member.name}
                    >
                      {member.avatar ? 
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /> :
                        <span className="font-medium text-xs">{member.name.charAt(0)}{member.name.split(' ')[1]?.charAt(0)}</span>
                      }
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-500">{activeTeam.members.length} members</span>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px">
              <button 
                onClick={() => setActiveTab('stream')}
                className={`py-4 px-6 ${activeTab === 'stream' 
                  ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <List className="inline-block w-4 h-4 mr-2" />
                Stream
              </button>
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`py-4 px-6 ${activeTab === 'tasks' 
                  ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <CheckSquare className="inline-block w-4 h-4 mr-2" />
                Tasks
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-6 ${activeTab === 'reports' 
                  ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FileText className="inline-block w-4 h-4 mr-2" />
                Reports
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'stream' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Activity Stream</h2>
              
              {/* Activity Stream */}
              <div className="space-y-4">
                {/* Task activities, reports, etc. would be shown here */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-4">
                      <CheckSquare className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Task "Implement Chatbot Component" moved to In Progress</p>
                      <p className="text-gray-500 text-sm mt-1">By John Doe • 2 hours ago</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-full p-2 mr-4">
                      <FileText className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Weekly progress report submitted</p>
                      <p className="text-gray-500 text-sm mt-1">By John Doe • 1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold">Team Tasks</h2>
                
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      className="pl-10 pr-4 py-2 border rounded-lg w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Filter */}
                  <select
                    className="pl-4 pr-8 py-2 border rounded-lg appearance-none bg-white"
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                  >
                    <option value="all">All Tasks</option>
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  
                  {/* Add Task Button */}
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </button>
                </div>
              </div>
              
              {/* Tasks List */}
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks found matching your criteria</p>
                ) : (
                  filteredTasks.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-gray-500">{task.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">Due {task.due_date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">{task.priority}</span>
                          </div>
                        </div>
                      </div>
                      {/* Assigned Members */}
                      <div className="flex items-center mt-4">
                        {task.assigned_to.map(memberId => {
                          const member = activeTeam?.members.find(m => m.id === memberId);
                          return member ? (
                            <div 
                              key={memberId} 
                              className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center overflow-hidden"
                              title={member.name}
                            >
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-medium text-xs">
                                  {member.name.charAt(0)}{member.name.split(' ')[1]?.charAt(0)}
                                </span>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold">Team Reports</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Report
                </button>
              </div>
              
              {/* Reports List */}
              <div className="space-y-4">
                {teamReports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reports available for this team yet</p>
                ) : (
                  teamReports.map(report => {
                    const author = activeTeam?.members.find(m => m.id === report.created_by);
                    const date = new Date(report.created_at);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric'
                    });
                    
                    return (
                      <div key={report.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center mb-3">
                          <div 
                            className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3"
                            title={author?.name || 'Unknown author'}
                          >
                            {author?.avatar ? (
                              <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-medium text-xs">
                                {author?.name.charAt(0)}{author?.name.split(' ')[1]?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{author?.name || 'Unknown author'}</p>
                            <p className="text-gray-500 text-xs">{formattedDate}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-gray-700">{report.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Teams;