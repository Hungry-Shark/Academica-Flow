import React, { useState, useEffect } from 'react';
import { 
  TimetableAnalytics, 
  PredictiveOptimization, 
  StudentExperienceOptimizer, 
  ReportingDashboard,
  UserProfile 
} from '../../types';
import { AnalyticsService } from '../../services/analytics-service';
import { PredictiveOptimizationService } from '../../services/predictive-optimization-service';
import { StudentExperienceOptimizerService } from '../../services/student-experience-optimizer';
import { ReportingDashboardService } from '../../services/reporting-dashboard-service';
import { Icon } from '../Icons';

interface AnalyticsDashboardProps {
  user: UserProfile;
  timetableData: any;
  administrativeData: any;
  onClose: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  user,
  timetableData,
  administrativeData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'predictive' | 'student' | 'reporting'>('analytics');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<TimetableAnalytics | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveOptimization | null>(null);
  const [studentData, setStudentData] = useState<StudentExperienceOptimizer | null>(null);
  const [reportingData, setReportingData] = useState<ReportingDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (timetableData && administrativeData) {
      loadAnalyticsData();
    }
  }, [timetableData, administrativeData]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const analyticsService = new AnalyticsService(
        timetableData,
        administrativeData,
        user.organizationToken || '',
        '2024-25',
        'Semester 1'
      );

      const analytics = await analyticsService.generateAnalytics();
      setAnalyticsData(analytics);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPredictiveData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const predictiveService = new PredictiveOptimizationService(
        timetableData,
        administrativeData,
        user.organizationToken || '',
        '2024-25',
        'Semester 1'
      );

      const predictive = await predictiveService.generatePredictiveOptimization();
      setPredictiveData(predictive);
    } catch (err) {
      setError('Failed to load predictive optimization data');
      console.error('Predictive optimization loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const studentService = new StudentExperienceOptimizerService(
        timetableData,
        administrativeData,
        user.organizationToken || '',
        '2024-25',
        'Semester 1'
      );

      const student = await studentService.generateStudentExperienceOptimization();
      setStudentData(student);
    } catch (err) {
      setError('Failed to load student experience optimization data');
      console.error('Student experience optimization loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reportingService = new ReportingDashboardService(
        user.organizationToken || '',
        '2024-25',
        'Semester 1',
        analyticsData,
        null,
        null
      );

      const reporting = await reportingService.generateReportingDashboard();
      setReportingData(reporting);
    } catch (err) {
      setError('Failed to load reporting dashboard data');
      console.error('Reporting dashboard loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'analytics' | 'predictive' | 'student' | 'reporting') => {
    setActiveTab(tab);
    
    if (tab === 'predictive' && !predictiveData) {
      loadPredictiveData();
    } else if (tab === 'student' && !studentData) {
      loadStudentData();
    } else if (tab === 'reporting' && !reportingData) {
      loadReportingData();
    }
  };

  const renderAnalyticsTab = () => {
    if (!analyticsData) return <div>No analytics data available</div>;

    return (
      <div className="space-y-6">
        {/* Resource Utilization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.resourceUtilization.overallUtilization.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Utilization</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.resourceUtilization.roomUtilization.length}
              </div>
              <div className="text-sm text-gray-600">Rooms Analyzed</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.resourceUtilization.facultyUtilization.length}
              </div>
              <div className="text-sm text-gray-600">Faculty Analyzed</div>
            </div>
          </div>
        </div>

        {/* Student Workload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Student Workload Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {analyticsData.studentWorkload.workloadDistribution.light}
              </div>
              <div className="text-sm text-gray-600">Light Days</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {analyticsData.studentWorkload.workloadDistribution.moderate}
              </div>
              <div className="text-sm text-gray-600">Moderate Days</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">
                {analyticsData.studentWorkload.workloadDistribution.heavy}
              </div>
              <div className="text-sm text-gray-600">Heavy Days</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {analyticsData.studentWorkload.workloadDistribution.excessive}
              </div>
              <div className="text-sm text-gray-600">Excessive Days</div>
            </div>
          </div>
        </div>

        {/* NEP Compliance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">NEP Compliance</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-600">
              {analyticsData.nepCompliance.overallScore}%
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-xs text-gray-500">
                {analyticsData.nepCompliance.violations.length} violations
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <div className="space-y-2">
            {analyticsData.resourceUtilization.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Icon name="check" className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <span className="text-sm text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPredictiveTab = () => {
    if (!predictiveData) return <div>No predictive optimization data available</div>;

    return (
      <div className="space-y-6">
        {/* Enrollment Predictions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Enrollment Predictions</h3>
          <div className="space-y-3">
            {predictiveData.enrollmentPredictions.slice(0, 5).map((prediction, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{prediction.courseName}</div>
                  <div className="text-sm text-gray-600">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {prediction.predictedEnrollment}
                  </div>
                  <div className="text-sm text-gray-600">students</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Allocation Suggestions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Room Allocation Suggestions</h3>
          <div className="space-y-3">
            {predictiveData.roomAllocationSuggestions.slice(0, 5).map((suggestion, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{suggestion.roomName}</div>
                  <div className="text-sm text-gray-600">
                    Current: {suggestion.currentUtilization.toFixed(1)}% → 
                    Suggested: {suggestion.suggestedUtilization.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    +{suggestion.improvement.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">improvement</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty Workload Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Faculty Workload Recommendations</h3>
          <div className="space-y-3">
            {predictiveData.facultyWorkloadRecommendations.slice(0, 5).map((recommendation, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{recommendation.facultyName}</div>
                  <div className="text-sm text-gray-600">
                    Current: {recommendation.currentWorkload}h → 
                    Recommended: {recommendation.recommendedWorkload}h
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {recommendation.adjustment > 0 ? '+' : ''}{recommendation.adjustment}h
                  </div>
                  <div className="text-sm text-gray-600">adjustment</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStudentTab = () => {
    if (!studentData) return <div>No student experience optimization data available</div>;

    return (
      <div className="space-y-6">
        {/* Travel Time Optimization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Travel Time Optimization</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {studentData.travelTimeOptimization.currentAverageTravelTime.toFixed(1)}min
              </div>
              <div className="text-sm text-gray-600">Current Average</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {studentData.travelTimeOptimization.optimizedAverageTravelTime.toFixed(1)}min
              </div>
              <div className="text-sm text-gray-600">Optimized Average</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                -{studentData.travelTimeOptimization.improvement.toFixed(1)}min
              </div>
              <div className="text-sm text-gray-600">Improvement</div>
            </div>
          </div>
        </div>

        {/* Workload Balancing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Workload Balancing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {studentData.workloadBalancing.currentWorkloadDistribution.light}
              </div>
              <div className="text-sm text-gray-600">Light Days</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {studentData.workloadBalancing.currentWorkloadDistribution.moderate}
              </div>
              <div className="text-sm text-gray-600">Moderate Days</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">
                {studentData.workloadBalancing.currentWorkloadDistribution.heavy}
              </div>
              <div className="text-sm text-gray-600">Heavy Days</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {studentData.workloadBalancing.currentWorkloadDistribution.excessive}
              </div>
              <div className="text-sm text-gray-600">Excessive Days</div>
            </div>
          </div>
        </div>

        {/* Break Timing Optimization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Break Timing Optimization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-semibold mb-2">Current Distribution</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Morning:</span>
                  <span className="font-medium">{studentData.breakTimingOptimization.currentBreakDistribution.morning}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Afternoon:</span>
                  <span className="font-medium">{studentData.breakTimingOptimization.currentBreakDistribution.afternoon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Evening:</span>
                  <span className="font-medium">{studentData.breakTimingOptimization.currentBreakDistribution.evening}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-semibold mb-2">Optimized Distribution</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Morning:</span>
                  <span className="font-medium">{studentData.breakTimingOptimization.optimizedBreakDistribution.morning}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Afternoon:</span>
                  <span className="font-medium">{studentData.breakTimingOptimization.optimizedBreakDistribution.afternoon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Evening:</span>
                  <span className="font-medium">{studentData.breakTimingOptimization.optimizedBreakDistribution.evening}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Group Study Allocation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Group Study Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {studentData.groupStudyAllocation.currentGroupStudyTime}min
              </div>
              <div className="text-sm text-gray-600">Current Time</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {studentData.groupStudyAllocation.optimizedGroupStudyTime}min
              </div>
              <div className="text-sm text-gray-600">Optimized Time</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                +{studentData.groupStudyAllocation.improvement}min
              </div>
              <div className="text-sm text-gray-600">Improvement</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportingTab = () => {
    if (!reportingData) return <div>No reporting dashboard data available</div>;

    return (
      <div className="space-y-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportingData.performanceMetrics.keyMetrics.slice(0, 6).map((metric, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    metric.status === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                    metric.status === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                    metric.status === 'FAIR' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {metric.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value}{metric.unit}
                </div>
                <div className="text-sm text-gray-500">
                  Target: {metric.target}{metric.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Tracking */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Compliance Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reportingData.complianceTracking.overallCompliance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Compliance</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Violations:</span>
                <span className="font-medium">{reportingData.complianceTracking.violationTracking.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Improvements:</span>
                <span className="font-medium">{reportingData.complianceTracking.improvementTracking.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Alerts:</span>
                <span className="font-medium">{reportingData.complianceTracking.alerts.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Administrative Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Administrative Insights</h3>
          <div className="space-y-4">
            {reportingData.administrativeInsights.slice(0, 3).map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    insight.impact === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    insight.impact === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    insight.impact === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {insight.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                <div className="text-xs text-gray-500">
                  Timeline: {insight.timeline} | Priority: {insight.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Optimization Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'analytics', label: 'Timetable Analytics', icon: 'chart' },
            { id: 'predictive', label: 'Predictive Optimization', icon: 'trending' },
            { id: 'student', label: 'Student Experience', icon: 'users' },
            { id: 'reporting', label: 'Reporting Dashboard', icon: 'file' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon name={tab.icon as any} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Icon name="alert" className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {activeTab === 'analytics' && renderAnalyticsTab()}
              {activeTab === 'predictive' && renderPredictiveTab()}
              {activeTab === 'student' && renderStudentTab()}
              {activeTab === 'reporting' && renderReportingTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
