import { useState, useEffect } from 'react';
import { Users, Building2, Loader2, MoreHorizontal } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { addMembersToTeam, fetchTeamDetails, removeMemberFromTeam, updateMemberRole, updateTeamDetails } from '../components/service/service';
import { TeamHeader } from '../components/teams/TeamHeader';
import { TeamForm } from '../components/teams/TeamForm';
import { motion } from 'framer-motion';

export function DetailsPage() {
  const { teamId } = useParams();
  const token = sessionStorage.getItem('Token');
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState([""]);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const currentUser = JSON.parse(sessionStorage.getItem("User"));
  const navigate = useNavigate();


  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const teamData = await fetchTeamDetails(token, teamId);
        setTeam(teamData.team);
        setMembers(teamData.members);
        sessionStorage.setItem("TeamMembers", JSON.stringify(teamData.members));
        setUpdatedName(teamData.team.team_name);
        setUpdatedDescription(teamData.team.team_description);
      } catch (error) {
        setError(error.message || 'Failed to fetch team details');
        sessionStorage.clear();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [teamId, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTeamDetails(token, teamId, {
        team_name: updatedName,
        team_description: updatedDescription,
      });

      const updatedTeam = { ...team, team_name: updatedName, team_description: updatedDescription };

      sessionStorage.setItem('ActiveTeam', JSON.stringify(updatedTeam));
      const teams = JSON.parse(sessionStorage.getItem('Teams')) || [];
      const updatedTeams = teams.map((t) =>
        t.team_id === updatedTeam.team_id ? updatedTeam : t
      );
      sessionStorage.setItem('Teams', JSON.stringify(updatedTeams));

      window.dispatchEvent(new Event('storage'));

      setTeam(updatedTeam);
      setIsEditing(false);
    } catch (error) {
      alert(error.error || 'Failed to update team details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMembers = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
        alert(`Invalid email(s) detected: ${invalidEmails.join(", ")}. Please fix these before proceeding.`);
        return;
    }
    setModalLoading(true); 
    try {
        const newMembers = await addMembersToTeam(token, teamId, emails);
        setMembers(newMembers.members);
        setEmails([""]);
        setIsModalOpen(false);
    } catch (error) {
        alert(error.message || "An error occurred while adding members.");
    } finally {
        setModalLoading(false); 
        setIsEditing(false);
    }
};


  const handleEmailChange = (index, value) => {
    const updatedEmails = [...emails];
    updatedEmails[index] = value;
    setEmails(updatedEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 p-4">{error}</div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Loading team data...</p>
        </div>
      </Layout>
    );
  }

  const handleMakeAdmin = async (userId) => {
    try {
        await updateMemberRole(token, teamId, userId, 'admin');
        setMembers(members.map((member) => 
            member.user_id === userId ? { ...member, role: 'admin' } : member
        ));
    } catch (error) {
        alert(error.message || 'Failed to promote member.');
    }finally{
      setActiveDropdown(null);
      setIsEditing(false);
    }
};

const handleRemoveMember = async (userId) => {
    try {
        await removeMemberFromTeam(token, teamId, userId);
        setMembers(members.filter((member) => member.user_id !== userId));

    } catch (error) {
        alert(error.message || 'Failed to remove member.');
    }finally{
      setActiveDropdown(null);
      setIsEditing(false);
    }
};

const handleRemoveAdmin = async (userId) => {
  try {
    await updateMemberRole(token, teamId, userId, 'member');
    setMembers(
      members.map((member) =>
        member.user_id === userId ? { ...member, role: 'member' } : member
      )
    );
  } catch (error) {
    alert(error.message || 'Failed to remove admin role.');
  } finally {
    setActiveDropdown(null);
    setIsEditing(false);
  }
};



  return (
    <Layout>
      <div className="container mx-6 p-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg border border-white/20">
          <div className="p-6">
            {team && (
              <>
                <TeamHeader 
                  team={team}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
                  <TabsList className="grid w-full grid-cols-2 max-w-[400px] mx-auto">
                    <TabsTrigger value="details" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="people" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      People
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-8">
                    <TabsContent value="details">
                      <TeamForm
                        isEditing={isEditing}
                        team={team}
                        updatedName={updatedName}
                        updatedDescription={updatedDescription}
                        setUpdatedName={setUpdatedName}
                        setUpdatedDescription={setUpdatedDescription}
                        onSave={handleSave}
                        saving={saving}
                      />
                    </TabsContent>

                    <TabsContent value="people">
                      {isEditing && (
                        <div className="mb-4 flex justify-end">
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 text-sm text-white bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Add Members
                          </button>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: { opacity: 0, scale: 0.95 },
                            visible: { opacity: 1, scale: 1 },
                          }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {members?.map((member) => (
                  <motion.div
                      key={member.user_id}
                      className="bg-white shadow-sm p-4 rounded-lg flex justify-between items-center hover:shadow-md relative"
                      
                  >
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-lg font-bold text-gray-700">
                                  {member.first_name[0].toUpperCase()}
                                  {member.last_name[0].toUpperCase()}
                              </span>
                          </div>
                          <div>
                              <p className="font-medium text-gray-900">
                                  {member.first_name} {member.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                      </div>
                      {team.role === 'admin' && member.user_id !== currentUser.userId && isEditing && (
  <div className="relative">
    <button
      onClick={() => setActiveDropdown(activeDropdown === member.user_id ? null : member.user_id)}
      className="text-gray-600 hover:text-gray-800"
    >
      <MoreHorizontal className="w-6 h-6" />
    </button>
    {activeDropdown === member.user_id && (
      <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded-md p-4 z-10 w-48">
        {member.role === 'admin' ? (
          <>
            {/* Remove Admin Option */}
            <button
              onClick={() => handleRemoveAdmin(member.user_id)}
              className="block px-6 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
            >
              Remove Admin
            </button>
            {/* Remove from Team Option */}
            <button
              onClick={() => handleRemoveMember(member.user_id)}
              className="block px-6 py-3 text-base text-red-500 hover:bg-red-100 rounded-lg w-full text-left"
            >
              Remove from Team
            </button>
          </>
        ) : (
          <>
            {/* Make Admin Option */}
            <button
              onClick={() => handleMakeAdmin(member.user_id)}
              className="block px-6 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
            >
              Make Admin
            </button>
            {/* Remove from Team Option */}
            <button
              onClick={() => handleRemoveMember(member.user_id)}
              className="block px-6 py-3 text-base text-red-500 hover:bg-red-100 rounded-lg w-full text-left"
            >
              Remove from Team
            </button>
          </>
        )}
      </div>
    )}
  </div>
)}

                  </motion.div>
              ))}

                        </motion.div>
                      </motion.div>
                    </TabsContent>
                  </div>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
          >
            <h2 className="text-lg font-semibold mb-4 text-center">Add Team Members</h2>
            <div className="space-y-4">
              {emails.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter member's email"
                    disabled={modalLoading}
                    required
                  />
                  <button
                    onClick={() => removeEmailField(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addEmailField}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                + Add another email
              </button>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2 justify-center"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <div className="loader w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      Please wait...
                    </>
                  ) : (
                    "Add Members"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
