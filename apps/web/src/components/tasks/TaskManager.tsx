import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Plus, Sparkles, Filter, ShieldAlert, X, Send, Users, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Roles } from '@rrh-ems/shared';
import { API_BASE_URL } from '../../config';

export const TaskManager: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamTasks, setTeamTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my_tasks' | 'team_tasks'>('my_tasks');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [cheerUpToast, setCheerUpToast] = useState<string | null>(null);

  // New task form modal state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [priority, setPriority] = useState('MEDIUM');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canViewTeam = user?.roles.includes(Roles.MD) || user?.roles.includes(Roles.MARKETING_DIRECTOR) || user?.roles.includes(Roles.ADMIN) || user?.roles.includes(Roles.HR_MANAGER);
  const canCreateTask = user?.roles.some((r: string) => r === Roles.MD || r === Roles.HR_MANAGER || r === Roles.ADMIN || r === Roles.MARKETING_DIRECTOR);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/tasks/my-tasks`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
      }

      if (canViewTeam) {
        const teamRes = await fetchWithAuth(`${API_BASE_URL}/tasks/all-team-tasks`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamTasks(teamData.tasks || []);
        }
      }
    } catch (e) {
      console.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/md/employees`);
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error('Failed to load employees for task assignment');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
        if (data.cheerUp) {
          setCheerUpToast(`🎉 Fantastic work! Task completed! +1.0 Performance Boost added to your score!`);
          setTimeout(() => setCheerUpToast(null), 5000);
        }
      }
    } catch (e) {
      alert('Failed to update task status');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedAssignee = assigneeId ? parseInt(assigneeId, 10) : user?.id;

      const res = await fetchWithAuth(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          assignee_id: selectedAssignee,
          priority,
          deadline: deadline || new Date(Date.now() + 86400000).toISOString(),
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setAssigneeId('');
        setIsCreating(false);
        fetchTasks();
      } else {
        const data = await res.json();
        alert(`Failed to create task: ${data.error}`);
      }
    } catch (e) {
      alert('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Live relative countdown timer badge
  const getCountdownBadge = (deadlineIso: string, status: string) => {
    if (status === 'COMPLETED') return null;

    const now = new Date().getTime();
    const target = new Date(deadlineIso).getTime();
    const diff = target - now;

    if (diff < 0) {
      const minsOverdue = Math.abs(Math.floor(diff / (1000 * 60)));
      const hoursOverdue = Math.floor(minsOverdue / 60);
      const remMins = minsOverdue % 60;
      return (
        <span className="bg-red-100 text-red-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border border-red-200 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          <span>Overdue by {hoursOverdue > 0 ? `${hoursOverdue}h ${remMins}m` : `${minsOverdue}m`}</span>
        </span>
      );
    }

    const minsLeft = Math.floor(diff / (1000 * 60));
    const hoursLeft = Math.floor(minsLeft / 60);
    const remMins = minsLeft % 60;

    const isUrgentWindow = hoursLeft < 1;

    return (
      <span
        className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border ${
          isUrgentWindow ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        <Clock className="w-3 h-3 text-slate-500" />
        <span>Due in {hoursLeft > 0 ? `${hoursLeft}h ${remMins}m` : `${minsLeft}m`}</span>
      </span>
    );
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">URGENT</span>;
      case 'HIGH':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">LOW</span>;
    }
  };

  const currentTaskList = activeTab === 'my_tasks' ? tasks : teamTasks;
  const filteredTasks = currentTaskList.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative">
      {/* Cheer-Up Toast */}
      {cheerUpToast && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-teal-700 to-emerald-600 text-white p-4 rounded-2xl shadow-2xl border border-teal-400/30 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-6 h-6 text-amber-300 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Celebration Time!</h4>
            <p className="text-xs text-teal-50">{cheerUpToast}</p>
          </div>
        </div>
      )}

      {/* Main Tab Bar (My Tasks vs MD All Team Tasks) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my_tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my_tasks' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            My Assigned Tasks ({tasks.length})
          </button>

          {canViewTeam && (
            <button
              onClick={() => setActiveTab('team_tasks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'team_tasks' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Team Tasks & Progress ({teamTasks.length})</span>
            </button>
          )}
        </div>

        {canCreateTask && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filter Status Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto text-xs">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === st ? 'bg-teal-100 text-teal-800 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">No tasks found for this filter.</div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">{t.title}</span>
                  {getPriorityBadge(t.priority)}

                  {/* Red OVERDUE Status Badge */}
                  {t.status === 'OVERDUE' && (
                    <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> OVERDUE
                    </span>
                  )}
                </div>

                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}

                {t.assignee && (
                  <div className="text-[11px] text-teal-800 font-medium">
                    Assigned to: <span className="font-bold">{t.assignee.employee_code}</span>
                  </div>
                )}

                {/* Deadline & Live Countdown Timer Badge */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Deadline: {new Date(t.deadline).toLocaleString()}
                  </span>
                  {getCountdownBadge(t.deadline, t.status)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {t.status === 'COMPLETED' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 font-bold px-3 py-1 rounded-xl text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <select
                    value={t.status}
                    onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                    className="p-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETE (MARK DONE)</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Task Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative animate-scaleUp">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Task</h3>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Review Gachibowli Property Documentation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Provide task scope, instructions, or specific criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
                  >
                    <option value="">Assign to Myself ({user?.employeeCode})</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.roles.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deadline Date/Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Create & Assign Task</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
