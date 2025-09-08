import React, { useState, Fragment } from 'react';
import { Course, Faculty, Room } from '../types';
import { Icon } from './Icons';
import { Dialog, Transition } from '@headlessui/react';

// Placeholder Data
const initialCourses: Course[] = [
  { id: 'c1', name: 'Introduction to AI', code: 'CS101', credits: 3 },
  { id: 'c2', name: 'Data Structures', code: 'CS201', credits: 4 },
  { id: 'c3', name: 'Web Development', code: 'CS301', credits: 3 },
];

const initialFaculty: Faculty[] = [
  { id: 'f1', name: 'Dr. Alan Turing', department: 'Computer Science', expertise: ['AI', 'Theory'] },
  { id: 'f2', name: 'Dr. Ada Lovelace', department: 'Computer Science', expertise: ['Algorithms'] },
];

const initialRooms: Room[] = [
  { id: 'r1', name: 'Room 101', capacity: 50, type: 'Classroom' },
  { id: 'r2', name: 'Lab A', capacity: 30, type: 'Lab' },
  { id: 'r3', name: 'Hall C', capacity: 150, type: 'Lecture Hall' },
];

type DataType = 'courses' | 'faculty' | 'rooms';

export const AdminData: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DataType>('courses');
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const [faculty, setFaculty] = useState<Faculty[]>(initialFaculty);
    const [rooms, setRooms] = useState<Room[]>(initialRooms);

    // TODO: Implement modal and CRUD logic here later if needed

    const renderTable = () => {
        switch (activeTab) {
            case 'courses':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                             <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black/80 transition">Add New Course</button>
                        </div>
                        <table className="min-w-full bg-white rounded-lg border border-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left p-3 text-sm font-semibold text-black">Name</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Code</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Credits</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(c => (
                                    <tr key={c.id} className="border-b border-black last:border-b-0">
                                        <td className="p-3 text-sm text-black">{c.name}</td>
                                        <td className="p-3 text-sm text-black">{c.code}</td>
                                        <td className="p-3 text-sm text-black">{c.credits}</td>
                                        <td className="p-3 text-sm text-black space-x-2">
                                            <button className="text-black hover:underline">Edit</button>
                                            <button className="text-black hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'faculty':
                 return (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                             <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black/80 transition">Add New Faculty</button>
                        </div>
                        <table className="min-w-full bg-white rounded-lg border border-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left p-3 text-sm font-semibold text-black">Name</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Department</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Expertise</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {faculty.map(f => (
                                    <tr key={f.id} className="border-b border-black last:border-b-0">
                                        <td className="p-3 text-sm text-black">{f.name}</td>
                                        <td className="p-3 text-sm text-black">{f.department}</td>
                                        <td className="p-3 text-sm text-black">{f.expertise.join(', ')}</td>
                                        <td className="p-3 text-sm text-black space-x-2">
                                            <button className="text-black hover:underline">Edit</button>
                                            <button className="text-black hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'rooms':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                             <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black/80 transition">Add New Room</button>
                        </div>
                        <table className="min-w-full bg-white rounded-lg border border-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left p-3 text-sm font-semibold text-black">Name</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Capacity</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Type</th>
                                    <th className="text-left p-3 text-sm font-semibold text-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map(r => (
                                    <tr key={r.id} className="border-b border-black last:border-b-0">
                                        <td className="p-3 text-sm text-black">{r.name}</td>
                                        <td className="p-3 text-sm text-black">{r.capacity}</td>
                                        <td className="p-3 text-sm text-black">{r.type}</td>
                                        <td className="p-3 text-sm text-black space-x-2">
                                            <button className="text-black hover:underline">Edit</button>
                                            <button className="text-black hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return null;
        }
    }

    const getTabClass = (tabName: DataType) => 
        `px-3 py-2 text-sm font-medium transition-colors ${activeTab === tabName ? 'border-b-2 border-black text-black' : 'text-black/60 hover:text-black'}`;

    return (
        <div className="bg-white p-4 rounded-lg border border-black flex-1">
            <div className="flex space-x-2 border-b border-black mb-4">
                <button onClick={() => setActiveTab('courses')} className={getTabClass('courses')}>Courses</button>
                <button onClick={() => setActiveTab('faculty')} className={getTabClass('faculty')}>Faculty</button>
                <button onClick={() => setActiveTab('rooms')} className={getTabClass('rooms')}>Rooms</button>
            </div>
            <div>
                {renderTable()}
            </div>
        </div>
    )
}