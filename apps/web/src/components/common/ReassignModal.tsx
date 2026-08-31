import React, { useState, useEffect } from 'react';
import { X, UserPlus, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmployeeListItem } from '../../types';
import { handleApiError, toUserFacingError } from '../../utils/userFacingError';

interface ReassignModalProps {
  entityType: 'lead' | 'property' | 'project' | 'customer';
  entityId: number;
  entityName: string;
  currentAssigneeId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  entityType,
  entityId,
  entityName,
  currentAssigneeId,
  onClose,
  onSuccess
}) => {
  const { fetchWithAuth } = useAuth();
  const { showToast , showError } = useToast();
  
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Fetch all employees in company
        const res = await fetchWithAuth('/api/employees');
        const data = await res.json();
        
        // Filter out the current assignee
        const validEmployees = (data.employees || []).filter((e: EmployeeListItem) => e.id !== currentAssigneeId && e.status === 'ACTIVE');
        setEmployees(validEmployees);
      } catch (error) {
        showError(toUserFacingError({ message: error instanceof Error ? error.message : String(error), body: error })); } finally {
        setIsFetching(false);
      }
    };
    
    fetchEmployees();
  }, [currentAssigneeId, fetchWithAuth, showToast]);

  const handleReassign = async () => {
    if (!selectedEmployeeId) {
      showError({ message: 'Please select a new assignee' });
      return;
    }
    
    if (!reason.trim()) {
      showError({ message: 'Please provide a reason for reassignment' });
      return;
    }

    setIsLoading(true);
    try {
      let endpoint = '';
      
      // Determine endpoint based on entity type
      switch (entityType) {
        case 'property':
          endpoint = `/api/properties/${entityId}/assign`;
          break;
        case 'project':
          endpoint = `/api/projects/${entityId}/assign`;
          break;
        case 'lead':
          endpoint = `/api/leads/${entityId}/reassign`;
          break;
        case 'customer':
          endpoint = `/api/customers/${entityId}/assign`;
          break;
        default:
          throw new Error('Unsupported entity type');
      }
      
      const res = await fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          assignee_id: parseInt(selectedEmployeeId, 10),
          reason
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reassign');
      }
      
      showToast(`Successfully reassigned ${entityType}`, 'success');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showError(toUserFacingError({ message: error instanceof Error ? error.message : String(error), body: error })); } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-100 text-navy-700 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Reassign {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</h2>
              <p className="text-sm text-slate-500 font-medium">{entityName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-800 font-medium">
              This action will be permanently recorded in the system audit logs. The new assignee will be notified automatically.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">New Assignee *</label>
            {isFetching ? (
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
            ) : (
              <select 
                value={selectedEmployeeId} 
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 text-sm font-medium"
              >
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code}) - {emp.role?.name || emp.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Reason for Reassignment *</label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain why this is being reassigned..."
                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 text-sm h-24 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleReassign}
            disabled={isLoading || !selectedEmployeeId || !reason.trim()}
            className="px-5 py-2.5 text-sm font-bold text-white bg-navy-600 hover:bg-navy-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Reassigning...' : 'Confirm Reassignment'}
          </button>
        </div>
      </div>
    </div>
  );
};
