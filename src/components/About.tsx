import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-8">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">About Academica Flow</h1>
        <p className="text-gray-700 mb-6">
          Academica Flow is a next-generation AI-powered timetable system designed for full NEP 2020 compliance. Our platform enables multidisciplinary scheduling, flexible credit systems, and role-based management for institutions, faculty, and students.
        </p>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-900">NEP 2020 Policy Highlights</h2>
          <ul className="list-disc list-inside text-left text-gray-800 mx-auto max-w-xl">
            <li>5+3+3+4 academic structure support</li>
            <li>Choice-based credit system (CBCS) with core, elective, and skill courses</li>
            <li>Flexible multidisciplinary course enrollment</li>
            <li>Mother tongue/local language integration</li>
            <li>Multiple entry/exit points and credit accumulation</li>
            <li>Project work, internships, and cultural activity scheduling</li>
          </ul>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-green-900">Before & After: Multidisciplinary Scheduling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-gray-50 border border-gray-300 rounded p-4">
              <h3 className="font-bold text-lg mb-2 text-red-700">Before Academica Flow</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Rigid, department-centric timetables</li>
                <li>Limited elective options</li>
                <li>Manual conflict resolution</li>
                <li>No cross-disciplinary enrollment</li>
                <li>Static scheduling, no real-time updates</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-300 rounded p-4">
              <h3 className="font-bold text-lg mb-2 text-green-700">After Academica Flow</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Dynamic, AI-optimized multidisciplinary timetables</li>
                <li>Wide range of electives and skill courses</li>
                <li>Automated conflict detection and resolution</li>
                <li>Cross-departmental enrollment enabled</li>
                <li>Real-time updates and notifications</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Why Choose Academica Flow?</h2>
          <p className="text-gray-700">
            Our system empowers institutions to fully realize NEP 2020 goals, providing students and faculty with flexible, personalized, and conflict-free schedules. Experience the future of academic planning today!
          </p>
        </div>
      </div>
    </div>
  );
}; 