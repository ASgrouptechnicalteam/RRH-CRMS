import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminCommandCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-8 text-center text-slate-600">
      <h2 className="text-2xl font-bold text-slate-900">System Command Center</h2>
      <p className="mt-4">Admin dashboard — under construction</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-6 px-4 py-2 bg-primary/10 text-navy rounded-md hover:bg-primary/20 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
};