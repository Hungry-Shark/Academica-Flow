import React, { useState, useEffect } from 'react';
import { AdministrativeData, Department, FacultyMember, StudentInfo, RoomInfo, UserProfile, Subject } from '../types';
import { getAdministrativeData, setAdministrativeData } from '../firebase';
import { Icon } from './Icons';
import { Sidebar } from './Sidebar';

interface AdministrativeInfoProps {
  user: UserProfile;
  onLogout: () => void;
  onNavigate: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'GENERATE_TT' | 'ADMIN_INFO') => void;
}

export const AdministrativeInfo: React.FC<AdministrativeInfoProps> = ({ user, onLogout, onNavigate }) => {
  const [adminData, setAdminData] = useState<AdministrativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sentiment' | 'departments' | 'faculties' | 'students' | 'subjects' | 'rooms'>('sentiment');
  const [isEditing, setIsEditing] = useState(false);
  const [sentiment, setSentiment] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [user.college]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (!user.college) {
        // Initialize with empty data if no college
        const emptyData: AdministrativeData = {
          departments: [],
          faculties: [],
          students: [],
          subjects: [],
          rooms: [],
          lastUpdated: Date.now()
        };
        setAdminData(emptyData);
        setLoading(false);
        return;
      }

      const data = await getAdministrativeData(user.college);
      if (data) {
        setAdminData(data);
        setSentiment(data.sentiment || '');
      } else {
        // Initialize with empty data
        const emptyData: AdministrativeData = {
          departments: [],
          faculties: [],
          students: [],
          subjects: [],
          rooms: [],
          lastUpdated: Date.now()
        };
        setAdminData(emptyData);
      }
    } catch (error) {
      console.error('Error loading administrative data:', error);
      // Initialize with empty data on error
      const emptyData: AdministrativeData = {
        departments: [],
        faculties: [],
        students: [],
        subjects: [],
        rooms: [],
        lastUpdated: Date.now()
      };
      setAdminData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  const saveAdminData = async () => {
    if (!user.college || user.college.trim() === '' || !adminData) {
      console.error('Cannot save: missing college or admin data', { college: user.college, hasAdminData: !!adminData });
      alert('Error: Please set your college information in your profile before saving administrative data.');
      return;
    }

    try {
      console.log('Saving administrative data for college:', user.college);
      console.log('Data to save:', adminData);
      
      // Update the lastUpdated timestamp
      const dataToSave = {
        ...adminData,
        sentiment,
        lastUpdated: Date.now()
      };
      
      await setAdministrativeData(user.college, dataToSave as AdministrativeData);
      console.log('Administrative data saved successfully');
      
      // Update local state with the saved data
      setAdminData(dataToSave as AdministrativeData);
      setIsEditing(false);
      
      // Show success message
      alert('Administrative data saved successfully!');
    } catch (error) {
      console.error('Error saving administrative data:', error);
      alert('Error saving data. Please try again.');
    }
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

  const addSubject = () => {
    if (!adminData) return;
    const newSubject: Subject = {
      code: '',
      name: '',
      year: 1,
      branch: '',
      discipline: '',
      credits: 0
    };
    setAdminData({
      ...adminData,
      subjects: [...(adminData.subjects || []), newSubject]
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
      <Sidebar user={user} onLogout={onLogout} isOpen={isSidebarOpen} setOpen={setSidebarOpen} onNavigate={onNavigate} />

      <main className="flex-1 flex flex-col p-6">
        <div className="lg:hidden mb-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-black bg-white border border-black">
            <Icon name="menu" className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-black">Administrative Information</h1>
          {!user.college || user.college.trim() === '' ? (
            <div className="text-red-600 text-sm">
              ⚠️ Please set your college in Profile first
            </div>
          ) : (
          <div className="flex space-x-2 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={saveAdminData}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-black text-white rounded-md hover:bg-black/80 transition"
              >
                Edit
              </button>
            )}
          </div>
          )}
        </div>

        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {(['sentiment', 'departments', 'faculties', 'students', 'subjects', 'rooms'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md transition whitespace-nowrap flex-shrink-0 ${
                activeTab === tab
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              {tab === 'sentiment' ? 'Sentiment' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === 'sentiment' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Organization Sentiment</h2>
                {isEditing && (
                  <button
                    onClick={saveAdminData}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Save
                  </button>
                )}
              </div>
              <div className="bg-white border border-black rounded p-4">
                <h3 className="text-lg font-bold mb-2 text-black">Guidance Sentiment</h3>
                <textarea 
                  className="w-full border border-black p-2" 
                  rows={6} 
                  value={sentiment} 
                  onChange={(e) => setSentiment(e.target.value)}
                  disabled={!isEditing}
                />
                <div className="mt-2 text-sm text-black/70">(High-level guidance that influences timetable generation: structure, constraints, preferences.)</div>
              </div>
            </div>
          )}
          {activeTab === 'subjects' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Subjects</h2>
                {isEditing && (
                  <button
                    onClick={addSubject}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Add Subject
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {(adminData?.subjects || []).map((subject, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                        <input
                          type="text"
                          value={subject.code}
                          onChange={(e) => {
                            const copy = [...(adminData?.subjects || [])];
                            copy[index] = { ...subject, code: e.target.value };
                            setAdminData({ ...(adminData as AdministrativeData), subjects: copy });
                          }}
                          placeholder="Code"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) => {
                            const copy = [...(adminData?.subjects || [])];
                            copy[index] = { ...subject, name: e.target.value };
                            setAdminData({ ...(adminData as AdministrativeData), subjects: copy });
                          }}
                          placeholder="Name"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="number"
                          value={subject.year}
                          onChange={(e) => {
                            const copy = [...(adminData?.subjects || [])];
                            copy[index] = { ...subject, year: parseInt(e.target.value) };
                            setAdminData({ ...(adminData as AdministrativeData), subjects: copy });
                          }}
                          placeholder="Year"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={subject.branch}
                          onChange={(e) => {
                            const copy = [...(adminData?.subjects || [])];
                            copy[index] = { ...subject, branch: e.target.value };
                            setAdminData({ ...(adminData as AdministrativeData), subjects: copy });
                          }}
                          placeholder="Branch"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          value={subject.discipline || ''}
                          onChange={(e) => {
                            const copy = [...(adminData?.subjects || [])];
                            copy[index] = { ...subject, discipline: e.target.value };
                            setAdminData({ ...(adminData as AdministrativeData), subjects: copy });
                          }}
                          placeholder="Discipline"
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="number"
                          value={subject.credits || 0}
                          onChange={(e) => {
                            const copy = [...(adminData?.subjects || [])];
                            copy[index] = { ...subject, credits: parseInt(e.target.value) };
                            setAdminData({ ...(adminData as AdministrativeData), subjects: copy });
                          }}
                          placeholder="Credits"
                          className="w-full p-2 border rounded"
                        />
                        <div className="md:col-span-6">
                          <button
                            onClick={() => {
                              const copy = [...(adminData?.subjects || [])];
                              copy.splice(index, 1);
                              setAdminData({ ...(adminData as AdministrativeData), subjects: copy });
                            }}
                            className="mt-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">{subject.code} - {subject.name}</h3>
                        <p className="text-gray-600">Year {subject.year} • {subject.branch}{subject.discipline ? ` • ${subject.discipline}` : ''}{typeof subject.credits === 'number' ? ` • ${subject.credits} credits` : ''}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
