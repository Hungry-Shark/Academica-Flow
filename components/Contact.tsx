import React from 'react';

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-700 mb-8">Have questions about Academica Flow? Reach out and we’ll get back to you.</p>
        <a href="mailto:support@academicaflow.app" className="inline-block px-6 py-3 bg-black text-white rounded-lg">Email Support</a>
      </div>
    </div>
  );
}; 