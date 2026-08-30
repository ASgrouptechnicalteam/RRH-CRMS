import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { TaskManager } from '../tasks/TaskManager';
import { Briefcase, Calendar, TrendingUp } from 'lucide-react';
import { StatCard } from '../ui';

export const StaffDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  
  const [taskCount, setTaskCount] = useState<number | string>('...');
  const [attendanceStatus, setAttendanceStatus] = useState<string>('...');
  const [performanceScore, setPerformanceScore] = useState<number | string>('...');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch tasks
        const tasksRes = await fetchWithAuth(`${API_BASE_URL}/tasks/my-tasks`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const activeTasks = (tasksData.tasks || []).filter((t: any) => t.status !== 'COMPLETED').length;
          setTaskCount(activeTasks);
        }

        // Fetch performance score
        const scoreRes = await fetchWithAuth(`${API_BASE_URL}/performance/my-score`);
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          const baseScore = scoreData.breakdown?.baseScore !== undefined ? scoreData.breakdown.baseScore : 50.0;
          const taskBoost = scoreData.breakdown?.taskBoost || 0;
          const reportBoost = scoreData.breakdown?.reportBoost || 0;
          const presentBoost = scoreData.breakdown?.presentBoost || 0;
          const latePenalty = scoreData.breakdown?.latePenalty || 0;
          const halfDayPenalty = scoreData.breakdown?.halfDayPenalty || 0;
          const belowTargetPenalty = scoreData.breakdown?.belowTargetPenalty || 0;
          
          let totalScore = baseScore + taskBoost + reportBoost + presentBoost - latePenalty - halfDayPenalty - belowTargetPenalty;
          totalScore = Math.max(0, Math.min(100, totalScore));
          
          setPerformanceScore(totalScore.toFixed(1));
        }

        // Fetch today's attendance to see status
        const today = new Date().toISOString().split('T')[0];
        const attRes = await fetchWithAuth(`${API_BASE_URL}/attendance/history?startDate=${today}&endDate=${today}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          if (attData.logs && attData.logs.length > 0) {
            setAttendanceStatus(attData.logs[0].status);
          } else {
            setAttendanceStatus('Not Checked In');
          }
        }

      } catch (err) {
        console.error('Failed to fetch staff dashboard metrics', err);
        setTaskCount('—');
        setPerformanceScore('—');
        setAttendanceStatus('—');
      }
    };
    
    fetchDashboardData();
  }, [fetchWithAuth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">My Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <strong className="text-navy-700">{user?.fullName || user?.employeeCode}</strong>. Manage your tasks and performance.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="Active Tasks" 
          value={taskCount} 
          icon={Briefcase} 
        />
        <StatCard 
          label="Today's Attendance" 
          value={attendanceStatus} 
          icon={Calendar} 
        />
        <StatCard 
          label="Performance Score" 
          value={performanceScore} 
          icon={TrendingUp} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-navy-900 mb-4">Task Management</h3>
            <TaskManager />
          </div>
        </div>
        
        <div className="space-y-6">
          <PerformanceScoreWidget />
        </div>
      </div>
    </div>
  );
};
