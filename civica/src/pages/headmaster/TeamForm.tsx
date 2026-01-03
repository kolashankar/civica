import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamsApi, studentsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Check } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  grade?: string;
  team_id?: string;
}

const TeamForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [teamLeader, setTeamLeader] = useState('');
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    fetchAvailableStudents();
  }, []);

  const fetchAvailableStudents = async () => {
    try {
      if (!user?.school_id) return;

      const response = await studentsApi.getBySchool(user.school_id, {
        page: 1,
        limit: 100,
        team_status: 'unassigned',
        is_active: true
      });
      setAvailableStudents(response.students);
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        // If removing and was team leader, clear team leader
        if (teamLeader === studentId) {
          setTeamLeader('');
        }
        return prev.filter(id => id !== studentId);
      } else {
        if (prev.length >= 5) {
          alert('A team can have maximum 5 members');
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.length < 3) {
      setError('A team must have at least 3 members');
      return;
    }

    if (selectedStudents.length > 5) {
      setError('A team can have maximum 5 members');
      return;
    }

    if (!teamLeader) {
      setError('Please select a team leader');
      return;
    }

    if (!user?.school_id) {
      setError('School information not found');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await teamsApi.create({
        name: teamName,
        school_id: user.school_id,
        student_ids: selectedStudents,
        team_leader_id: teamLeader
      });

      navigate('/headmaster/teams');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/headmaster/teams')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Team</h1>
          <p className="text-gray-600 mt-1">Select 3-5 students to form a new team</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter team name"
            />
          </div>

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team Members (3-5 students) *
            </label>
            <div className="text-sm text-gray-600 mb-3">
              Selected: {selectedStudents.length} / 5
            </div>

            {availableStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No students available without teams.</p>
                <button
                  type="button"
                  onClick={() => navigate('/headmaster/students/create')}
                  className="mt-2 text-green-600 hover:text-green-700 font-medium"
                >
                  Add students first
                </button>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                {availableStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <label
                      htmlFor={`student-${student.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">
                        {student.email} • Grade {student.grade}
                      </p>
                    </label>
                    {selectedStudents.includes(student.id) && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Leader Selection */}
          {selectedStudents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Team Leader *
              </label>
              <div className="space-y-2">
                {selectedStudents.map((studentId) => {
                  const student = availableStudents.find(s => s.id === studentId);
                  if (!student) return null;

                  return (
                    <div
                      key={studentId}
                      className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        id={`leader-${studentId}`}
                        name="teamLeader"
                        value={studentId}
                        checked={teamLeader === studentId}
                        onChange={(e) => setTeamLeader(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <label
                        htmlFor={`leader-${studentId}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || selectedStudents.length < 3 || !teamLeader}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/headmaster/teams')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;