import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { Department, GeneratedTimetable, TimetableQualityMetrics, ConstraintViolation } from '../types/nep-interfaces';

interface BatchTimetableGeneratorProps {
  user: any;
  onClose: () => void;
}

interface BatchSelection {
  year: number;
  departmentId: string;
  department: Department;
  studentCount: number;
  isSelected: boolean;
}

interface GenerationProgress {
  batchId: string;
  batchName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  conflicts: number;
  errors: string[];
}

interface ResourceUtilization {
  facultyUtilization: Record<string, number>;
  roomUtilization: Record<string, number>;
  averageWorkload: number;
  conflictCount: number;
  optimizationScore: number;
}

const BatchTimetableGenerator: React.FC<BatchTimetableGeneratorProps> = ({ user, onClose }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batchSelections, setBatchSelections] = useState<BatchSelection[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress[]>([]);
  const [generatedTimetables, setGeneratedTimetables] = useState<GeneratedTimetable[]>([]);
  const [conflictResolution, setConflictResolution] = useState<{
    totalConflicts: number;
    resolvedConflicts: number;
    remainingConflicts: number;
    conflicts: ConstraintViolation[];
  }>({
    totalConflicts: 0,
    resolvedConflicts: 0,
    remainingConflicts: 0,
    conflicts: []
  });
  const [resourceUtilization, setResourceUtilization] = useState<ResourceUtilization>({
    facultyUtilization: {},
    roomUtilization: {},
    averageWorkload: 0,
    conflictCount: 0,
    optimizationScore: 0
  });
  const [activeTab, setActiveTab] = useState<'generation' | 'conflicts' | 'resources' | 'comparison'>('generation');

  const years = [1, 2, 3, 4];

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      // Mock departments - replace with actual API call
      const mockDepartments: Department[] = [
        {
          id: 'dept1',
          organizationId: 'org1',
          name: 'Computer Science and Engineering',
          code: 'CSE',
          description: 'Computer Science and Engineering Department',
          hodId: 'hod1',
          nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dept2',
          organizationId: 'org1',
          name: 'Information Technology',
          code: 'IT',
          description: 'Information Technology Department',
          hodId: 'hod2',
          nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dept3',
          organizationId: 'org1',
          name: 'Electronics and Communication Engineering',
          code: 'ECE',
          description: 'Electronics and Communication Engineering Department',
          hodId: 'hod3',
          nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setDepartments(mockDepartments);
    };

    loadDepartments();
  }, []);

  // Generate batch selections based on year and department filters
  useEffect(() => {
    const generateBatchSelections = () => {
      const selections: BatchSelection[] = [];
      
      years.forEach(year => {
        departments.forEach(dept => {
          if ((!selectedYear || selectedYear === year) && 
              (!selectedDepartment || selectedDepartment === dept.id)) {
            selections.push({
              year,
              departmentId: dept.id,
              department: dept,
              studentCount: Math.floor(Math.random() * 100) + 50, // Mock student count
              isSelected: false
            });
          }
        });
      });
      
      setBatchSelections(selections);
    };

    generateBatchSelections();
  }, [selectedYear, selectedDepartment, departments]);

  const handleBatchToggle = (year: number, departmentId: string) => {
    setBatchSelections(prev => 
      prev.map(batch => 
        batch.year === year && batch.departmentId === departmentId
          ? { ...batch, isSelected: !batch.isSelected }
          : batch
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = batchSelections.every(batch => batch.isSelected);
    setBatchSelections(prev => 
      prev.map(batch => ({ ...batch, isSelected: !allSelected }))
    );
  };

  const handleGenerateBatch = async () => {
    const selectedBatches = batchSelections.filter(batch => batch.isSelected);
    if (selectedBatches.length === 0) {
      alert('Please select at least one batch');
      return;
    }

    setIsGenerating(true);
    
    // Initialize progress tracking
    const progress: GenerationProgress[] = selectedBatches.map(batch => ({
      batchId: `${batch.year}-${batch.departmentId}`,
      batchName: `${batch.department.name} - Year ${batch.year}`,
      status: 'pending',
      progress: 0,
      conflicts: 0,
      errors: []
    }));
    setGenerationProgress(progress);

    try {
      // Simulate batch generation
      for (let i = 0; i < selectedBatches.length; i++) {
        const batch = selectedBatches[i];
        
        // Update progress to processing
        setGenerationProgress(prev => 
          prev.map(p => 
            p.batchId === `${batch.year}-${batch.departmentId}`
              ? { ...p, status: 'processing', progress: 0 }
              : p
          )
        );

        // Simulate generation progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setGenerationProgress(prev => 
            prev.map(p => 
              p.batchId === `${batch.year}-${batch.departmentId}`
                ? { ...p, progress }
                : p
            )
          );
        }

        // Mock generated timetable
        const mockTimetable: GeneratedTimetable = {
          id: `tt-${batch.year}-${batch.departmentId}`,
          organizationId: 'org1',
          academicYearId: 'ay1',
          semesterId: 'sem1',
          name: `${batch.department.name} - Year ${batch.year} Timetable`,
          description: `Timetable for ${batch.department.name} Year ${batch.year}`,
          year: batch.year,
          departmentId: batch.departmentId,
          department: batch.department,
          status: 'GENERATED',
          version: 1,
          generatedAt: new Date(),
          generatedBy: user.uid,
          totalConflicts: Math.floor(Math.random() * 5),
          constraintViolations: [],
          optimizationScore: Math.floor(Math.random() * 20) + 80,
          qualityMetrics: {
            facultyWorkloadBalance: Math.floor(Math.random() * 20) + 80,
            roomUtilization: Math.floor(Math.random() * 20) + 80,
            studentLoadBalance: Math.floor(Math.random() * 20) + 80,
            conflictScore: Math.floor(Math.random() * 20) + 80,
            preferenceSatisfaction: Math.floor(Math.random() * 20) + 80,
            nepComplianceScore: Math.floor(Math.random() * 20) + 80,
            overallScore: Math.floor(Math.random() * 20) + 80
          },
          nepCompliance: {
            isCompliant: true,
            creditDistribution: { core: 60, elective: 30, skill: 10 },
            assessmentPatternCompliance: true,
            prerequisiteCompliance: true,
            facultyWorkloadCompliance: true,
            violations: [],
            recommendations: [],
            complianceScore: 95
          },
          statistics: {
            totalSlots: Math.floor(Math.random() * 50) + 100,
            totalHours: Math.floor(Math.random() * 200) + 400,
            averageSlotsPerDay: Math.floor(Math.random() * 10) + 15,
            facultyUtilization: {},
            roomUtilization: {},
            subjectDistribution: {},
            classTypeDistribution: {} as any,
            conflictCount: Math.floor(Math.random() * 5),
            resolutionCount: 0
          },
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
            passedChecks: [],
            failedChecks: [],
            overallScore: 90
          },
          slots: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Update progress to completed
        setGenerationProgress(prev => 
          prev.map(p => 
            p.batchId === `${batch.year}-${batch.departmentId}`
              ? { 
                  ...p, 
                  status: 'completed', 
                  progress: 100,
                  conflicts: mockTimetable.totalConflicts
                }
              : p
          )
        );

        // Add to generated timetables
        setGeneratedTimetables(prev => [...prev, mockTimetable]);
      }

      // Update conflict resolution and resource utilization
      const totalConflicts = generatedTimetables.reduce((sum, tt) => sum + tt.totalConflicts, 0);
      setConflictResolution({
        totalConflicts,
        resolvedConflicts: Math.floor(totalConflicts * 0.8),
        remainingConflicts: Math.floor(totalConflicts * 0.2),
        conflicts: []
      });

      setResourceUtilization({
        facultyUtilization: {},
        roomUtilization: {},
        averageWorkload: 75,
        conflictCount: totalConflicts,
        optimizationScore: 85
      });

    } catch (error) {
      console.error('Error generating batch timetables:', error);
      alert('Failed to generate some timetables. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderGenerationTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Year
          </label>
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSelectAll}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            {batchSelections.every(batch => batch.isSelected) ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Batch Selection */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Select Batches for Generation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchSelections.map(batch => (
            <div
              key={`${batch.year}-${batch.departmentId}`}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                batch.isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleBatchToggle(batch.year, batch.departmentId)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{batch.department.name}</div>
                  <div className="text-sm text-gray-600">Year {batch.year}</div>
                  <div className="text-xs text-gray-500">{batch.studentCount} students</div>
                </div>
                <input
                  type="checkbox"
                  checked={batch.isSelected}
                  onChange={() => handleBatchToggle(batch.year, batch.departmentId)}
                  className="ml-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Progress */}
      {generationProgress.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Generation Progress</h3>
          <div className="space-y-3">
            {generationProgress.map(progress => (
              <div key={progress.batchId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{progress.batchName}</span>
                  <span className={`text-sm ${
                    progress.status === 'completed' ? 'text-green-600' :
                    progress.status === 'failed' ? 'text-red-600' :
                    progress.status === 'processing' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {progress.status === 'completed' ? 'Completed' :
                     progress.status === 'failed' ? 'Failed' :
                     progress.status === 'processing' ? 'Processing...' :
                     'Pending'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      progress.status === 'completed' ? 'bg-green-500' :
                      progress.status === 'failed' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
                {progress.conflicts > 0 && (
                  <div className="text-sm text-orange-600">
                    {progress.conflicts} conflicts detected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerateBatch}
        disabled={batchSelections.filter(batch => batch.isSelected).length === 0 || isGenerating}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Generating Timetables...
          </>
        ) : (
          'Generate Selected Batches'
        )}
      </button>
    </div>
  );

  const renderConflictsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Conflict Resolution Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{conflictResolution.totalConflicts}</div>
            <div className="text-sm text-gray-600">Total Conflicts</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{conflictResolution.resolvedConflicts}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{conflictResolution.remainingConflicts}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>
        
        {conflictResolution.conflicts.length > 0 ? (
          <div className="space-y-2">
            {conflictResolution.conflicts.map((conflict, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-red-800">{conflict.constraintName}</div>
                    <div className="text-sm text-gray-600">{conflict.description}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    conflict.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    conflict.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {conflict.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Icon name="check" className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No conflicts detected</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderResourcesTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Resource Utilization Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{resourceUtilization.averageWorkload}%</div>
            <div className="text-sm text-gray-600">Avg Faculty Workload</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{resourceUtilization.optimizationScore}%</div>
            <div className="text-sm text-gray-600">Optimization Score</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{resourceUtilization.conflictCount}</div>
            <div className="text-sm text-gray-600">Total Conflicts</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{generatedTimetables.length}</div>
            <div className="text-sm text-gray-600">Generated Timetables</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-3">Faculty Utilization</h4>
            <div className="space-y-2">
              {Object.entries(resourceUtilization.facultyUtilization).map(([faculty, utilization]) => (
                <div key={faculty} className="flex justify-between items-center">
                  <span className="text-sm">{faculty}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${utilization}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{utilization}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-3">Room Utilization</h4>
            <div className="space-y-2">
              {Object.entries(resourceUtilization.roomUtilization).map(([room, utilization]) => (
                <div key={room} className="flex justify-between items-center">
                  <span className="text-sm">{room}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${utilization}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{utilization}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComparisonTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Schedule Comparison Tools</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {generatedTimetables.map(timetable => (
            <div key={timetable.id} className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">{timetable.name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Optimization Score:</span>
                  <span className="font-medium">{timetable.optimizationScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Conflicts:</span>
                  <span className="font-medium">{timetable.totalConflicts}</span>
                </div>
                <div className="flex justify-between">
                  <span>NEP Compliance:</span>
                  <span className="font-medium">{timetable.nepCompliance.complianceScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Faculty Balance:</span>
                  <span className="font-medium">{timetable.qualityMetrics.facultyWorkloadBalance}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Batch Timetable Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'generation', label: 'Generation', icon: 'calendar' },
              { id: 'conflicts', label: 'Conflicts', icon: 'warning' },
              { id: 'resources', label: 'Resources', icon: 'chart' },
              { id: 'comparison', label: 'Comparison', icon: 'compare' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon name={tab.icon as any} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'generation' && renderGenerationTab()}
          {activeTab === 'conflicts' && renderConflictsTab()}
          {activeTab === 'resources' && renderResourcesTab()}
          {activeTab === 'comparison' && renderComparisonTab()}
        </div>
      </div>
    </div>
  );
};

export default BatchTimetableGenerator;
