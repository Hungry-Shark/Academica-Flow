import React, { useState } from 'react';

export const AdminData: React.FC = () => {
  const [notes, setNotes] = useState('');

  return (
    <div className="bg-white border border-black rounded p-4">
      <h2 className="text-lg font-bold mb-2 text-black">Admin Notes</h2>
      <textarea className="w-full border border-black p-2" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-2 text-sm text-black/70">(Demo component)</div>
    </div>
  );
}; 