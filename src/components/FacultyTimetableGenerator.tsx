import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { FacultyProfile, SubjectDetails, StudentScheduleSlot, FacultyScheduleResult } from '../types/nep-interfaces';
import { FacultyScheduleGenerator } from '../generators/FacultyScheduleGenerator';

interface FacultyTimetableGeneratorProps {
  user: any;
  onClose: () => void;
}

interface FacultyPreferences {
  preferredTimeSlots: string[];
  avoidTimeSlots: string[];
  preferredDays: string[];
  avoidDays: string[];
  maxConsecutiveHours: number;
  preferMorningSlots: boolean;
  preferEveningSlots: boolean;
  breakBetweenClasses: number;
  avoidBackToBackClasses: boolean;
}

interface GenerationOptions {
  preferMorning: boolean;
  preferEvening: boolean;
  minimizeGaps: boolean;
  optimizeWorkload: boolean;
  avoidConflicts: boolean;
}

const FacultyTimetableGenerator: React.FC<FacultyTimetableGeneratorProps> = ({ user, onClose }) => {
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyProfile | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [subjects, setSubjects] = useState<SubjectDetails[]>([]);
  const [preferences, setPreferences] = useState<FacultyPreferences>({
    preferredTimeSlots: [],
    avoidTimeSlots: [],
    preferredDays: [],
    avoidDays: [],
    maxConsecutiveHours: 4,
    preferMorningSlots: true,
    preferEveningSlots: false,
    breakBetweenClasses: 15,
    avoidBackToBackClasses: true
  });
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    preferMorning: true,
    preferEvening: false,
    minimizeGaps: true,
    optimizeWorkload: true,
    avoidConflicts: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<FacultyScheduleResult | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFaculty, setFilteredFaculty] = useState<FacultyProfile[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'calendar'>('pdf');

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

  // Load faculty data
  useEffect(() => {
    const loadFacultyData = async () => {
      // Mock data - replace with actual API call
      const mockFaculty: FacultyProfile[] = [
        {
          id: '1',
          organizationId: 'org1',
          departmentId: 'dept1',
          department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
          employeeId: 'EMP001',
          firstName: 'Dr. John',
          lastName: 'Smith',
          email: 'john.smith@university.edu',
          phone: '+1234567890',
          designation: 'Professor',
          qualification: 'Ph.D. Computer Science',
          specializations: ['Machine Learning', 'Data Science'],
          nepCategories: ['CORE', 'ELECTIVE'],
          maxHoursPerWeek: 40,
          currentWorkload: 0,
          isAvailable: true,
          availability: [],
          assignedSubjects: [],
          workloadAnalysis: {
            currentHoursPerWeek: 0,
            maxHoursPerWeek: 40,
            utilizationPercentage: 0,
            isOverloaded: false,
            isUnderloaded: true,
            recommendedHours: 20,
            workloadDistribution: { lectures: 0, tutorials: 0, practicals: 0, projects: 0, research: 0 },
            availabilityScore: 100
          },
          performanceMetrics: {
            averageStudentRating: 4.5,
            totalClassesTaken: 0,
            punctualityScore: 95,
            studentFeedbackCount: 0,
            researchPublications: 15,
            lastEvaluationDate: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          organizationId: 'org1',
          departmentId: 'dept1',
          department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
          employeeId: 'EMP002',
          firstName: 'Dr. Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@university.edu',
          phone: '+1234567891',
          designation: 'Associate Professor',
          qualification: 'Ph.D. Software Engineering',
          specializations: ['Software Engineering', 'Web Development'],
          nepCategories: ['CORE', 'SKILL_BASED'],
          maxHoursPerWeek: 35,
          currentWorkload: 0,
          isAvailable: true,
          availability: [],
          assignedSubjects: [],
          workloadAnalysis: {
            currentHoursPerWeek: 0,
            maxHoursPerWeek: 35,
            utilizationPercentage: 0,
            isOverloaded: false,
            isUnderloaded: true,
            recommendedHours: 18,
            workloadDistribution: { lectures: 0, tutorials: 0, practicals: 0, projects: 0, research: 0 },
            availabilityScore: 100
          },
          performanceMetrics: {
            averageStudentRating: 4.3,
            totalClassesTaken: 0,
            punctualityScore: 92,
            studentFeedbackCount: 0,
            researchPublications: 12,
            lastEvaluationDate: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setFacultyList(mockFaculty);
      setFilteredFaculty(mockFaculty);
    };

    loadFacultyData();
  }, []);

  // Filter faculty based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = facultyList.filter(faculty =>
        `${faculty.firstName} ${faculty.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFaculty(filtered);
    } else {
      setFilteredFaculty(facultyList);
    }
  }, [searchTerm, facultyList]);

  // Load subjects for selected faculty
  useEffect(() => {
    if (selectedFaculty) {
      // Mock subjects - replace with actual API call
      const mockSubjects: SubjectDetails[] = [
        {
          id: 'sub1',
          organizationId: 'org1',
          departmentId: 'dept1',
          department: { id: 'dept1', organizationId: 'org1', name: 'Computer Science', code: 'CS', description: '', hodId: '', nepCategories: [], createdAt: new Date(), updatedAt: new Date() },
          code: 'CS101',
          name: 'Introduction to Programming',
          description: 'Basic programming concepts and algorithms',
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
          offeredInYears: [1],
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
          code: 'CS201',
          name: 'Data Structures',
          description: 'Advanced data structures and algorithms',
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
          offeredInYears: [2],
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
        }
      ];
      setSubjects(mockSubjects);
    }
  }, [selectedFaculty]);

  const handleGenerateSchedule = async () => {
    if (!selectedFaculty || !selectedSemester || !selectedAcademicYear) {
      alert('Please select faculty, semester, and academic year');
      return;
    }

    setIsGenerating(true);
    try {
      // Mock generation - replace with actual API call
      const mockSchedule: FacultyScheduleResult = {
        success: true,
        facultyId: selectedFaculty.id,
        semester: selectedSemester,
        academicYear: selectedAcademicYear,
        schedule: [
          {
            id: 'slot1',
            day: 'Monday',
            timeSlot: '9:00 AM - 10:00 AM',
            startTime: '09:00',
            endTime: '10:00',
            duration: 60,
            subjectId: 'sub1',
            subjectName: 'Introduction to Programming',
            subjectCode: 'CS101',
            subjectType: 'LECTURE',
            facultyId: selectedFaculty.id,
            facultyName: `${selectedFaculty.firstName} ${selectedFaculty.lastName}`,
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
          totalCredits: 12,
          subjectDistribution: { core: 8, elective: 4, skillBased: 0, total: 12 },
          timeDistribution: { morning: 12, afternoon: 6, evening: 2 },
          dayDistribution: { monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 0, sunday: 0 },
          facultyDistribution: {},
          workloadBalance: 85,
          preferencesMet: 90,
          nepComplianceScore: 95
        },
        conflicts: [],
        recommendations: ['Schedule looks well-balanced', 'Consider adding more practical sessions'],
        nepCompliance: {
          isCompliant: true,
          complianceScore: 95,
          violations: [],
          recommendations: [],
          detailedBreakdown: {
            creditDistribution: {
              core: { current: 8, required: 8, percentage: 100 },
              elective: { current: 4, required: 4, percentage: 100 },
              skill: { current: 0, required: 0, percentage: 100 }
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
          facultyName: `${selectedFaculty.firstName} ${selectedFaculty.lastName}`,
          departmentName: selectedFaculty.department.name,
          assignedSubjects: subjects.map(s => s.id),
          totalCredits: 12,
          facultiesInvolved: [selectedFaculty.id],
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

  const handleExport = async (format: 'pdf' | 'excel' | 'calendar') => {
    if (!generatedSchedule) return;

    setIsExporting(true);
    try {
      // Mock export - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (format) {
        case 'pdf':
          // Implement PDF export
          alert('PDF export functionality will be implemented');
          break;
        case 'excel':
          // Implement Excel export
          alert('Excel export functionality will be implemented');
          break;
        case 'calendar':
          // Implement Calendar sync
          alert('Calendar sync functionality will be implemented');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderScheduleGrid = () => {
    if (!generatedSchedule) return null;

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
          <h2 className="text-2xl font-bold text-gray-900">Faculty Timetable Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-6">
              {/* Faculty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Faculty
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                    {filteredFaculty.map(faculty => (
                      <div
                        key={faculty.id}
                        onClick={() => setSelectedFaculty(faculty)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedFaculty?.id === faculty.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="font-medium">{faculty.firstName} {faculty.lastName}</div>
                        <div className="text-sm text-gray-600">{faculty.designation}</div>
                        <div className="text-xs text-gray-500">{faculty.employeeId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Semester and Academic Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Year</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>
              </div>

              {/* Subject Preview */}
              {selectedFaculty && subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects Faculty Teaches
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {subjects.map(subject => (
                      <div key={subject.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{subject.code} - {subject.name}</div>
                        <div className="text-gray-600">{subject.credits} credits</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generation Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generation Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.preferMorning}
                      onChange={(e) => setGenerationOptions(prev => ({ ...prev, preferMorning: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Prefer Morning Slots</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.preferEvening}
                      onChange={(e) => setGenerationOptions(prev => ({ ...prev, preferEvening: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Prefer Evening Slots</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.minimizeGaps}
                      onChange={(e) => setGenerationOptions(prev => ({ ...prev, minimizeGaps: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Minimize Gaps</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.optimizeWorkload}
                      onChange={(e) => setGenerationOptions(prev => ({ ...prev, optimizeWorkload: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Optimize Workload</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generationOptions.avoidConflicts}
                      onChange={(e) => setGenerationOptions(prev => ({ ...prev, avoidConflicts: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Avoid Conflicts</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateSchedule}
                disabled={!selectedFaculty || !selectedSemester || !selectedAcademicYear || isGenerating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Timetable'
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
                    <h3 className="text-lg font-semibold mb-3">Generated Schedule</h3>
                    {renderScheduleGrid()}
                  </div>

                  {/* Export Options */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <Icon name="download" className="w-4 h-4" />
                      <span>Export PDF</span>
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <Icon name="download" className="w-4 h-4" />
                      <span>Export Excel</span>
                    </button>
                    <button
                      onClick={() => handleExport('calendar')}
                      disabled={isExporting}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Icon name="calendar" className="w-4 h-4" />
                      <span>Sync Calendar</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Icon name="calendar" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Generate a timetable to see the results here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyTimetableGenerator;
