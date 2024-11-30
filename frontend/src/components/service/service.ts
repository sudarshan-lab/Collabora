import axios from 'axios';
import API_BASE_URL from '../../lib/url';
import { format } from 'date-fns';

export async function signupUser(data: { firstname: string; lastname: string; email: string; password: string }) {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/signup`, data);
        return response.data; 
    } catch (error) {
        console.error('Error during signup:', error);
        throw error.response?.data || { error: 'Unknown error' };
    }
}

export async function loginUser(data: { email: string; password: string }) {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
        return response.data; 
    } catch (error) {
        console.error('Error during login:', error);
        throw error.response?.data || { error: 'Unknown error' }; // Match error structure
    }
}

export async function fetchUserTeams(token: string, userId: number) {
    try {
        const response = await axios.get(`${API_BASE_URL}/team/api/user/teams`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                user_id: userId, 
            },
        });
        return response.data.teams; 
    } catch (error) {
        console.error('Error fetching teams:', error);
        throw error.response?.data || { error: 'Unknown error' };
    }
}

export async function createTeam(token: string, data: { team_name: string; team_description: string }) {
    try {
        const response = await axios.post(`${API_BASE_URL}/team/api/createTeam`, data, {
            headers: {
                Authorization: `Bearer ${token}`, 
            },
        });
        return response.data; 
    } catch (error) {
        console.error('Error adding team:', error);
        throw error.response?.data || { error: 'Unknown error' };
    }
}

export async function fetchTeamDetails(token, teamId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/team/api/teams/${teamId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching team details:', error);
        throw error.response?.data || { error: 'Unknown error' };
    }
}

export async function updateTeamDetails(token, teamId, data) {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/team/api/teams/${teamId}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data; 
    } catch (error) {
        console.error('Error updating team details:', error);
        throw error.response?.data || { error: 'Unknown error' };
    }
}

export const addMembersToTeam = async (token, teamId, emails) => {
    try {
        const response = await fetch(`${API_BASE_URL}/team/api/teams/${teamId}/add-members`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ emails }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add members.");
        }

        return await response.json(); 
    } catch (error) {
        throw new Error(error.message || "An error occurred while adding members.");
    }
};

export const updateMemberRole = async (token, teamId, userId, role) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team/api/teams/${teamId}/update-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update member role.');
      }
  
      return await response.json();
    } catch (error) {
      throw error;
    }
  };
  
  export const removeMemberFromTeam = async (token, teamId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team/api/teams/${teamId}/remove-member`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member.');
      }
  
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  export const removeTeam = async (token, teamId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/team/api/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove team.');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const createTask = async (token, taskData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/api/createTask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(taskData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create task');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const fetchAllTasks = async (token, teamId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/api/alltasks/${teamId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch tasks');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const fetchTaskById = async (token, taskId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tasks/api/task/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching task by ID:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch task details.');
    }
};


export async function updateTaskStatus(taskId: number, status: string) {
    const token = sessionStorage.getItem('Token');
  
    if (!token) {
      throw new Error('Unauthorized: No token found');
    }
  
    const response = await fetch(`${API_BASE_URL}/tasks/api/updateTask/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
  
    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to update task status');
    }
  
    return response.json();
  }
  
  
  export async function assignUserToTask(taskId: number, userId: number) {
    const token = sessionStorage.getItem('Token');
  
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/api/assignUserToTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId, user_id_to_assign: userId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign user to task');
      }
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error assigning user to task:', error.message);
      throw error;
    }
  }
  
  export async function updateTaskUser(taskId, userId) {
    const token = sessionStorage.getItem('Token');
  
    const response = await fetch(`${API_BASE_URL}/tasks/api/updateUserToTask`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ taskId, user_id_to_assign: userId }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update task user');
    }
  
    return response.json();
  }
  
  export async function updateTaskDueDate(taskId: number, dueDate: Date) {
    const token = sessionStorage.getItem('Token');
    const formattedDate = format(dueDate, 'yyyy-MM-dd HH:mm:ss'); 
  
    const response = await fetch(`${API_BASE_URL}/tasks/api/updateTask/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ due_date: formattedDate }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to update due date');
    }
  
    return response.json();
  }
  
  