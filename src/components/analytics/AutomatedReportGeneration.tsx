import React, { useState, useEffect } from 'react';
import { 
  AutomatedReportGeneration, 
  ScheduledReport, 
  ReportTemplate, 
  DeliveryChannel, 
  GenerationHistory,
  ReportConfiguration 
} from '../../types';
import { Icon } from '../Icons';

interface AutomatedReportGenerationProps {
  onClose: () => void;
}

export const AutomatedReportGeneration: React.FC<AutomatedReportGenerationProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'templates' | 'channels' | 'history' | 'config'>('scheduled');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<AutomatedReportGeneration | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from API
      const mockData: AutomatedReportGeneration = {
        scheduledReports: [
          {
            id: 'R001',
            name: 'Weekly Resource Utilization Report',
            template: 'resource-utilization-template',
            schedule: '0 9 * * 1', // Every Monday at 9 AM
            recipients: ['admin@university.edu', 'dean@university.edu'],
            format: 'PDF',
            lastGenerated: new Date('2024-01-15T09:00:00'),
            nextGeneration: new Date('2024-01-22T09:00:00'),
            status: 'ACTIVE'
          },
          {
            id: 'R002',
            name: 'Monthly NEP Compliance Report',
            template: 'nep-compliance-template',
            schedule: '0 10 1 * *', // First day of every month at 10 AM
            recipients: ['compliance@university.edu', 'admin@university.edu'],
            format: 'EXCEL',
            lastGenerated: new Date('2024-01-01T10:00:00'),
            nextGeneration: new Date('2024-02-01T10:00:00'),
            status: 'ACTIVE'
          },
          {
            id: 'R003',
            name: 'Daily Performance Metrics',
            template: 'performance-metrics-template',
            schedule: '0 18 * * *', // Every day at 6 PM
            recipients: ['admin@university.edu'],
            format: 'CSV',
            lastGenerated: new Date('2024-01-20T18:00:00'),
            nextGeneration: new Date('2024-01-21T18:00:00'),
            status: 'PAUSED'
          }
        ],
        reportTemplates: [
          {
            id: 'T001',
            name: 'Resource Utilization Template',
            description: 'Comprehensive resource utilization analysis report',
            type: 'ANALYTICS',
            template: 'resource-utilization-template.html',
            parameters: [
              {
                name: 'startDate',
                type: 'DATE',
                required: true,
                defaultValue: null,
                description: 'Start date for the report period'
              },
              {
                name: 'endDate',
                type: 'DATE',
                required: true,
                defaultValue: null,
                description: 'End date for the report period'
              },
              {
                name: 'includeCharts',
                type: 'BOOLEAN',
                required: false,
                defaultValue: true,
                description: 'Include visual charts in the report'
              }
            ],
            createdBy: 'admin@university.edu',
            createdAt: new Date('2024-01-01'),
            lastModified: new Date('2024-01-15')
          },
          {
            id: 'T002',
            name: 'NEP Compliance Template',
            description: 'NEP compliance analysis and recommendations',
            type: 'COMPLIANCE',
            template: 'nep-compliance-template.html',
            parameters: [
              {
                name: 'department',
                type: 'SELECT',
                required: false,
                defaultValue: 'ALL',
                options: ['ALL', 'CS', 'IT', 'ECE', 'ME', 'CE'],
                description: 'Department to include in the report'
              },
              {
                name: 'includeRecommendations',
                type: 'BOOLEAN',
                required: false,
                defaultValue: true,
                description: 'Include improvement recommendations'
              }
            ],
            createdBy: 'compliance@university.edu',
            createdAt: new Date('2024-01-01'),
            lastModified: new Date('2024-01-10')
          }
        ],
        deliveryChannels: [
          {
            id: 'C001',
            type: 'EMAIL',
            configuration: {
              smtpServer: 'smtp.university.edu',
              port: 587,
              username: 'reports@university.edu',
              useTLS: true
            },
            enabled: true,
            lastUsed: new Date('2024-01-20T18:00:00')
          },
          {
            id: 'C002',
            type: 'CLOUD_STORAGE',
            configuration: {
              provider: 'AWS S3',
              bucket: 'university-reports',
              region: 'us-east-1',
              path: 'automated-reports/'
            },
            enabled: true,
            lastUsed: new Date('2024-01-20T18:00:00')
          }
        ],
        generationHistory: [
          {
            id: 'H001',
            reportId: 'R001',
            reportName: 'Weekly Resource Utilization Report',
            generatedAt: new Date('2024-01-15T09:00:00'),
            status: 'SUCCESS',
            size: 1024000,
            duration: 45000,
            recipients: ['admin@university.edu', 'dean@university.edu'],
            errorMessage: undefined
          },
          {
            id: 'H002',
            reportId: 'R002',
            reportName: 'Monthly NEP Compliance Report',
            generatedAt: new Date('2024-01-01T10:00:00'),
            status: 'SUCCESS',
            size: 512000,
            duration: 30000,
            recipients: ['compliance@university.edu', 'admin@university.edu'],
            errorMessage: undefined
          },
          {
            id: 'H003',
            reportId: 'R003',
            reportName: 'Daily Performance Metrics',
            generatedAt: new Date('2024-01-19T18:00:00'),
            status: 'FAILED',
            size: 0,
            duration: 15000,
            recipients: ['admin@university.edu'],
            errorMessage: 'Template not found'
          }
        ],
        configuration: {
          defaultFormat: 'PDF',
          maxRetries: 3,
          timeout: 300000,
          compression: true,
          encryption: true,
          retentionDays: 365,
          backupEnabled: true
        }
      };

      setReportData(mockData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = () => {
    setShowCreateModal(true);
  };

  const handleEditReport = (report: ScheduledReport) => {
    setSelectedReport(report);
    setShowEditModal(true);
  };

  const handleToggleReport = async (reportId: string) => {
    if (!reportData) return;
    
    const updatedReports = reportData.scheduledReports.map(report => 
      report.id === reportId 
        ? { ...report, status: report.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
        : report
    );
    
    setReportData({
      ...reportData,
      scheduledReports: updatedReports
    });
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!reportData) return;
    
    const updatedReports = reportData.scheduledReports.filter(report => report.id !== reportId);
    setReportData({
      ...reportData,
      scheduledReports: updatedReports
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'PAUSED': return 'text-yellow-600 bg-yellow-100';
      case 'ERROR': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGenerationStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      case 'PARTIAL': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderScheduledReports = () => {
    if (!reportData) return <div>No data available</div>;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Scheduled Reports</h3>
          <button
            onClick={handleCreateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Create Report
          </button>
        </div>

        <div className="grid gap-4">
          {reportData.scheduledReports.map((report) => (
            <div key={report.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-600">Template: {report.template}</p>
                  <p className="text-sm text-gray-600">Schedule: {report.schedule}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditReport(report)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Icon name="edit" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleReport(report.id)}
                      className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                    >
                      <Icon name={report.status === 'ACTIVE' ? 'pause' : 'play'} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Format:</span>
                  <span className="ml-2 font-medium">{report.format}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Generated:</span>
                  <span className="ml-2 font-medium">
                    {report.lastGenerated.toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Next Generation:</span>
                  <span className="ml-2 font-medium">
                    {report.nextGeneration.toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-3">
                <span className="text-gray-600 text-sm">Recipients:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.recipients.map((recipient, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {recipient}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTemplates = () => {
    if (!reportData) return <div>No data available</div>;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Report Templates</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Create Template
          </button>
        </div>

        <div className="grid gap-4">
          {reportData.reportTemplates.map((template) => (
            <div key={template.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <p className="text-sm text-gray-600">Type: {template.type}</p>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                    <Icon name="edit" className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Created by:</span>
                  <span className="ml-2 font-medium">{template.createdBy}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last modified:</span>
                  <span className="ml-2 font-medium">
                    {template.lastModified.toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-3">
                <span className="text-gray-600 text-sm">Parameters:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.parameters.map((param, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {param.name} ({param.type})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChannels = () => {
    if (!reportData) return <div>No data available</div>;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Delivery Channels</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Add Channel
          </button>
        </div>

        <div className="grid gap-4">
          {reportData.deliveryChannels.map((channel) => (
            <div key={channel.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{channel.type}</h4>
                  <p className="text-sm text-gray-600">
                    Last used: {channel.lastUsed.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    channel.enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                  }`}>
                    {channel.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <Icon name="edit" className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(channel.configuration, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (!reportData) return <div>No data available</div>;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Generation History</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.generationHistory.map((history) => (
                <tr key={history.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {history.reportName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {history.generatedAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getGenerationStatusColor(history.status)}`}>
                      {history.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatFileSize(history.size)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDuration(history.duration)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {history.recipients.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderConfiguration = () => {
    if (!reportData) return <div>No data available</div>;

    const config = reportData.configuration;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3">General Settings</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Default Format:</span>
                <span className="text-sm font-medium">{config.defaultFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Retries:</span>
                <span className="text-sm font-medium">{config.maxRetries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Timeout:</span>
                <span className="text-sm font-medium">{config.timeout / 1000}s</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3">Security & Storage</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Compression:</span>
                <span className={`text-sm font-medium ${config.compression ? 'text-green-600' : 'text-red-600'}`}>
                  {config.compression ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Encryption:</span>
                <span className={`text-sm font-medium ${config.encryption ? 'text-green-600' : 'text-red-600'}`}>
                  {config.encryption ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Retention Days:</span>
                <span className="text-sm font-medium">{config.retentionDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Backup:</span>
                <span className={`text-sm font-medium ${config.backupEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {config.backupEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Loading report data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Automated Report Generation</h2>
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
            { id: 'scheduled', label: 'Scheduled Reports', icon: 'clock' },
            { id: 'templates', label: 'Templates', icon: 'file' },
            { id: 'channels', label: 'Delivery Channels', icon: 'mail' },
            { id: 'history', label: 'Generation History', icon: 'history' },
            { id: 'config', label: 'Configuration', icon: 'settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
          {activeTab === 'scheduled' && renderScheduledReports()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'channels' && renderChannels()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'config' && renderConfiguration()}
        </div>
      </div>
    </div>
  );
};
