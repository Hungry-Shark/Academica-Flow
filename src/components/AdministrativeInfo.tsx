import React, { useState, useEffect } from 'react';
import { AdministrativeData, Department, FacultyMember, StudentInfo, RoomInfo } from '../types';
import { getAdministrativeData, setAdministrativeData } from '../firebase';
import { Icon } from './Icons';

interface AdministrativeInfoProps {
  user: any;
  onLogout: () => void;
  onNavigate: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'GENERATE_TT') => void;
}

export const AdministrativeInfo: React.FC<AdministrativeInfoProps> = ({ user, onLogout, onNavigate }) => {
  const [adminData, setAdminData] = useState<AdministrativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'faculties' | 'students' | 'rooms'>('departments');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [user.college]);

  const loadAdminData = async () => {
    if (!user.college) return;
    setLoading(true);
    const data = await getAdministrativeData(user.college);
    if (data) {
      setAdminData(data);
    } else {
      // Initialize with empty data
      const emptyData: AdministrativeData = {
        departments: [],
        faculties: [],
        students: [],
        rooms: [],
        lastUpdated: Date.now()
      };
      setAdminData(emptyData);
    }
    setLoading(false);
  };

  const saveAdminData = async () => {
    if (!user.college || !adminData) return;
    await setAdministrativeData(user.college, adminData);
    setIsEditing(false);
  };

  const addDepartment = () => {
    if (!adminData) return;
    const newDept: Department = {
      id: Date.now().toString(),
      name: '',
      code: '',
      hodId: '',
      description: ''
    };
    setAdminData({
      ...adminData,
      departments: [...adminData.departments, newDept]
    });
  };

  const addFaculty = () => {
    if (!adminData) return;
    const newFaculty: FacultyMember = {
      id: Date.now().toString(),
      name: '',
      email: '',
      department: '',
      role: 'Assistant Professor',
      specialization: [],
      phone: ''
    };
    setAdminData({
      ...adminData,
      faculties: [...adminData.faculties, newFaculty]
    });
  };

  const addStudentInfo = () => {
    if (!adminData) return;
    const newStudentInfo: StudentInfo = {
      year: 1,
      branch: '',
      totalStudents: 0,
      sections: { 'A': 0 }
    };
    setAdminData({
      ...adminData,
      students: [...adminData.students, newStudentInfo]
    });
  };

  const addRoom = () => {
    if (!adminData) return;
    const newRoom: RoomInfo = {
      id: Date.now().toString(),
      name: '',
      type: 'Classroom',
      capacity: 0,
      department: '',
      floor: 1,
      building: '',
      equipment: []
    };
    setAdminData({
      ...adminData,
      rooms: [...adminData.rooms, newRoom]
    });
  };

  const updateItem = (type: keyof AdministrativeData, id: string, field: string, value: any) => {
    if (!adminData) return;
    const items = adminData[type] as any[];
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setAdminData({ ...adminData, [type]: updatedItems });
  };

  const deleteItem = (type: keyof AdministrativeData, id: string) => {
    if (!adminData) return;
    const items = adminData[type] as any[];
    const updatedItems = items.filter(item => item.id !== id);
    setAdminData({ ...adminData, [type]: updatedItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon name="spinner" className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading administrative data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="w-64 bg-black text-white p-4">
        <div className="mb-8 flex items-center space-x-3">
          <Icon name="logo" className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold font-wakanda">Academica Flow</h1>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-2 rounded-md">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-white/70 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('DASHBOARD')}
            className="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors flex items-center space-x-3"
          >
            <Icon name="dashboard" className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => onNavigate('GENERATE_TT')}
            className="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors flex items-center space-x-3"
          >
            <Icon name="calendar" className="w-5 h-5" />
            <span>Generate TT</span>
          </button>
          <button
            onClick={() => onNavigate('PROFILE_EDIT')}
            className="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors flex items-center space-x-3"
          >
            <Icon name="profile" className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
        <div className="mt-auto">
          <button
            onClick={onLogout}
            className="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Administrative Information</h1>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={saveAdminData}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/80 transition"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          {(['departments', 'faculties', 'students', 'rooms'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md transition ${
                activeTab === tab
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === 'departments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Departments</h2>
                {isEditing && (
                  <button
                    onClick={addDepartment}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Add Department
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {adminData?.departments.map((dept) => (
                  <div key={dept.id} className="border rounded-lg p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={dept.name}
                          onChange={(e) => updateItem('departments', dept.id, 'name', e.target.value)}
                          placeholder="Department Name"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={dept.code}
                          onChange={(e) => updateItem('departments', dept.id, 'code', e.target.value)}
                          placeholder="Department Code"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={dept.hodId}
                          onChange={(e) => updateItem('departments', dept.id, 'hodId', e.target.value)}
                          placeholder="HOD ID"
                          className="w-full p-2 border rounded"
                        />
                        <textarea
                          value={dept.description || ''}
                          onChange={(e) => updateItem('departments', dept.id, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full p-2 border rounded"
                          rows={2}
                        />
                        <button
                          onClick={() => deleteItem('departments', dept.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">{dept.name} ({dept.code})</h3>
                        <p className="text-gray-600">HOD ID: {dept.hodId}</p>
                        {dept.description && <p className="text-gray-600">{dept.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faculties' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Faculty Members</h2>
                {isEditing && (
                  <button
                    onClick={addFaculty}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Add Faculty
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {adminData?.faculties.map((faculty) => (
                  <div key={faculty.id} className="border rounded-lg p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={faculty.name}
                          onChange={(e) => updateItem('faculties', faculty.id, 'name', e.target.value)}
                          placeholder="Faculty Name"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="email"
                          value={faculty.email}
                          onChange={(e) => updateItem('faculties', faculty.id, 'email', e.target.value)}
                          placeholder="Email"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={faculty.department}
                          onChange={(e) => updateItem('faculties', faculty.id, 'department', e.target.value)}
                          placeholder="Department"
                          className="w-full p-2 border rounded"
                        />
                        <select
                          value={faculty.role}
                          onChange={(e) => updateItem('faculties', faculty.id, 'role', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="HOD">HOD</option>
                          <option value="Professor">Professor</option>
                          <option value="Associate Professor">Associate Professor</option>
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="Lab Assistant">Lab Assistant</option>
                          <option value="Teaching Assistant">Teaching Assistant</option>
                        </select>
                        <input
                          type="text"
                          value={faculty.phone || ''}
                          onChange={(e) => updateItem('faculties', faculty.id, 'phone', e.target.value)}
                          placeholder="Phone"
                          className="w-full p-2 border rounded"
                        />
                        <button
                          onClick={() => deleteItem('faculties', faculty.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">{faculty.name}</h3>
                        <p className="text-gray-600">{faculty.email}</p>
                        <p className="text-gray-600">{faculty.department} - {faculty.role}</p>
                        {faculty.phone && <p className="text-gray-600">Phone: {faculty.phone}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Student Information</h2>
                {isEditing && (
                  <button
                    onClick={addStudentInfo}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Add Student Info
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {adminData?.students.map((student, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={student.year}
                          onChange={(e) => updateItem('students', index.toString(), 'year', parseInt(e.target.value))}
                          placeholder="Year"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={student.branch}
                          onChange={(e) => updateItem('students', index.toString(), 'branch', e.target.value)}
                          placeholder="Branch"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="number"
                          value={student.totalStudents}
                          onChange={(e) => updateItem('students', index.toString(), 'totalStudents', parseInt(e.target.value))}
                          placeholder="Total Students"
                          className="w-full p-2 border rounded"
                        />
                        <button
                          onClick={() => deleteItem('students', index.toString())}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">Year {student.year} - {student.branch}</h3>
                        <p className="text-gray-600">Total Students: {student.totalStudents}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Room Information</h2>
                {isEditing && (
                  <button
                    onClick={addRoom}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Add Room
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {adminData?.rooms.map((room) => (
                  <div key={room.id} className="border rounded-lg p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => updateItem('rooms', room.id, 'name', e.target.value)}
                          placeholder="Room Name"
                          className="w-full p-2 border rounded"
                        />
                        <select
                          value={room.type}
                          onChange={(e) => updateItem('rooms', room.id, 'type', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="Lecture Hall">Lecture Hall</option>
                          <option value="Lab">Lab</option>
                          <option value="Classroom">Classroom</option>
                          <option value="Conference Room">Conference Room</option>
                          <option value="Library">Library</option>
                        </select>
                        <input
                          type="number"
                          value={room.capacity}
                          onChange={(e) => updateItem('rooms', room.id, 'capacity', parseInt(e.target.value))}
                          placeholder="Capacity"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={room.department}
                          onChange={(e) => updateItem('rooms', room.id, 'department', e.target.value)}
                          placeholder="Department"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="number"
                          value={room.floor}
                          onChange={(e) => updateItem('rooms', room.id, 'floor', parseInt(e.target.value))}
                          placeholder="Floor"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={room.building}
                          onChange={(e) => updateItem('rooms', room.id, 'building', e.target.value)}
                          placeholder="Building"
                          className="w-full p-2 border rounded"
                        />
                        <button
                          onClick={() => deleteItem('rooms', room.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">{room.name}</h3>
                        <p className="text-gray-600">{room.type} - Capacity: {room.capacity}</p>
                        <p className="text-gray-600">{room.department} - Floor {room.floor}, {room.building}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
