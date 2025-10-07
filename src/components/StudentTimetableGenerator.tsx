import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { StudentProfile, SubjectDetails, StudentScheduleResult, NEPComplianceStatus } from '../types/nep-interfaces';

interface StudentTimetableGeneratorProps {
  user: any;
  onClose: () => void;
}

interface SubjectSelection {
  subjectId: string;
  subject: SubjectDetails;
  isSelected: boolean;
  prerequisites: string[];
  prerequisitesMet: boolean;
}

interface CreditSummary {
  current: number;
  required: number;
  byCategory: {
    core: { current: number; required: number };
    elective: { current: number; required: number };
    skill: { current: number; required: number };
  };
}

const StudentTimetableGenerator: React.FC<StudentTimetableGeneratorProps> = ({ user, onClose }) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectDetails[]>([]);
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditSummary>({
    current: 0,
    required: 20,
    byCategory: {
      core: { current: 0, required: 12 },
      elective: { current: 0, required: 6 },
      skill: { current: 0, required: 2 }
    }
  });
  const [nepCompliance, setNepCompliance] = useState<NEPComplianceStatus>({
    isCompliant: false,
    totalCredits: 0,
    coreCredits: 0,
    electiveCredits: 0,
    skillCredits: 0,
    corePercentage: 0,
    electivePercentage: 0,
    skillPercentage: 0,
    violations: [],
    recommendations: [],
    lastChecked: new Date()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<StudentScheduleResult | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [prerequisiteWarnings, setPrerequisiteWarnings] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);

  // Time slots for the day
  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load student data
  useEffect(() => {
    const loadStudentData = async () => {
      // Mock student data - replace with actual API call
      const mockStudent: StudentProfile = {
        id: 'student1',
        organizationId: 'org1',
        departmentId: 'dept1',
        department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
        rollNumber: 'CS2024001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@university.edu',
        phone: '+1234567890',
        dateOfBirth: new Date('2000-01-01'),
        currentYear: 2,
        currentSemester: 3,
        admissionYear: 2022,
        isActive: true,
        totalCreditsEarned: 40,
        coreCreditsEarned: 24,
        electiveCreditsEarned: 12,
        skillCreditsEarned: 4,
        cgpa: 8.5,
        currentSemesterGPA: 8.2,
        enrolledSubjects: [],
        attendanceRecords: [],
        assessmentRecords: [],
        nepCompliance: {
          isCompliant: true,
          totalCredits: 40,
          coreCredits: 24,
          electiveCredits: 12,
          skillCredits: 4,
          corePercentage: 60,
          electivePercentage: 30,
          skillPercentage: 10,
          violations: [],
          recommendations: [],
          lastChecked: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSelectedStudent(mockStudent);
    };

    loadStudentData();
  }, []);

  // Load available subjects
  useEffect(() => {
    const loadSubjects = async () => {
      // Mock subjects - replace with actual API call
      const mockSubjects: SubjectDetails[] = [
        {
          id: 'sub1',
          organizationId: 'org1',
          departmentId: 'dept1',
          department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
          code: 'CS301',
          name: 'Data Structures and Algorithms',
          description: 'Advanced data structures and algorithm design',
          nepCategory: 'CORE',
          credits: 4,
          lectureHours: 3,
          tutorialHours: 1,
          practicalHours: 0,
          prerequisites: [],
          isPrerequisiteFor: [],
          continuousAssessmentWeight: 40,
          endSemesterExamWeight: 60,
          assessmentPattern: {
            continuousAssessment: { weight: 40, components: [] },
            endSemesterExam: { weight: 60, duration: 180, maxMarks: 100 },
            totalMarks: 100,
            passingMarks: 40,
            gradeScale: []
          },
          isOffered: true,
          offeredInYears: [3],
          assignedFaculties: [],
          nepValidation: {
            isValid: true,
            creditDistribution: { core: 4, elective: 0, skill: 0 },
            assessmentCompliance: true,
            prerequisiteValidation: true,
            facultyAvailability: true,
            violations: [],
            recommendations: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'sub2',
          organizationId: 'org1',
          departmentId: 'dept1',
          department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
          code: 'CS302',
          name: 'Database Management Systems',
          description: 'Database design and management principles',
          nepCategory: 'CORE',
          credits: 4,
          lectureHours: 3,
          tutorialHours: 1,
          practicalHours: 0,
          prerequisites: [],
          isPrerequisiteFor: [],
          continuousAssessmentWeight: 40,
          endSemesterExamWeight: 60,
          assessmentPattern: {
            continuousAssessment: { weight: 40, components: [] },
            endSemesterExam: { weight: 60, duration: 180, maxMarks: 100 },
            totalMarks: 100,
            passingMarks: 40,
            gradeScale: []
          },
          isOffered: true,
          offeredInYears: [3],
          assignedFaculties: [],
          nepValidation: {
            isValid: true,
            creditDistribution: { core: 4, elective: 0, skill: 0 },
            assessmentCompliance: true,
            prerequisiteValidation: true,
            facultyAvailability: true,
            violations: [],
            recommendations: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'sub3',
          organizationId: 'org1',
          departmentId: 'dept1',
          department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
          code: 'CS303',
          name: 'Web Development',
          description: 'Modern web development technologies',
          nepCategory: 'SKILL_BASED',
          credits: 3,
          lectureHours: 2,
          tutorialHours: 0,
          practicalHours: 2,
          prerequisites: [],
          isPrerequisiteFor: [],
          continuousAssessmentWeight: 40,
          endSemesterExamWeight: 60,
          assessmentPattern: {
            continuousAssessment: { weight: 40, components: [] },
            endSemesterExam: { weight: 60, duration: 180, maxMarks: 100 },
            totalMarks: 100,
            passingMarks: 40,
            gradeScale: []
          },
          isOffered: true,
          offeredInYears: [3],
          assignedFaculties: [],
          nepValidation: {
            isValid: true,
            creditDistribution: { core: 0, elective: 0, skill: 3 },
            assessmentCompliance: true,
            prerequisiteValidation: true,
            facultyAvailability: true,
            violations: [],
            recommendations: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'sub4',
          organizationId: 'org1',
          departmentId: 'dept1',
          department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
          code: 'CS304',
          name: 'Machine Learning',
          description: 'Introduction to machine learning algorithms',
          nepCategory: 'ELECTIVE',
          credits: 3,
          lectureHours: 3,
          tutorialHours: 0,
          practicalHours: 0,
          prerequisites: ['sub1'], // Requires Data Structures
          isPrerequisiteFor: [],
          continuousAssessmentWeight: 40,
          endSemesterExamWeight: 60,
          assessmentPattern: {
            continuousAssessment: { weight: 40, components: [] },
            endSemesterExam: { weight: 60, duration: 180, maxMarks: 100 },
            totalMarks: 100,
            passingMarks: 40,
            gradeScale: []
          },
          isOffered: true,
          offeredInYears: [3],
          assignedFaculties: [],
          nepValidation: {
            isValid: true,
            creditDistribution: { core: 0, elective: 3, skill: 0 },
            assessmentCompliance: true,
            prerequisiteValidation: true,
            facultyAvailability: true,
            violations: [],
            recommendations: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      setAvailableSubjects(mockSubjects);
      
      // Initialize subject selections
      const selections: SubjectSelection[] = mockSubjects.map(subject => ({
        subjectId: subject.id,
        subject,
        isSelected: false,
        prerequisites: subject.prerequisites.map(p => p.prerequisiteId),
        prerequisitesMet: true // Mock - in real app, check against student's completed subjects
      }));
      setSubjectSelections(selections);
    };

    loadSubjects();
  }, []);

  // Update credit summary when subjects are selected
  useEffect(() => {
    const selectedSubjects = subjectSelections.filter(s => s.isSelected);
    const totalCredits = selectedSubjects.reduce((sum, s) => sum + s.subject.credits, 0);
    
    const coreCredits = selectedSubjects
      .filter(s => s.subject.nepCategory === 'CORE')
      .reduce((sum, s) => sum + s.subject.credits, 0);
    
    const electiveCredits = selectedSubjects
      .filter(s => s.subject.nepCategory === 'ELECTIVE')
      .reduce((sum, s) => sum + s.subject.credits, 0);
    
    const skillCredits = selectedSubjects
      .filter(s => s.subject.nepCategory === 'SKILL_BASED')
      .reduce((sum, s) => sum + s.subject.credits, 0);

    setCreditSummary(prev => ({
      ...prev,
      current: totalCredits,
      byCategory: {
        core: { ...prev.byCategory.core, current: coreCredits },
        elective: { ...prev.byCategory.elective, current: electiveCredits },
        skill: { ...prev.byCategory.skill, current: skillCredits }
      }
    }));

    // Update NEP compliance
    const corePercentage = (coreCredits / totalCredits) * 100;
    const electivePercentage = (electiveCredits / totalCredits) * 100;
    const skillPercentage = (skillCredits / totalCredits) * 100;

    const violations: string[] = [];
    const recommendations: string[] = [];

    if (corePercentage < 50) violations.push('Core subjects should be at least 50% of total credits');
    if (electivePercentage < 20) violations.push('Elective subjects should be at least 20% of total credits');
    if (skillPercentage < 10) violations.push('Skill-based subjects should be at least 10% of total credits');
    if (totalCredits < 20) violations.push('Minimum 20 credits required per semester');
    if (totalCredits > 30) violations.push('Maximum 30 credits allowed per semester');

    if (coreCredits < 12) recommendations.push('Consider adding more core subjects');
    if (electiveCredits < 6) recommendations.push('Consider adding more elective subjects');
    if (skillCredits < 2) recommendations.push('Consider adding more skill-based subjects');

    setNepCompliance({
      isCompliant: violations.length === 0,
      totalCredits,
      coreCredits,
      electiveCredits,
      skillCredits,
      corePercentage,
      electivePercentage,
      skillPercentage,
      violations,
      recommendations,
      lastChecked: new Date()
    });

    // Check prerequisites
    const warnings: string[] = [];
    selectedSubjects.forEach(selection => {
      if (!selection.prerequisitesMet) {
        warnings.push(`${selection.subject.code} requires prerequisites that haven't been completed`);
      }
    });
    setPrerequisiteWarnings(warnings);
  }, [subjectSelections]);

  const handleSubjectToggle = (subjectId: string) => {
    setSubjectSelections(prev => 
      prev.map(selection => 
        selection.subjectId === subjectId 
          ? { ...selection, isSelected: !selection.isSelected }
          : selection
      )
    );
  };

  const handleGenerateSchedule = async () => {
    if (!selectedStudent) return;

    const selectedSubjects = subjectSelections.filter(s => s.isSelected);
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }

    setIsGenerating(true);
    try {
      // Mock generation - replace with actual API call
      const mockSchedule: StudentScheduleResult = {
        success: true,
        studentId: selectedStudent.id,
        semester: selectedStudent.currentSemester.toString(),
        schedule: [
          {
            id: 'slot1',
            day: 'Monday',
            timeSlot: '9:00 AM - 10:00 AM',
            startTime: '09:00',
            endTime: '10:00',
            duration: 60,
            subjectId: selectedSubjects[0].subjectId,
            subjectName: selectedSubjects[0].subject.name,
            subjectCode: selectedSubjects[0].subject.code,
            subjectType: 'LECTURE',
            facultyId: 'faculty1',
            facultyName: 'Dr. Smith',
            roomId: 'room1',
            roomName: 'Room 101',
            roomCapacity: 50,
            isOnline: false,
            isRecurring: true,
            priority: 'HIGH',
            notes: ''
          }
        ],
        summary: {
          totalHours: 20,
          totalClasses: 5,
          totalCredits: creditSummary.current,
          subjectDistribution: {
            core: creditSummary.byCategory.core.current,
            elective: creditSummary.byCategory.elective.current,
            skillBased: creditSummary.byCategory.skill.current,
            total: creditSummary.current
          },
          timeDistribution: { morning: 12, afternoon: 6, evening: 2 },
          dayDistribution: { monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 0, sunday: 0 },
          facultyDistribution: {},
          workloadBalance: 85,
          preferencesMet: 90,
          nepComplianceScore: nepCompliance.isCompliant ? 95 : 70
        },
        conflicts: [],
        recommendations: nepCompliance.recommendations,
        nepCompliance: {
          isCompliant: nepCompliance.isCompliant,
          complianceScore: nepCompliance.isCompliant ? 95 : 70,
          violations: nepCompliance.violations,
          recommendations: nepCompliance.recommendations,
          detailedBreakdown: {
            creditDistribution: {
              core: { current: creditSummary.byCategory.core.current, required: 12, percentage: creditSummary.byCategory.core.current / 12 * 100 },
              elective: { current: creditSummary.byCategory.elective.current, required: 6, percentage: creditSummary.byCategory.elective.current / 6 * 100 },
              skill: { current: creditSummary.byCategory.skill.current, required: 2, percentage: creditSummary.byCategory.skill.current / 2 * 100 }
            },
            assessmentPattern: {
              continuous: { current: 40, required: 40 },
              endSemester: { current: 60, required: 60 }
            },
            attendance: {
              current: 0,
              required: 75,
              status: 'COMPLIANT'
            }
          }
        },
        processingTime: 1500,
        metadata: {
          generatedAt: new Date(),
          studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
          departmentName: selectedStudent.department.name,
          chosenSubjects: selectedSubjects.map(s => s.subjectId),
          totalCredits: creditSummary.current,
          facultiesInvolved: ['faculty1'],
          roomsUsed: ['room1'],
          optimizationApplied: true,
          constraintsViolated: 0,
          preferencesMet: 90
        }
      };

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGeneratedSchedule(mockSchedule);
      setConflicts(mockSchedule.conflicts);
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Failed to generate schedule. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderScheduleGrid = () => {
    if (!generatedSchedule) return null;

    if (isMobileView) {
      return (
        <div className="space-y-4">
          {days.map(day => (
            <div key={day} className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">{day}</h3>
              <div className="space-y-2">
                {timeSlots.map(timeSlot => {
                  const slot = generatedSchedule.schedule.find(s => 
                    s.day === day && s.timeSlot === timeSlot
                  );
                  return (
                    <div key={timeSlot} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{timeSlot}</span>
                      {slot ? (
                        <div className="text-right">
                          <div className="font-medium text-sm">{slot.subjectCode}</div>
                          <div className="text-xs text-gray-600">{slot.roomName}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Free</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Time</th>
              {days.map(day => (
                <th key={day} className="border border-gray-300 p-2 text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot}>
                <td className="border border-gray-300 p-2 font-medium">{timeSlot}</td>
                {days.map(day => {
                  const slot = generatedSchedule.schedule.find(s => 
                    s.day === day && s.timeSlot === timeSlot
                  );
                  return (
                    <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2 text-center">
                      {slot ? (
                        <div className="bg-blue-100 p-2 rounded text-sm">
                          <div className="font-medium">{slot.subjectCode}</div>
                          <div className="text-xs text-gray-600">{slot.roomName}</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Student Timetable Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Student Info and Subject Selection */}
            <div className="space-y-6">
              {/* Student Information */}
              {selectedStudent && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Student Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedStudent.firstName} {selectedStudent.lastName}</div>
                    <div><span className="font-medium">Roll Number:</span> {selectedStudent.rollNumber}</div>
                    <div><span className="font-medium">Year:</span> {selectedStudent.currentYear}</div>
                    <div><span className="font-medium">Semester:</span> {selectedStudent.currentSemester}</div>
                    <div><span className="font-medium">Department:</span> {selectedStudent.department.name}</div>
                  </div>
                </div>
              )}

              {/* Credit Counter */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Credit Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Credits:</span>
                    <span className="font-medium">{creditSummary.current}/{creditSummary.required}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Core:</span>
                    <span className="font-medium">{creditSummary.byCategory.core.current}/{creditSummary.byCategory.core.required}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Elective:</span>
                    <span className="font-medium">{creditSummary.byCategory.elective.current}/{creditSummary.byCategory.elective.required}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skill-based:</span>
                    <span className="font-medium">{creditSummary.byCategory.skill.current}/{creditSummary.byCategory.skill.required}</span>
                  </div>
                </div>
              </div>

              {/* NEP Compliance Meter */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">NEP Compliance</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compliance Score</span>
                    <span className={`font-medium ${nepCompliance.isCompliant ? 'text-green-600' : 'text-red-600'}`}>
                      {nepCompliance.isCompliant ? '✓ Compliant' : '✗ Non-compliant'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${nepCompliance.isCompliant ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${nepCompliance.isCompliant ? 100 : 70}%` }}
                    ></div>
                  </div>
                  {nepCompliance.violations.length > 0 && (
                    <div className="text-xs text-red-600">
                      {nepCompliance.violations.map((violation, index) => (
                        <div key={index}>• {violation}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Subjects</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {subjectSelections.map(selection => (
                    <div key={selection.subjectId} className="border border-gray-300 rounded-lg p-3">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selection.isSelected}
                          onChange={() => handleSubjectToggle(selection.subjectId)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{selection.subject.code} - {selection.subject.name}</div>
                          <div className="text-sm text-gray-600">{selection.subject.credits} credits • {selection.subject.nepCategory}</div>
                          {selection.prerequisites.length > 0 && (
                            <div className="text-xs text-orange-600">
                              Prerequisites: {selection.prerequisites.join(', ')}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites Warning */}
              {prerequisiteWarnings.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">Prerequisites Warning</h3>
                  <div className="space-y-1 text-sm text-orange-700">
                    {prerequisiteWarnings.map((warning, index) => (
                      <div key={index}>• {warning}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateSchedule}
                disabled={subjectSelections.filter(s => s.isSelected).length === 0 || isGenerating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Personalized Schedule'
                )}
              </button>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-2 space-y-6">
              {generatedSchedule ? (
                <>
                  {/* Schedule Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Schedule Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Hours</div>
                        <div className="font-semibold">{generatedSchedule.summary.totalHours}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Classes</div>
                        <div className="font-semibold">{generatedSchedule.summary.totalClasses}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Credits</div>
                        <div className="font-semibold">{generatedSchedule.summary.totalCredits}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">NEP Compliance</div>
                        <div className="font-semibold text-green-600">{generatedSchedule.summary.nepComplianceScore}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Conflicts */}
                  {conflicts.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Conflicts Detected</h3>
                      <div className="space-y-2">
                        {conflicts.map((conflict, index) => (
                          <div key={index} className="text-sm text-red-700">
                            • {conflict.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule Grid */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Your Personalized Schedule</h3>
                    {renderScheduleGrid()}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Icon name="calendar" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select subjects and generate your personalized schedule</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetableGenerator;
