import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icons';
import { FacultyMember } from '../../types';
import { FacultyProfile, NepCategory } from '../../types/nep-interfaces';

interface FacultyManagementComponentProps {
  onBack: () => void;
}

interface FacultyFormData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  qualification: string;
  departmentId: string;
  specializations: string[];
  nepCategories: NepCategory[];
  maxHoursPerWeek: number;
  currentWorkload: number;
  isAvailable: boolean;
  availability: AvailabilityWindow[];
  assignedSubjects: string[];
}

interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  nepCategory: NepCategory;
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const NEP_CATEGORIES: NepCategory[] = ['CORE', 'ELECTIVE', 'SKILL_BASED', 'FOUNDATION', 'INTERDISCIPLINARY', 'PROJECT', 'INTERNSHIP', 'RESEARCH'];

const DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lab Assistant',
  'Teaching Assistant',
  'Visiting Faculty',
  'Adjunct Faculty'
];

export const FacultyManagementComponent: React.FC<FacultyManagementComponentProps> = ({ onBack }) => {
  const [faculties, setFaculties] = useState<FacultyFormData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<FacultyFormData>({
    id: '',
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    qualification: '',
    departmentId: '',
    specializations: [],
    nepCategories: [],
    maxHoursPerWeek: 40,
    currentWorkload: 0,
    isAvailable: true,
    availability: [],
    assignedSubjects: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Mock data - replace with actual API calls
    setFaculties([
      {
        id: '1',
        employeeId: 'EMP001',
        firstName: 'Dr. John',
        lastName: 'Smith',
        email: 'john.smith@university.edu',
        phone: '+1-555-0123',
        designation: 'Professor',
        qualification: 'Ph.D. in Computer Science',
        departmentId: 'dept1',
        specializations: ['Machine Learning', 'Data Science'],
        nepCategories: ['CORE', 'ELECTIVE'],
        maxHoursPerWeek: 40,
        currentWorkload: 25,
        isAvailable: true,
        availability: [
          { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { id: '2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { id: '3', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }
        ],
        assignedSubjects: ['sub1', 'sub2']
      }
    ]);

    setSubjects([
      { id: 'sub1', code: 'CS101', name: 'Introduction to Programming', credits: 4, nepCategory: 'CORE' },
      { id: 'sub2', code: 'CS201', name: 'Data Structures', credits: 4, nepCategory: 'CORE' },
      { id: 'sub3', code: 'CS301', name: 'Machine Learning', credits: 3, nepCategory: 'ELECTIVE' }
    ]);

    setDepartments([
      { id: 'dept1', name: 'Computer Science', code: 'CS' },
      { id: 'dept2', name: 'Mathematics', code: 'MATH' },
      { id: 'dept3', name: 'Physics', code: 'PHY' }
    ]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (formData.specializations.length === 0) newErrors.specializations = 'At least one specialization is required';
    if (formData.nepCategories.length === 0) newErrors.nepCategories = 'At least one NEP category is required';
    if (formData.maxHoursPerWeek < 1 || formData.maxHoursPerWeek > 60) {
      newErrors.maxHoursPerWeek = 'Max hours per week must be between 1 and 60';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isCreating) {
      const newFaculty = { ...formData, id: Date.now().toString() };
      setFaculties([...faculties, newFaculty]);
      setIsCreating(false);
    } else if (isEditing && selectedFaculty) {
      setFaculties(faculties.map(f => f.id === selectedFaculty.id ? formData : f));
      setIsEditing(false);
      setSelectedFaculty(null);
    }

    resetForm();
  };

  const handleEdit = (faculty: FacultyFormData) => {
    setSelectedFaculty(faculty);
    setFormData(faculty);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
    setSelectedFaculty(null);
  };

  const handleDelete = (facultyId: string) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      setFaculties(faculties.filter(f => f.id !== facultyId));
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      designation: '',
      qualification: '',
      departmentId: '',
      specializations: [],
      nepCategories: [],
      maxHoursPerWeek: 40,
      currentWorkload: 0,
      isAvailable: true,
      availability: [],
      assignedSubjects: []
    });
    setErrors({});
  };

  const addAvailabilityWindow = () => {
    const newWindow: AvailabilityWindow = {
      id: Date.now().toString(),
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    };
    setFormData({
      ...formData,
      availability: [...formData.availability, newWindow]
    });
  };

  const updateAvailabilityWindow = (id: string, updates: Partial<AvailabilityWindow>) => {
    setFormData({
      ...formData,
      availability: formData.availability.map(aw => 
        aw.id === id ? { ...aw, ...updates } : aw
      )
    });
  };

  const removeAvailabilityWindow = (id: string) => {
    setFormData({
      ...formData,
      availability: formData.availability.filter(aw => aw.id !== id)
    });
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, specialization]
      });
    } else {
      setFormData({
        ...formData,
        specializations: formData.specializations.filter(s => s !== specialization)
      });
    }
  };

  const handleNEPCategoryChange = (category: NepCategory, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        nepCategories: [...formData.nepCategories, category]
      });
    } else {
      setFormData({
        ...formData,
        nepCategories: formData.nepCategories.filter(c => c !== category)
      });
    }
  };

  const handleSubjectAssignment = (subjectId: string, assigned: boolean) => {
    if (assigned) {
      setFormData({
        ...formData,
        assignedSubjects: [...formData.assignedSubjects, subjectId]
      });
    } else {
      setFormData({
        ...formData,
        assignedSubjects: formData.assignedSubjects.filter(id => id !== subjectId)
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

  const filteredFaculties = faculties.filter(faculty => {
    const matchesSearch = 
      faculty.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || faculty.departmentId === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

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
                <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
                <p className="text-gray-600 mt-1">Manage faculty members, their availability, and subject assignments</p>
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
                <span>Add Faculty</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
          {/* Faculty List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Faculty Members ({filteredFaculties.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredFaculties.map(faculty => (
                  <div key={faculty.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">
                              {faculty.firstName[0]}{faculty.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {faculty.firstName} {faculty.lastName}
                            </h3>
                            <p className="text-gray-600">{faculty.designation} • {faculty.employeeId}</p>
                            <p className="text-sm text-gray-500">{faculty.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {faculty.specializations.map(spec => (
                            <span key={spec} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Workload: {faculty.currentWorkload}/{faculty.maxHoursPerWeek} hrs</span>
                          <span>Subjects: {faculty.assignedSubjects.length}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            faculty.isAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {faculty.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(faculty)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(faculty.id)}
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
                    {isCreating ? 'Add New Faculty' : 'Edit Faculty'}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                        <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.employeeId ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.firstName ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.lastName ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                        <select
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.designation ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Designation</option>
                          {DESIGNATIONS.map(designation => (
                            <option key={designation} value={designation}>{designation}</option>
                          ))}
                        </select>
                        {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                        <input
                          type="text"
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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

                  {/* Specializations */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Specializations *</h3>
                    <div className="space-y-2">
                      {['Machine Learning', 'Data Science', 'Web Development', 'Mobile Development', 'AI', 'Cybersecurity', 'Database Systems', 'Software Engineering'].map(spec => (
                        <label key={spec} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.specializations.includes(spec)}
                            onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                    {errors.specializations && <p className="text-red-500 text-xs mt-1">{errors.specializations}</p>}
                  </div>

                  {/* NEP Categories */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">NEP Categories *</h3>
                    <div className="space-y-2">
                      {NEP_CATEGORIES.map(category => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.nepCategories.includes(category)}
                            onChange={(e) => handleNEPCategoryChange(category, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                    {errors.nepCategories && <p className="text-red-500 text-xs mt-1">{errors.nepCategories}</p>}
                  </div>

                  {/* Workload */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Workload Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Hours Per Week *</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={formData.maxHoursPerWeek}
                          onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: parseInt(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.maxHoursPerWeek ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.maxHoursPerWeek && <p className="text-red-500 text-xs mt-1">{errors.maxHoursPerWeek}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Workload</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.currentWorkload}
                          onChange={(e) => setFormData({ ...formData, currentWorkload: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isAvailable}
                          onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Currently Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Windows */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Availability Windows</h3>
                      <button
                        type="button"
                        onClick={addAvailabilityWindow}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Window
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.availability.map(window => (
                        <div key={window.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                              <select
                                value={window.dayOfWeek}
                                onChange={(e) => updateAvailabilityWindow(window.id, { dayOfWeek: parseInt(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                {DAYS.map(day => (
                                  <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Available</label>
                              <select
                                value={window.isAvailable ? 'true' : 'false'}
                                onChange={(e) => updateAvailabilityWindow(window.id, { isAvailable: e.target.value === 'true' })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="true">Available</option>
                                <option value="false">Unavailable</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                              <input
                                type="time"
                                value={window.startTime}
                                onChange={(e) => updateAvailabilityWindow(window.id, { startTime: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                              <input
                                type="time"
                                value={window.endTime}
                                onChange={(e) => updateAvailabilityWindow(window.id, { endTime: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeAvailabilityWindow(window.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subject Assignment */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Assignment</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {subjects.map(subject => (
                        <label key={subject.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.assignedSubjects.includes(subject.id)}
                            onChange={(e) => handleSubjectAssignment(subject.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-2">
                            <span className="text-sm text-gray-700">{subject.code} - {subject.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({subject.credits} credits, {subject.nepCategory})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isCreating ? 'Create Faculty' : 'Update Faculty'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setSelectedFaculty(null);
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload Faculty</h3>
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



