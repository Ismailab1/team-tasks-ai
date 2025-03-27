import apiClient from './apiClient';

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export const teamService = {
  // Get all teams for the current user
  async getTeams(): Promise<Team[]> {
    const response = await apiClient.get('/api/teams');
    return response.data;
  },
  
  // Get a specific team
  async getTeam(id: string): Promise<Team> {
    const response = await apiClient.get(`/api/teams/${id}`);
    return response.data;
  },
  
  // Create a new team
  async createTeam(name: string, description?: string): Promise<Team> {
    const response = await apiClient.post('/api/teams', { name, description });
    return response.data;
  },
  
  // Update a team
  async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
    const response = await apiClient.put(`/api/teams/${id}`, data);
    return response.data;
  },
  
  // Delete a team
  async deleteTeam(id: string): Promise<void> {
    await apiClient.delete(`/api/teams/${id}`);
  }
};