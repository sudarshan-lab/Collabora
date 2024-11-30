import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ListTodo, FileText, MessageSquare, Home, Info, SortDesc, SortAsc } from 'lucide-react';
import { createTeam } from '../service/service';
import './Team.css';
export function TeamSidebar() {
    const [teams, setTeams] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDescription, setNewTeamDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState("asc"); // Track sort order
    const [activeTeam, setActiveTeam] = useState(
        JSON.parse(sessionStorage.getItem('ActiveTeam')) || null
    );
    const [activeNav, setActiveNav] = useState(
        sessionStorage.getItem('ActiveNav') || 'dashboard'
    );
    const navigate = useNavigate();
    const token = sessionStorage.getItem('Token');

    useEffect(() => {
        if (token) {
            const storedTeams = JSON.parse(sessionStorage.getItem('Teams')) || [];
            setTeams(storedTeams);
        }
    
        const handleStorageChange = () => {
            const updatedTeams = JSON.parse(sessionStorage.getItem('Teams')) || [];
            setTeams(updatedTeams);
        };
    
        window.addEventListener('storage', handleStorageChange);
    
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [token]);
    
    

    const handleCreateTeam = async (e) => {
        e.preventDefault();

        if (!token) {
            navigate('/login');
            return;
        }

        setIsLoading(true);

        try {
            const response = await createTeam(token, {
                team_name: newTeamName,
                team_description: newTeamDescription,
            });
            
            const updatedTeams = [...teams, response.team];
            setTeams(updatedTeams);
            setIsCreating(false);
            setNewTeamName('');
            setNewTeamDescription('');
            setIsLoading(false);
            sessionStorage.setItem("Teams", JSON.stringify(updatedTeams));
            if (!window.location.pathname.includes('home')) {
                navigate('/home');
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error creating team:', error);
            sessionStorage.clear();
            setIsLoading(false);
        }
    };

    const handleTeamClick = (teamId) => {
        const team = teams.find((t) => t.team_id === teamId);
        if (team) {
            setActiveTeam(team);
            sessionStorage.setItem('ActiveTeam', JSON.stringify(team));
            setActiveNav('dashboard');
            sessionStorage.setItem('ActiveNav', 'dashboard');
            navigate(`/team/${teamId}`);
        }
    };

    const handleNavClick = (nav) => {
        if (activeTeam) {
            setActiveNav(nav);
            sessionStorage.setItem('ActiveNav', nav);
            if(nav!=='dashboard')
            navigate(`/team/${activeTeam.team_id}/${nav}`);
            else
            navigate(`/team/${activeTeam.team_id}/`);
        }
    };

    const handleHomeClick = () => {
        setActiveTeam(null);
        sessionStorage.removeItem('ActiveTeam');
        setActiveNav('');
        sessionStorage.removeItem('ActiveNav');
        navigate(`/home`);
    };

   

    const handleSort = () => {
        const sortedTeams = [...teams].sort((a, b) => {
            if (sortOrder === "asc") {
                return a.team_name.localeCompare(b.team_name);
            } else {
                return b.team_name.localeCompare(a.team_name);
            }
        });
        setTeams(sortedTeams);
        setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Toggle sort order
    };


    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <button
                    onClick={handleHomeClick}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 mb-2"
                >
                    <Home className="w-4 h-4" />
                    Home
                </button>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Create Team
                </button>
            </div>

            <div className="flex-1 overflow-y-hidden">
                <div className="p-4 overflow-y-auto max-h-[calc(100vh-400px)] scrollbar-hide">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Your Teams
                        </h2>
                        <button
                            onClick={handleSort}
                            className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                            {sortOrder === "asc" ? (
                                <SortAsc className="w-4 h-4" />
                            ) : (
                                <SortDesc className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    <div className="space-y-1">
                        {teams.map((team) => (
                            <button
                                key={team.team_id}
                                onClick={() => handleTeamClick(team.team_id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                                    activeTeam?.team_id === team.team_id ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                {team.team_name}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTeam && (
                    <div className="p-4 border-t border-gray-200">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Team Navigation
                        </h2>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleNavClick('dashboard')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                                    activeNav === 'dashboard' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                                <Home className="w-4 h-4" />
                                Dashboard
                            </button>
                            <button
                                onClick={() => handleNavClick('details')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                                    activeNav === 'details' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                                <Info className="w-4 h-4" />
                                Details
                            </button>
                            <button
                                onClick={() => handleNavClick('tasks')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                                    activeNav === 'tasks' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                                <ListTodo className="w-4 h-4" />
                                Tasks
                            </button>
                            <button
                                onClick={() => handleNavClick('files')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                                    activeNav === 'files' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                Files
                            </button>
                            <button
                                onClick={() => handleNavClick('discussions')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                                    activeNav === 'discussions' ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Discussions
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isCreating &&
                ReactDOM.createPortal(
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                            <h2 className="text-lg font-semibold mb-4 text-center">Create New Team</h2>
                            <form onSubmit={handleCreateTeam}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Team Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            value={newTeamDescription}
                                            onChange={(e) => setNewTeamDescription(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            rows={3}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2 justify-center"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="loader w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                                    Please wait...
                                                </>
                                            ) : (
                                                'Create'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
