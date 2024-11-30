import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MoreVertical, SortAsc, SortDesc } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { fetchUserTeams, removeTeam } from '../components/service/service';

export function TeamList() {
    const [teams, setTeams] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false); // Track delete operation
    const [sortOrder, setSortOrder] = useState("asc"); // Track sort order
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
        setDeleting(true); // Start the loader
        try {
            await removeTeam(token, teamToDelete.team_id); // Service call
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
            setDeleting(false); // Stop the loader
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
        setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Toggle sort order
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Your Teams</h1>
                        <button
                            onClick={handleSort}
                            className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                            {sortOrder === "asc" ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {teams.map((team) => (
                            <div
                                key={team.team_id}
                                className="bg-white rounded-lg shadow-sm p-6 relative cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div onClick={() => handleTeamClick(team)} className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">{team.team_name}</h2>
                                </div>
                                <p className="text-gray-600 mb-4">{team.team_description}</p>
                                <div className="text-sm text-gray-500">
                                    {team.member_count || 0} member{team.member_count !== 1 ? 's' : ''}
                                </div>

                                {team.role === 'admin' && (
                                    <div className="absolute bottom-4 right-4">
                                        <button
                                            onClick={() =>
                                                setActiveDropdown(activeDropdown === team.team_id ? null : team.team_id)
                                            }
                                            className="text-gray-600 hover:text-gray-800"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {activeDropdown === team.team_id && (
                                            <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded-md p-4 z-10 w-48">
                                                <button
                                                    onClick={() => confirmDeleteTeam(team)}
                                                    className="block px-6 py-3 text-base text-red-500 hover:bg-red-100 rounded-lg w-full text-left"
                                                >
                                                    Remove Team
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {teams.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No teams</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new team.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-lg font-semibold mb-4 text-center">Confirm Team Deletion</h2>
                        <p className="text-sm text-gray-700 mb-4 text-center">
                            Are you sure you want to delete the team <strong>{teamToDelete?.team_name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveTeam}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <div className="loader w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
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
