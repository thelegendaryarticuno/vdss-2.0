import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">VDSS 2.0</h2>
      <div className="flex items-center gap-4">
        <span className="text-gray-700">
          {user?.name} ({user?.role})
        </span>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
};
