import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">About Academica Flow</h1>
        <p className="text-gray-700">Academica Flow streamlines academic scheduling with role-based tools for students, faculty, and admins.</p>
      </div>
    </div>
  );
}; 