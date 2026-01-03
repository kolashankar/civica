import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { teamsApi, schoolsApi, usersApi } from '../../services/api';
import type { Team, School, User } from '../../types';

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    school_id: '',
    student_ids: [] as string[],
    team_leader_id: '',
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [page, search, schoolFilter]);

  useEffect(() => {
    if (formData.school_id) {
      fetchStudentsBySchool(formData.school_id);
    } else {
      setStudents([]);
    }
  }, [formData.school_id]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: (page - 1) * 10,
        limit: 10,
      };
      if (search) params.search = search;
      if (schoolFilter) params.school_id = schoolFilter;
      
      const response = await teamsApi.getAll(params);
      setTeams(response.teams);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await schoolsApi.getAll({ limit: 1000 });
      setSchools(response.schools || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchStudentsBySchool = async (schoolId: string) => {
    try {
      const response = await usersApi.getAll({ role: 'student', school_id: schoolId, limit: 1000 });
      setStudents(response.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.student_ids.length === 0) {
      alert('Please select at least one student');
      return;
    }
    
    if (!formData.team_leader_id) {
      alert('Please select a team leader');
      return;
    }
    
    try {
      if (editingTeam) {
        await teamsApi.update(editingTeam.id, formData);
      } else {
        await teamsApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchTeams();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this team?')) {
      try {
        await teamsApi.delete(id);
        fetchTeams();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Error deleting team');
      }
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await teamsApi.activate(id);
      fetchTeams();
    } catch (error) {
      console.error('Error activating team:', error);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingTeam(null);
    setShowModal(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      school_id: team.school_id,
      student_ids: team.student_ids,
      team_leader_id: team.team_leader_id,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      school_id: '',
      student_ids: [],
      team_leader_id: '',
    });
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => {
      const newStudentIds = prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId];
      
      // If team leader is removed from students, clear team leader
      if (!newStudentIds.includes(prev.team_leader_id)) {
        return { ...prev, student_ids: newStudentIds, team_leader_id: '' };
      }
      
      return { ...prev, student_ids: newStudentIds };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Manage student teams</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Schools</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No teams found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Leader</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{team.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{team.school?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{team.student_ids?.length || 0} students</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{team.team_leader?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {team.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          <XCircle size={14} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(team)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={18} />
                        </button>
                        {team.is_active ? (
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(team.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 10 && (
          <div className="p-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} teams
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingTeam ? 'Edit Team' : 'Create Team'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                <select
                  required
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value, student_ids: [], team_leader_id: '' })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select school</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>

              {formData.school_id && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Students *</label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                      {students.length === 0 ? (
                        <p className="text-gray-500 text-sm">No students available in this school</p>
                      ) : (
                        students.map(student => (
                          <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.student_ids.includes(student.id)}
                              onChange={() => handleStudentToggle(student.id)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">{student.name} ({student.email})</span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.student_ids.length} student(s) selected
                    </p>
                  </div>

                  {formData.student_ids.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader *</label>
                      <select
                        required
                        value={formData.team_leader_id}
                        onChange={(e) => setFormData({ ...formData, team_leader_id: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select team leader</option>
                        {students
                          .filter(s => formData.student_ids.includes(s.id))
                          .map(student => (
                            <option key={student.id} value={student.id}>{student.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;