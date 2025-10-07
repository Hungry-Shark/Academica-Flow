import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icons';
import { StudentProfile, NepCategory } from '../../types/nep-interfaces';

interface StudentEnrollmentComponentProps {
  onBack: () => void;
}

interface StudentFormData {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  year: number;
  semester: string;
  academicYear: string;
  departmentId: string;
  programId: string;
  enrollmentDate: string;
  isActive: boolean;
  chosenSubjects: string[];
  completedSubjects: string[];
  currentCredits: number;
  maxCreditsPerSemester: number;
  nepCompliance: {
    coreCredits: number;
    electiveCredits: number;
    skillBasedCredits: number;
    totalCredits: number;
    isCompliant: boolean;
  };
}

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  nepCategory: NepCategory;
  prerequisites: string[];
  corequisites: string[];
  isOffered: boolean;
  maxStudents: number;
  currentEnrollment: number;
}

interface Program {
  id: string;
  name: string;
  code: string;
  duration: number;
  totalCredits: number;
  departmentId: string;
}

interface PrerequisiteCheck {
  subjectId: string;
  isMet: boolean;
  missingPrerequisites: string[];
  canEnroll: boolean;
}

const NEP_CATEGORIES: NepCategory[] = ['CORE', 'ELECTIVE', 'SKILL_BASED', 'FOUNDATION', 'INTERDISCIPLINARY', 'PROJECT', 'INTERNSHIP', 'RESEARCH'];

const YEARS = [1, 2, 3, 4, 5, 6];
const SEMESTERS = ['Odd', 'Even', 'Summer'];

export const StudentEnrollmentComponent: React.FC<StudentEnrollmentComponentProps> = ({ onBack }) => {
  const [students, setStudents] = useState<StudentFormData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [prerequisiteChecks, setPrerequisiteChecks] = useState<PrerequisiteCheck[]>([]);
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<StudentFormData>({
    id: '',
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    year: 1,
    semester: 'Odd',
    academicYear: '2024-25',
    departmentId: '',
    programId: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    isActive: true,
    chosenSubjects: [],
    completedSubjects: [],
    currentCredits: 0,
    maxCreditsPerSemester: 30,
    nepCompliance: {
      coreCredits: 0,
      electiveCredits: 0,
      skillBasedCredits: 0,
      totalCredits: 0,
      isCompliant: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.chosenSubjects.length > 0) {
      checkPrerequisites();
      calculateNEPCompliance();
    }
  }, [formData.chosenSubjects, subjects]);

  const loadInitialData = async () => {
    // Mock data - replace with actual API calls
    setStudents([
      {
        id: '1',
        studentId: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@university.edu',
        phone: '+1-555-0123',
        year: 2,
        semester: 'Odd',
        academicYear: '2024-25',
        departmentId: 'dept1',
        programId: 'prog1',
        enrollmentDate: '2023-08-15',
        isActive: true,
        chosenSubjects: ['sub1', 'sub2'],
        completedSubjects: ['sub0'],
        currentCredits: 8,
        maxCreditsPerSemester: 30,
        nepCompliance: {
          coreCredits: 6,
          electiveCredits: 2,
          skillBasedCredits: 0,
          totalCredits: 8,
          isCompliant: false
        }
      }
    ]);

    setSubjects([
      { id: 'sub1', code: 'CS101', name: 'Introduction to Programming', credits: 4, nepCategory: 'CORE', prerequisites: [], corequisites: [], isOffered: true, maxStudents: 50, currentEnrollment: 25 },
      { id: 'sub2', code: 'CS201', name: 'Data Structures', credits: 4, nepCategory: 'CORE', prerequisites: ['sub1'], corequisites: [], isOffered: true, maxStudents: 40, currentEnrollment: 20 },
      { id: 'sub3', code: 'CS301', name: 'Machine Learning', credits: 3, nepCategory: 'ELECTIVE', prerequisites: ['sub2'], corequisites: [], isOffered: true, maxStudents: 30, currentEnrollment: 15 },
      { id: 'sub4', code: 'CS401', name: 'Web Development', credits: 3, nepCategory: 'SKILL_BASED', prerequisites: ['sub1'], corequisites: [], isOffered: true, maxStudents: 35, currentEnrollment: 18 }
    ]);

    setPrograms([
      { id: 'prog1', name: 'Bachelor of Computer Science', code: 'BCS', duration: 4, totalCredits: 120, departmentId: 'dept1' },
      { id: 'prog2', name: 'Master of Computer Science', code: 'MCS', duration: 2, totalCredits: 60, departmentId: 'dept1' }
    ]);

    setDepartments([
      { id: 'dept1', name: 'Computer Science', code: 'CS' },
      { id: 'dept2', name: 'Mathematics', code: 'MATH' },
      { id: 'dept3', name: 'Physics', code: 'PHY' }
    ]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.programId) newErrors.programId = 'Program is required';
    if (formData.chosenSubjects.length === 0) newErrors.chosenSubjects = 'At least one subject must be selected';
    if (formData.currentCredits > formData.maxCreditsPerSemester) {
      newErrors.currentCredits = 'Current credits exceed maximum allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPrerequisites = () => {
    const checks: PrerequisiteCheck[] = formData.chosenSubjects.map(subjectId => {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return { subjectId, isMet: false, missingPrerequisites: [], canEnroll: false };

      const missingPrerequisites = subject.prerequisites.filter(prereqId => 
        !formData.completedSubjects.includes(prereqId)
      );

      return {
        subjectId,
        isMet: missingPrerequisites.length === 0,
        missingPrerequisites,
        canEnroll: missingPrerequisites.length === 0 && subject.isOffered && subject.currentEnrollment < subject.maxStudents
      };
    });

    setPrerequisiteChecks(checks);
  };

  const calculateNEPCompliance = () => {
    const selectedSubjects = subjects.filter(s => formData.chosenSubjects.includes(s.id));
    
    const coreCredits = selectedSubjects
      .filter(s => s.nepCategory === 'CORE')
      .reduce((sum, s) => sum + s.credits, 0);
    
    const electiveCredits = selectedSubjects
      .filter(s => s.nepCategory === 'ELECTIVE')
      .reduce((sum, s) => sum + s.credits, 0);
    
    const skillBasedCredits = selectedSubjects
      .filter(s => s.nepCategory === 'SKILL_BASED')
      .reduce((sum, s) => sum + s.credits, 0);
    
    const totalCredits = coreCredits + electiveCredits + skillBasedCredits;
    
    // NEP 2020 compliance: 60% core, 30% elective, 10% skill-based
    const corePercentage = totalCredits > 0 ? (coreCredits / totalCredits) * 100 : 0;
    const electivePercentage = totalCredits > 0 ? (electiveCredits / totalCredits) * 100 : 0;
    const skillBasedPercentage = totalCredits > 0 ? (skillBasedCredits / totalCredits) * 100 : 0;
    
    const isCompliant = corePercentage >= 50 && electivePercentage >= 20 && skillBasedPercentage >= 5;

    setFormData(prev => ({
      ...prev,
      currentCredits: totalCredits,
      nepCompliance: {
        coreCredits,
        electiveCredits,
        skillBasedCredits,
        totalCredits,
        isCompliant
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isCreating) {
      const newStudent = { ...formData, id: Date.now().toString() };
      setStudents([...students, newStudent]);
      setIsCreating(false);
    } else if (isEditing && selectedStudent) {
      setStudents(students.map(s => s.id === selectedStudent.id ? formData : s));
      setIsEditing(false);
      setSelectedStudent(null);
    }

    resetForm();
  };

  const handleEdit = (student: StudentFormData) => {
    setSelectedStudent(student);
    setFormData(student);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
    setSelectedStudent(null);
  };

  const handleDelete = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== studentId));
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      year: 1,
      semester: 'Odd',
      academicYear: '2024-25',
      departmentId: '',
      programId: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      isActive: true,
      chosenSubjects: [],
      completedSubjects: [],
      currentCredits: 0,
      maxCreditsPerSemester: 30,
      nepCompliance: {
        coreCredits: 0,
        electiveCredits: 0,
        skillBasedCredits: 0,
        totalCredits: 0,
        isCompliant: false
      }
    });
    setErrors({});
    setPrerequisiteChecks([]);
  };

  const handleSubjectSelection = (subjectId: string, selected: boolean) => {
    if (selected) {
      setFormData({
        ...formData,
        chosenSubjects: [...formData.chosenSubjects, subjectId]
      });
    } else {
      setFormData({
        ...formData,
        chosenSubjects: formData.chosenSubjects.filter(id => id !== subjectId)
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !filterYear || student.year.toString() === filterYear;
    const matchesDepartment = !filterDepartment || student.departmentId === filterDepartment;
    
    return matchesSearch && matchesYear && matchesDepartment;
  });

  const getNEPComplianceColor = (isCompliant: boolean) => {
    return isCompliant ? 'text-green-600' : 'text-red-600';
  };

  const getNEPComplianceIcon = (isCompliant: boolean) => {
    return isCompliant ? 'check-circle' : 'x-circle';
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
                <h1 className="text-3xl font-bold text-gray-900">Student Enrollment</h1>
                <p className="text-gray-600 mt-1">Manage student registrations, subject selections, and NEP compliance</p>
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
                <span>Add Student</span>
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
                  placeholder="Search by name, email, or student ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Years</option>
                {YEARS.map(year => (
                  <option key={year} value={year.toString()}>Year {year}</option>
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
                  setFilterYear('');
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
          {/* Student List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Students ({filteredStudents.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredStudents.map(student => (
                  <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-lg">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-gray-600">{student.studentId} • Year {student.year} • {student.semester} Semester</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Credits:</span>
                            <span className="text-sm font-medium">{student.currentCredits}/{student.maxCreditsPerSemester}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Subjects:</span>
                            <span className="text-sm font-medium">{student.chosenSubjects.length}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Icon 
                              name={getNEPComplianceIcon(student.nepCompliance.isCompliant)} 
                              className={`w-4 h-4 ${getNEPComplianceColor(student.nepCompliance.isCompliant)}`}
                            />
                            <span className={`text-sm font-medium ${getNEPComplianceColor(student.nepCompliance.isCompliant)}`}>
                              NEP {student.nepCompliance.isCompliant ? 'Compliant' : 'Non-compliant'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex space-x-4 text-xs text-gray-500">
                            <span>Core: {student.nepCompliance.coreCredits}</span>
                            <span>Elective: {student.nepCompliance.electiveCredits}</span>
                            <span>Skill-based: {student.nepCompliance.skillBasedCredits}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
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
                    {isCreating ? 'Add New Student' : 'Edit Student'}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                        <input
                          type="text"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.studentId ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                          <select
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {YEARS.map(year => (
                              <option key={year} value={year}>Year {year}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                          <select
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {SEMESTERS.map(semester => (
                              <option key={semester} value={semester}>{semester}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <input
                          type="text"
                          value={formData.academicYear}
                          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                        <select
                          value={formData.programId}
                          onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.programId ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Program</option>
                          {programs.filter(prog => prog.departmentId === formData.departmentId).map(prog => (
                            <option key={prog.id} value={prog.id}>{prog.name}</option>
                          ))}
                        </select>
                        {errors.programId && <p className="text-red-500 text-xs mt-1">{errors.programId}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                        <input
                          type="date"
                          value={formData.enrollmentDate}
                          onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active Student</span>
                      </div>
                    </div>
                  </div>

                  {/* Credit Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Credits Per Semester</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={formData.maxCreditsPerSemester}
                          onChange={(e) => setFormData({ ...formData, maxCreditsPerSemester: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* NEP Compliance Dashboard */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">NEP Compliance Dashboard</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total Credits:</span>
                        <span className="text-sm font-bold">{formData.nepCompliance.totalCredits}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Core Credits:</span>
                        <span className="text-sm">{formData.nepCompliance.coreCredits}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Elective Credits:</span>
                        <span className="text-sm">{formData.nepCompliance.electiveCredits}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Skill-based Credits:</span>
                        <span className="text-sm">{formData.nepCompliance.skillBasedCredits}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Compliance Status:</span>
                        <div className="flex items-center space-x-1">
                          <Icon 
                            name={getNEPComplianceIcon(formData.nepCompliance.isCompliant)} 
                            className={`w-4 h-4 ${getNEPComplianceColor(formData.nepCompliance.isCompliant)}`}
                          />
                          <span className={`text-sm font-medium ${getNEPComplianceColor(formData.nepCompliance.isCompliant)}`}>
                            {formData.nepCompliance.isCompliant ? 'Compliant' : 'Non-compliant'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Subject Selection *</h3>
                      <button
                        type="button"
                        onClick={() => setShowSubjectSelection(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Select Subjects
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.chosenSubjects.map(subjectId => {
                        const subject = subjects.find(s => s.id === subjectId);
                        if (!subject) return null;
                        return (
                          <div key={subjectId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium">{subject.code} - {subject.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({subject.credits} credits, {subject.nepCategory})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSubjectSelection(subjectId, false)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Icon name="x" className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {errors.chosenSubjects && <p className="text-red-500 text-xs mt-1">{errors.chosenSubjects}</p>}
                  </div>

                  {/* Prerequisites Check */}
                  {prerequisiteChecks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Prerequisites Check</h3>
                      <div className="space-y-2">
                        {prerequisiteChecks.map(check => {
                          const subject = subjects.find(s => s.id === check.subjectId);
                          if (!subject) return null;
                          return (
                            <div key={check.subjectId} className={`p-3 rounded-lg border ${
                              check.canEnroll ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{subject.code} - {subject.name}</span>
                                <div className="flex items-center space-x-1">
                                  <Icon 
                                    name={check.canEnroll ? 'check' : 'x'} 
                                    className={`w-4 h-4 ${check.canEnroll ? 'text-green-600' : 'text-red-600'}`}
                                  />
                                  <span className={`text-sm ${check.canEnroll ? 'text-green-600' : 'text-red-600'}`}>
                                    {check.canEnroll ? 'Can Enroll' : 'Cannot Enroll'}
                                  </span>
                                </div>
                              </div>
                              {check.missingPrerequisites.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-red-600">Missing prerequisites:</p>
                                  <p className="text-xs text-red-600">
                                    {check.missingPrerequisites.map(prereqId => {
                                      const prereq = subjects.find(s => s.id === prereqId);
                                      return prereq ? prereq.code : prereqId;
                                    }).join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isCreating ? 'Create Student' : 'Update Student'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setSelectedStudent(null);
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

        {/* Subject Selection Modal */}
        {showSubjectSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Subjects</h3>
              <div className="space-y-3">
                {subjects.map(subject => (
                  <label key={subject.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.chosenSubjects.includes(subject.id)}
                      onChange={(e) => handleSubjectSelection(subject.id, e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subject.code} - {subject.name}</span>
                        <span className="text-sm text-gray-500">{subject.credits} credits</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          subject.nepCategory === 'CORE' ? 'bg-blue-100 text-blue-800' :
                          subject.nepCategory === 'ELECTIVE' ? 'bg-green-100 text-green-800' :
                          subject.nepCategory === 'SKILL_BASED' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {subject.nepCategory}
                        </span>
                        <span className="text-xs text-gray-500">
                          {subject.currentEnrollment}/{subject.maxStudents} students
                        </span>
                        {!subject.isOffered && (
                          <span className="text-xs text-red-600">Not Offered</span>
                        )}
                      </div>
                      {subject.prerequisites.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-600">Prerequisites: {subject.prerequisites.map(prereqId => {
                            const prereq = subjects.find(s => s.id === prereqId);
                            return prereq ? prereq.code : prereqId;
                          }).join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSubjectSelection(false)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={() => setShowSubjectSelection(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload Students</h3>
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



