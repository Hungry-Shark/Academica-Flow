import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icons';
import { SubjectDetails, NepCategory } from '../../types/nep-interfaces';

interface SubjectManagementComponentProps {
  onBack: () => void;
}

interface SubjectFormData {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  nepCategory: NepCategory;
  subjectType: 'LECTURE' | 'TUTORIAL' | 'PRACTICAL' | 'LABORATORY' | 'SEMINAR';
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  assessmentPattern: {
    continuousAssessment: number;
    midTerm: number;
    finalExam: number;
    practical: number;
  };
  prerequisites: string[];
  corequisites: string[];
  roomRequirements: {
    roomType: 'LECTURE_HALL' | 'TUTORIAL_ROOM' | 'COMPUTER_LAB' | 'LABORATORY' | 'SEMINAR_ROOM';
    minCapacity: number;
    equipment: string[];
  };
  practicalSessionDuration: number;
  isOffered: boolean;
  maxStudents: number;
  currentEnrollment: number;
  departmentId: string;
  semester: string;
  academicYear: string;
}

interface RoomType {
  id: string;
  name: string;
  type: 'LECTURE_HALL' | 'TUTORIAL_ROOM' | 'COMPUTER_LAB' | 'LABORATORY' | 'SEMINAR_ROOM';
  capacity: number;
  equipment: string[];
}

const NEP_CATEGORIES: NepCategory[] = ['CORE', 'ELECTIVE', 'SKILL_BASED', 'FOUNDATION', 'INTERDISCIPLINARY', 'PROJECT', 'INTERNSHIP', 'RESEARCH'];

const SUBJECT_TYPES = [
  { value: 'LECTURE', label: 'Lecture' },
  { value: 'TUTORIAL', label: 'Tutorial' },
  { value: 'PRACTICAL', label: 'Practical' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'SEMINAR', label: 'Seminar' }
];

const ROOM_TYPES = [
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'TUTORIAL_ROOM', label: 'Tutorial Room' },
  { value: 'COMPUTER_LAB', label: 'Computer Lab' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'SEMINAR_ROOM', label: 'Seminar Room' }
];

const EQUIPMENT_OPTIONS = [
  'Projector', 'Whiteboard', 'Computer', 'Internet', 'Audio System',
  'Microscope', 'Bunsen Burner', 'Test Tubes', 'Safety Equipment',
  'Software Licenses', 'Specialized Tools', 'Models', 'Charts'
];

export const SubjectManagementComponent: React.FC<SubjectManagementComponentProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<SubjectFormData[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<SubjectFormData>({
    id: '',
    code: '',
    name: '',
    description: '',
    credits: 0,
    nepCategory: 'CORE',
    subjectType: 'LECTURE',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 0,
    assessmentPattern: {
      continuousAssessment: 40,
      midTerm: 20,
      finalExam: 40,
      practical: 0
    },
    prerequisites: [],
    corequisites: [],
    roomRequirements: {
      roomType: 'LECTURE_HALL',
      minCapacity: 50,
      equipment: []
    },
    practicalSessionDuration: 2,
    isOffered: true,
    maxStudents: 50,
    currentEnrollment: 0,
    departmentId: '',
    semester: 'Odd',
    academicYear: '2024-25'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Mock data - replace with actual API calls
    setSubjects([
      {
        id: '1',
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Basic programming concepts and problem solving',
        credits: 4,
        nepCategory: 'CORE',
        subjectType: 'LECTURE',
        lectureHours: 3,
        tutorialHours: 1,
        practicalHours: 2,
        assessmentPattern: {
          continuousAssessment: 40,
          midTerm: 20,
          finalExam: 40,
          practical: 0
        },
        prerequisites: [],
        corequisites: [],
        roomRequirements: {
          roomType: 'COMPUTER_LAB',
          minCapacity: 40,
          equipment: ['Computer', 'Internet', 'Projector']
        },
        practicalSessionDuration: 2,
        isOffered: true,
        maxStudents: 50,
        currentEnrollment: 25,
        departmentId: 'dept1',
        semester: 'Odd',
        academicYear: '2024-25'
      }
    ]);

    setRooms([
      { id: 'room1', name: 'Lecture Hall 1', type: 'LECTURE_HALL', capacity: 100, equipment: ['Projector', 'Whiteboard', 'Audio System'] },
      { id: 'room2', name: 'Computer Lab A', type: 'COMPUTER_LAB', capacity: 40, equipment: ['Computer', 'Internet', 'Projector'] },
      { id: 'room3', name: 'Tutorial Room 1', type: 'TUTORIAL_ROOM', capacity: 30, equipment: ['Whiteboard', 'Projector'] }
    ]);

    setDepartments([
      { id: 'dept1', name: 'Computer Science', code: 'CS' },
      { id: 'dept2', name: 'Mathematics', code: 'MATH' },
      { id: 'dept3', name: 'Physics', code: 'PHY' }
    ]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = 'Subject code is required';
    if (!formData.name.trim()) newErrors.name = 'Subject name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.credits < 1 || formData.credits > 10) newErrors.credits = 'Credits must be between 1 and 10';
    if (formData.lectureHours < 0) newErrors.lectureHours = 'Lecture hours cannot be negative';
    if (formData.tutorialHours < 0) newErrors.tutorialHours = 'Tutorial hours cannot be negative';
    if (formData.practicalHours < 0) newErrors.practicalHours = 'Practical hours cannot be negative';
    if (formData.maxStudents < 1) newErrors.maxStudents = 'Max students must be at least 1';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    
    // Validate assessment pattern totals
    const totalAssessment = formData.assessmentPattern.continuousAssessment + 
                           formData.assessmentPattern.midTerm + 
                           formData.assessmentPattern.finalExam + 
                           formData.assessmentPattern.practical;
    if (totalAssessment !== 100) {
      newErrors.assessmentPattern = 'Assessment pattern must total 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isCreating) {
      const newSubject = { ...formData, id: Date.now().toString() };
      setSubjects([...subjects, newSubject]);
      setIsCreating(false);
    } else if (isEditing && selectedSubject) {
      setSubjects(subjects.map(s => s.id === selectedSubject.id ? formData : s));
      setIsEditing(false);
      setSelectedSubject(null);
    }

    resetForm();
  };

  const handleEdit = (subject: SubjectFormData) => {
    setSelectedSubject(subject);
    setFormData(subject);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
    setSelectedSubject(null);
  };

  const handleDelete = (subjectId: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      setSubjects(subjects.filter(s => s.id !== subjectId));
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      code: '',
      name: '',
      description: '',
      credits: 0,
      nepCategory: 'CORE',
      subjectType: 'LECTURE',
      lectureHours: 0,
      tutorialHours: 0,
      practicalHours: 0,
      assessmentPattern: {
        continuousAssessment: 40,
        midTerm: 20,
        finalExam: 40,
        practical: 0
      },
      prerequisites: [],
      corequisites: [],
      roomRequirements: {
        roomType: 'LECTURE_HALL',
        minCapacity: 50,
        equipment: []
      },
      practicalSessionDuration: 2,
      isOffered: true,
      maxStudents: 50,
      currentEnrollment: 0,
      departmentId: '',
      semester: 'Odd',
      academicYear: '2024-25'
    });
    setErrors({});
  };

  const handlePrerequisiteChange = (prerequisite: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        prerequisites: [...formData.prerequisites, prerequisite]
      });
    } else {
      setFormData({
        ...formData,
        prerequisites: formData.prerequisites.filter(p => p !== prerequisite)
      });
    }
  };

  const handleCorequisiteChange = (corequisite: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        corequisites: [...formData.corequisites, corequisite]
      });
    } else {
      setFormData({
        ...formData,
        corequisites: formData.corequisites.filter(c => c !== corequisite)
      });
    }
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        roomRequirements: {
          ...formData.roomRequirements,
          equipment: [...formData.roomRequirements.equipment, equipment]
        }
      });
    } else {
      setFormData({
        ...formData,
        roomRequirements: {
          ...formData.roomRequirements,
          equipment: formData.roomRequirements.equipment.filter(e => e !== equipment)
        }
      });
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return;

    setUploadProgress(0);
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowBulkUpload(false);
          setCsvFile(null);
          // Process CSV data here
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || subject.nepCategory === filterCategory;
    const matchesDepartment = !filterDepartment || subject.departmentId === filterDepartment;
    
    return matchesSearch && matchesCategory && matchesDepartment;
  });

  const getCategoryColor = (category: NepCategory) => {
    switch (category) {
      case 'CORE': return 'bg-blue-100 text-blue-800';
      case 'ELECTIVE': return 'bg-green-100 text-green-800';
      case 'SKILL_BASED': return 'bg-purple-100 text-purple-800';
      case 'FOUNDATION': return 'bg-yellow-100 text-yellow-800';
      case 'INTERDISCIPLINARY': return 'bg-indigo-100 text-indigo-800';
      case 'PROJECT': return 'bg-pink-100 text-pink-800';
      case 'INTERNSHIP': return 'bg-orange-100 text-orange-800';
      case 'RESEARCH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Icon name="arrow-left" className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Subject Management</h1>
                <p className="text-gray-600 mt-1">Manage subjects, NEP categories, and assessment patterns</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Icon name="upload" className="w-4 h-4" />
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Icon name="plus" className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, name, or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NEP Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {NEP_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterDepartment('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Subjects ({filteredSubjects.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredSubjects.map(subject => (
                  <div key={subject.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-lg">
                              {subject.code.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {subject.code} - {subject.name}
                            </h3>
                            <p className="text-gray-600">{subject.description}</p>
                            <p className="text-sm text-gray-500">{subject.credits} credits • {subject.subjectType}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(subject.nepCategory)}`}>
                            {subject.nepCategory}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            {subject.lectureHours}L + {subject.tutorialHours}T + {subject.practicalHours}P
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            {subject.currentEnrollment}/{subject.maxStudents} students
                          </span>
                          {subject.isOffered ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Offered
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Not Offered
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Assessment: {subject.assessmentPattern.continuousAssessment}% + {subject.assessmentPattern.midTerm}% + {subject.assessmentPattern.finalExam}%</span>
                          <span>Room: {subject.roomRequirements.roomType}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:col-span-1">
            {(isCreating || isEditing) && (
              <div className="bg-white rounded-lg shadow-sm sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isCreating ? 'Add New Subject' : 'Edit Subject'}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.code ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.description ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Credits *</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.credits}
                            onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.credits ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.credits && <p className="text-red-500 text-xs mt-1">{errors.credits}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Type</label>
                          <select
                            value={formData.subjectType}
                            onChange={(e) => setFormData({ ...formData, subjectType: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {SUBJECT_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NEP Category</label>
                        <select
                          value={formData.nepCategory}
                          onChange={(e) => setFormData({ ...formData, nepCategory: e.target.value as NepCategory })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {NEP_CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                        <select
                          value={formData.departmentId}
                          onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.departmentId ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                        {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Contact Hours */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Hours</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Hours</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.lectureHours}
                          onChange={(e) => setFormData({ ...formData, lectureHours: parseInt(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.lectureHours ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.lectureHours && <p className="text-red-500 text-xs mt-1">{errors.lectureHours}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutorial Hours</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.tutorialHours}
                          onChange={(e) => setFormData({ ...formData, tutorialHours: parseInt(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.tutorialHours ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.tutorialHours && <p className="text-red-500 text-xs mt-1">{errors.tutorialHours}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Practical Hours</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.practicalHours}
                          onChange={(e) => setFormData({ ...formData, practicalHours: parseInt(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.practicalHours ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.practicalHours && <p className="text-red-500 text-xs mt-1">{errors.practicalHours}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Assessment Pattern */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Pattern</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Continuous Assessment (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.assessmentPattern.continuousAssessment}
                          onChange={(e) => setFormData({
                            ...formData,
                            assessmentPattern: {
                              ...formData.assessmentPattern,
                              continuousAssessment: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mid-term (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.assessmentPattern.midTerm}
                          onChange={(e) => setFormData({
                            ...formData,
                            assessmentPattern: {
                              ...formData.assessmentPattern,
                              midTerm: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Final Exam (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.assessmentPattern.finalExam}
                          onChange={(e) => setFormData({
                            ...formData,
                            assessmentPattern: {
                              ...formData.assessmentPattern,
                              finalExam: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Practical (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.assessmentPattern.practical}
                          onChange={(e) => setFormData({
                            ...formData,
                            assessmentPattern: {
                              ...formData.assessmentPattern,
                              practical: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    {errors.assessmentPattern && <p className="text-red-500 text-xs mt-1">{errors.assessmentPattern}</p>}
                    <div className="mt-2 text-sm text-gray-600">
                      Total: {formData.assessmentPattern.continuousAssessment + formData.assessmentPattern.midTerm + formData.assessmentPattern.finalExam + formData.assessmentPattern.practical}%
                    </div>
                  </div>

                  {/* Prerequisites and Corequisites */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Prerequisites & Corequisites</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {subjects.filter(s => s.id !== formData.id).map(subject => (
                            <label key={subject.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.prerequisites.includes(subject.id)}
                                onChange={(e) => handlePrerequisiteChange(subject.id, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{subject.code} - {subject.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Corequisites</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {subjects.filter(s => s.id !== formData.id).map(subject => (
                            <label key={subject.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.corequisites.includes(subject.id)}
                                onChange={(e) => handleCorequisiteChange(subject.id, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{subject.code} - {subject.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room Requirements */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Room Requirements</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                        <select
                          value={formData.roomRequirements.roomType}
                          onChange={(e) => setFormData({
                            ...formData,
                            roomRequirements: {
                              ...formData.roomRequirements,
                              roomType: e.target.value as any
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {ROOM_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Capacity</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.roomRequirements.minCapacity}
                          onChange={(e) => setFormData({
                            ...formData,
                            roomRequirements: {
                              ...formData.roomRequirements,
                              minCapacity: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Required Equipment</label>
                        <div className="grid grid-cols-2 gap-2">
                          {EQUIPMENT_OPTIONS.map(equipment => (
                            <label key={equipment} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.roomRequirements.equipment.includes(equipment)}
                                onChange={(e) => handleEquipmentChange(equipment, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{equipment}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Practical Session Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Practical Session Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Practical Session Duration (hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={formData.practicalSessionDuration}
                          onChange={(e) => setFormData({ ...formData, practicalSessionDuration: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollment Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.maxStudents}
                          onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.maxStudents ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.maxStudents && <p className="text-red-500 text-xs mt-1">{errors.maxStudents}</p>}
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isOffered}
                          onChange={(e) => setFormData({ ...formData, isOffered: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Currently Offered</span>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isCreating ? 'Create Subject' : 'Update Subject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setSelectedSubject(null);
                        resetForm();
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload Subjects</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {csvFile && (
                  <div className="text-sm text-gray-600">
                    <p>File: {csvFile.name}</p>
                    <p>Size: {(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                {uploadProgress === 100 && (
                  <div className="text-green-600 text-sm">
                    <Icon name="check" className="w-4 h-4 inline mr-1" />
                    Upload completed successfully!
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleBulkUpload}
                  disabled={!csvFile || uploadProgress > 0}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload
                </button>
                <button
                  onClick={() => {
                    setShowBulkUpload(false);
                    setCsvFile(null);
                    setUploadProgress(0);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



