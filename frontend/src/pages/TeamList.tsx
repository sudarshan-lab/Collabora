import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MoreVertical, SortAsc, SortDesc, Search } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { fetchUserTeams, removeTeam } from '../components/service/service';

export function TeamList() {
    const [teams, setTeams] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [sortOrder, setSortOrder] = useState("asc");
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const currentUser = JSON.parse(sessionStorage.getItem("User"));

    useEffect(() => {
        const token = sessionStorage.getItem('Token');
        const userId = currentUser?.userId;

        if (token && userId) {
            fetchUserTeams(token, userId)
                .then((fetchedTeams) => {
                    setTeams(fetchedTeams);
                    sessionStorage.setItem('Teams', JSON.stringify(fetchedTeams));
                })
                .catch((error) => {
                    console.error('Error fetching teams:', error);
                    sessionStorage.clear();
                    navigate('/login');
                });
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleTeamClick = (team) => {
        if (team) {
            sessionStorage.setItem('ActiveTeam', JSON.stringify(team));
            sessionStorage.setItem('ActiveNav', 'dashboard');
            navigate(`/team/${team.team_id}`);
        }
    };

    const handleRemoveTeam = async () => {
        const token = sessionStorage.getItem('Token');
        setDeleting(true);
        try {
            await removeTeam(token, teamToDelete.team_id);
            const updatedTeams = teams.filter((team) => team.team_id !== teamToDelete.team_id);
            setTeams(updatedTeams);
            sessionStorage.setItem('Teams', JSON.stringify(updatedTeams));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            alert(error.message || 'Failed to remove team.');
        } finally {
            setIsModalOpen(false);
            setTeamToDelete(null);
            setActiveDropdown(null);
            setDeleting(false);
        }
    };

    const confirmDeleteTeam = (team) => {
        setTeamToDelete(team);
        setIsModalOpen(true);
        setActiveDropdown(null);
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
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const filteredTeams = teams.filter((team) =>
        team.team_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <div className="min-h-full">
                <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="page-title">Your <span className="brand-text">Teams</span></h1>
                        <p className="mt-1 text-sm text-gray-500">Jump into a workspace or spin up a new one.</p>
                        <div className="mt-5 flex items-center gap-3">
                            <div className="relative flex-1 max-w-xl">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search teams..."
                                    className="input-icon"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSort}
                                className="btn-outline px-3"
                                title="Sort by name"
                            >
                                {sortOrder === "asc" ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTeams.map((team) => (
                            <div key={team.team_id} className="card card-hover relative p-6">
                                <div onClick={() => handleTeamClick(team)} className="cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 text-white shadow-md shadow-blue-500/20">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900 truncate">{team.team_name}</h2>
                                    </div>
                                    <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500">
                                        {team.team_description || 'No description provided.'}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="chip bg-blue-50 text-blue-600">
                                            <Users className="h-3.5 w-3.5" />
                                            {team.member_count || 0} member{team.member_count !== 1 ? 's' : ''}
                                        </span>
                                        {team.role === 'admin' && (
                                            <span className="chip bg-pink-50 text-pink-600">Admin</span>
                                        )}
                                    </div>
                                </div>

                                {team.role === 'admin' && (
                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={() =>
                                                setActiveDropdown(activeDropdown === team.team_id ? null : team.team_id)
                                            }
                                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {activeDropdown === team.team_id && (
                                            <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-xl">
                                                <button
                                                    onClick={() => confirmDeleteTeam(team)}
                                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                                                >
                                                    Remove team
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredTeams.length === 0 && (
                            <div className="col-span-full">
                                <div className="card flex flex-col items-center py-16 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                                        <Users className="h-7 w-7 text-blue-400" />
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold text-gray-900">No teams found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {searchQuery ? 'Try a different search term.' : 'Create your first team from the sidebar.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2 className="text-lg font-bold text-gray-900">Delete team?</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete <strong className="text-gray-900">{teamToDelete?.team_name}</strong>? This action cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="btn-ghost" disabled={deleting}>
                                Cancel
                            </button>
                            <button onClick={handleRemoveTeam} className="btn-danger" disabled={deleting}>
                                {deleting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
