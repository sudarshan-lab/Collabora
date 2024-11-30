import { create } from 'zustand';
import type { Team } from '../types';
import { fetchUserTeams, createTeam } from '../components/service/service';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  loading: boolean;
  error: string | null;
  fetchUserTeams: (token: string, userId: number) => Promise<void>;
  createTeam: (token: string, data: { team_name: string; team_description: string }) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  currentTeam: null,
  loading: false,
  error: null,

  fetchUserTeams: async (token: string, userId: number) => {
    set({ loading: true, error: null });
    try {
      const teams = await fetchUserTeams(token, userId); 
      set({ teams, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch teams.', loading: false });
    }
  },

  createTeam: async (token: string, data: { team_name: string; team_description: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await createTeam(token, data); 
      const newTeam: Team = {
        id: response.teamId,
        name: data.team_name,
        description: data.team_description,
        members: [], 
      };
      set((state) => ({
        teams: [...state.teams, newTeam],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create team.', loading: false });
    }
  },

  setCurrentTeam: (team: Team | null) => set({ currentTeam: team }),
}));
