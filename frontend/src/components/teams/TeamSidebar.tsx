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
            <div className="p-4 border-b border-gray-200 space-y-2">
                <button onClick={handleHomeClick} className="nav-item">
                    <Home className="w-4 h-4" />
                    Home
                </button>
                <button onClick={() => setIsCreating(true)} className="btn-brand w-full">
                    <Plus className="w-4 h-4" />
                    Create Team
                </button>
            </div>

            <div className="flex-1 overflow-y-hidden">
                <div className="p-4 overflow-y-auto max-h-[calc(100vh-400px)] scrollbar-hide">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Your Teams
                        </h2>
                        <button
                            onClick={handleSort}
                            className="flex items-center text-gray-400 transition-colors hover:text-blue-600"
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
                                className={`nav-item ${activeTeam?.team_id === team.team_id ? 'nav-item-active' : ''}`}
                            >
                                <Users className="w-4 h-4 shrink-0" />
                                <span className="truncate">{team.team_name}</span>
                            </button>
                        ))}
                        {teams.length === 0 && (
                            <p className="px-3 py-2 text-xs text-gray-400">No teams yet — create one above.</p>
                        )}
                    </div>
                </div>

                {activeTeam && (
                    <div className="p-4 border-t border-white/60">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Team Navigation
                        </h2>
                        <div className="space-y-1">
                            {[
                                { nav: 'dashboard', label: 'Dashboard', Icon: Home },
                                { nav: 'details', label: 'Details', Icon: Info },
                                { nav: 'tasks', label: 'Tasks', Icon: ListTodo },
                                { nav: 'files', label: 'Files', Icon: FileText },
                                { nav: 'discussions', label: 'Discussions', Icon: MessageSquare },
                            ].map(({ nav, label, Icon }) => (
                                <button
                                    key={nav}
                                    onClick={() => handleNavClick(nav)}
                                    className={`nav-item ${activeNav === nav ? 'nav-item-active' : ''}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {isCreating &&
                ReactDOM.createPortal(
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h2 className="mb-1 text-lg font-bold text-gray-900">Create new team</h2>
                            <p className="mb-5 text-sm text-gray-500">Give your team a name and an optional description.</p>
                            <form onSubmit={handleCreateTeam}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Team name
                                        </label>
                                        <input
                                            type="text"
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                            className="input-field"
                                            placeholder="e.g. Design Squad"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            value={newTeamDescription}
                                            onChange={(e) => setNewTeamDescription(e.target.value)}
                                            className="input-field h-auto py-2.5"
                                            placeholder="What is this team about?"
                                            rows={3}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="btn-ghost"
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-brand" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                    Please wait...
                                                </>
                                            ) : (
                                                'Create team'
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
