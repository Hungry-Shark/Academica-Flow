import React, { useState, useEffect } from 'react';
import { RealTimeDashboard, LiveMetric, RealTimeAlert, RealTimeUpdate } from '../../types';
import { Icon } from '../Icons';

interface RealTimeDashboardProps {
  onClose: () => void;
}

export const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ onClose }) => {
  const [dashboardData, setDashboardData] = useState<RealTimeDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadRealTimeData();
    const interval = setInterval(loadRealTimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRealTimeData = async () => {
    try {
      // Simulate real-time data loading
      const mockData: RealTimeDashboard = {
        liveMetrics: [
          {
            id: 'resource-utilization',
            name: 'Resource Utilization',
            value: 78.5,
            unit: '%',
            trend: 2.3,
            status: 'NORMAL',
            lastUpdated: new Date()
          },
          {
            id: 'student-satisfaction',
            name: 'Student Satisfaction',
            value: 82.1,
            unit: '%',
            trend: 1.8,
            status: 'NORMAL',
            lastUpdated: new Date()
          },
          {
            id: 'faculty-efficiency',
            name: 'Faculty Efficiency',
            value: 88.7,
            unit: '%',
            trend: -0.5,
            status: 'NORMAL',
            lastUpdated: new Date()
          },
          {
            id: 'nep-compliance',
            name: 'NEP Compliance',
            value: 85.2,
            unit: '%',
            trend: 3.2,
            status: 'NORMAL',
            lastUpdated: new Date()
          },
          {
            id: 'schedule-efficiency',
            name: 'Schedule Efficiency',
            value: 91.3,
            unit: '%',
            trend: 1.1,
            status: 'NORMAL',
            lastUpdated: new Date()
          },
          {
            id: 'conflict-count',
            name: 'Active Conflicts',
            value: 3,
            unit: 'count',
            trend: -1.0,
            status: 'WARNING',
            lastUpdated: new Date()
          }
        ],
        alerts: [
          {
            id: 'A001',
            type: 'PERFORMANCE',
            severity: 'MEDIUM',
            message: 'Resource utilization approaching threshold',
            timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            acknowledged: false,
            actionRequired: 'Monitor resource allocation and consider optimization'
          },
          {
            id: 'A002',
            type: 'COMPLIANCE',
            severity: 'LOW',
            message: 'NEP compliance score improved by 3.2%',
            timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            acknowledged: true,
            actionRequired: 'Continue current compliance initiatives'
          }
        ],
        updates: [
          {
            id: 'U001',
            type: 'DATA',
            description: 'Analytics data refreshed',
            timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
            impact: 'LOW',
            details: 'Resource utilization metrics updated'
          },
          {
            id: 'U002',
            type: 'SCHEDULE',
            description: 'Timetable optimization completed',
            timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            impact: 'MEDIUM',
            details: 'Schedule efficiency improved by 1.1%'
          }
        ],
        lastUpdated: new Date(),
        refreshRate: 30000
      };

      setDashboardData(mockData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load real-time data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-blue-600 bg-blue-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Loading real-time data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <Icon name="alert" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
            <p className="text-gray-600 mb-4">Unable to load real-time dashboard data</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Real-Time Dashboard</h2>
            <p className="text-sm text-gray-600">
              Last updated: {formatTimeAgo(lastUpdated)} • Auto-refresh: 30s
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Metrics */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon name="activity" className="w-5 h-5 mr-2 text-blue-500" />
                  Live Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.liveMetrics.map((metric) => (
                    <div key={metric.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-gray-600">{metric.name}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                          {metric.status}
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {metric.value}{metric.unit}
                        </span>
                        <span className={`text-sm font-medium ${
                          metric.trend > 0 ? 'text-green-600' : metric.trend < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Updated: {formatTimeAgo(metric.lastUpdated)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon name="alert" className="w-5 h-5 mr-2 text-red-500" />
                  Active Alerts
                </h3>
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert) => (
                    <div key={alert.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{alert.message}</p>
                      <p className="text-xs text-gray-600">{alert.actionRequired}</p>
                      {!alert.acknowledged && (
                        <button className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Icon name="refresh" className="w-5 h-5 mr-2 text-green-500" />
                Recent Updates
              </h3>
              <div className="space-y-3">
                {dashboardData.updates.map((update) => (
                  <div key={update.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      update.impact === 'HIGH' ? 'bg-red-500' :
                      update.impact === 'MEDIUM' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-900">{update.description}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(update.impact)}`}>
                          {update.impact}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{update.details}</p>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(update.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
