import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, RefreshCw, Ban, Trash2, Calendar, Filter } from 'lucide-react';
import { inspectionsApi, schoolsApi, officesApi, teamsApi, templatesApi } from '../../services/api';
import type { Inspection, School, Office, Team, Template } from '../../types';

const Inspections: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [formData, setFormData] = useState({
    task_name: '',
    task_description: '',
    school_id: '',
    office_id: '',
    template_id: '',
    team_id: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    auto_assign: true,
  });
  const [reassignTeamId, setReassignTeamId] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'responded', label: 'Responded' },
    { value: 'closed', label: 'Closed' },
    { value: 'escalated', label: 'Escalated' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  useEffect(() => {
    fetchSchools();
    fetchOffices();
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [page, statusFilter, schoolFilter, officeFilter, priorityFilter]);

  useEffect(() => {
    if (formData.school_id) {
      fetchTeamsBySchool(formData.school_id);
    } else {
      setTeams([]);
    }
  }, [formData.school_id]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: (page - 1) * 10,
        limit: 10,
      };
      if (statusFilter) params.status = statusFilter;
      if (schoolFilter) params.school_id = schoolFilter;
      if (officeFilter) params.office_id = officeFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      const response = await inspectionsApi.getAll(params);
      setInspections(response.inspections);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching inspections:', error);
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

  const fetchOffices = async () => {
    try {
      const response = await officesApi.getAll({ limit: 1000 });
      setOffices(response.offices || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await templatesApi.getAllActive();
      setTemplates(response || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchTeamsBySchool = async (schoolId: string) => {
    try {
      const response = await teamsApi.getBySchool(schoolId);
      setTeams(response || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: any = {
        task_name: formData.task_name,
        task_description: formData.task_description,
        school_id: formData.school_id,
        office_id: formData.office_id,
        template_id: formData.template_id,
        due_date: new Date(formData.due_date).toISOString(),
        priority: formData.priority,
      };

      if (!formData.auto_assign && formData.team_id) {
        payload.team_id = formData.team_id;
      }

      await inspectionsApi.create({ ...payload, auto_assign: formData.auto_assign });
      setShowModal(false);
      resetForm();
      fetchInspections();
      alert('Inspection created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create inspection');
    }
  };

  const handleReassign = async () => {
    if (!selectedInspection || !reassignTeamId) return;
    
    try {
      await inspectionsApi.reassign(selectedInspection.id, reassignTeamId);
      setShowReassignModal(false);
      setReassignTeamId('');
      fetchInspections();
      alert('Inspection reassigned successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to reassign inspection');
    }
  };

  const handleOverrideStatus = async () => {
    if (!selectedInspection || !overrideStatus || !overrideReason) {
      alert('Please provide both status and reason');
      return;
    }
    
    try {
      await inspectionsApi.overrideStatus(selectedInspection.id, overrideStatus, overrideReason);
      setShowOverrideModal(false);
      setOverrideStatus('');
      setOverrideReason('');
      fetchInspections();
      alert('Inspection status updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inspection? This action cannot be undone.')) {
      try {
        await inspectionsApi.delete(id);
        fetchInspections();
        alert('Inspection deleted successfully!');
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Failed to delete inspection');
      }
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openDetailModal = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowDetailModal(true);
  };

  const openReassignModal = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    fetchTeamsBySchool(inspection.school_id);
    setShowReassignModal(true);
  };

  const openOverrideModal = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setOverrideStatus(inspection.status);
    setShowOverrideModal(true);
  };

  const resetForm = () => {
    setFormData({
      task_name: '',
      task_description: '',
      school_id: '',
      office_id: '',
      template_id: '',
      team_id: '',
      due_date: '',
      priority: 'medium',
      auto_assign: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      assigned: 'bg-blue-100 text-blue-800',
      submitted: 'bg-purple-100 text-purple-800',
      responded: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-600 mt-1">Manage all inspection tasks</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Inspection
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
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

            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Offices</option>
              {offices.map(office => (
                <option key={office.id} value={office.id}>{office.name}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorityOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setStatusFilter('');
                setSchoolFilter('');
                setOfficeFilter('');
                setPriorityFilter('');
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : inspections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No inspections found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Office</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{inspection.task_name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{inspection.task_description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{inspection.school?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{inspection.office?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{inspection.team?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(inspection.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(inspection.priority)}`}>
                        {inspection.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(inspection.status)}`}>
                        {inspection.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetailModal(inspection)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openReassignModal(inspection)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Reassign"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => openOverrideModal(inspection)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Override Status"
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(inspection.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
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
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} inspections
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

      {/* Create Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Create Inspection</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                <input
                  type="text"
                  required
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Description *</label>
                <textarea
                  required
                  value={formData.task_description}
                  onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                  <select
                    required
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value, team_id: '' })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select school</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office *</label>
                  <select
                    required
                    value={formData.office_id}
                    onChange={(e) => setFormData({ ...formData, office_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select office</option>
                    {offices.map(office => (
                      <option key={office.id} value={office.id}>{office.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template *</label>
                <select
                  required
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_assign}
                    onChange={(e) => setFormData({ ...formData, auto_assign: e.target.checked, team_id: '' })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-assign team (Random)</span>
                </label>

                {!formData.auto_assign && formData.school_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Team *</label>
                    <select
                      required={!formData.auto_assign}
                      value={formData.team_id}
                      onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

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
                  Create Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Reassign Inspection</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedInspection.task_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select New Team *</label>
                <select
                  value={reassignTeamId}
                  onChange={(e) => setReassignTeamId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassign}
                  disabled={!reassignTeamId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Override Status Modal */}
      {showOverrideModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Override Status</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedInspection.task_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status *</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="assigned">Assigned</option>
                  <option value="submitted">Submitted</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for status override"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverrideStatus}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Override Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Simple version for now */}
      {showDetailModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Inspection Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Task Name</p>
                  <p className="font-medium">{selectedInspection.task_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedInspection.status)}`}>
                    {selectedInspection.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">School</p>
                  <p className="font-medium">{selectedInspection.school?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Office</p>
                  <p className="font-medium">{selectedInspection.office?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Team</p>
                  <p className="font-medium">{selectedInspection.team?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(selectedInspection.priority)}`}>
                    {selectedInspection.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{new Date(selectedInspection.due_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{selectedInspection.task_description}</p>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspections;
