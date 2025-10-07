import React, { useState } from 'react';
import { Icon } from '../Icons';
import { FacultyManagementComponent } from './FacultyManagementComponent';
import { StudentEnrollmentComponent } from './StudentEnrollmentComponent';
import { SubjectManagementComponent } from './SubjectManagementComponent';
import { ConstraintConfigurationComponent } from './ConstraintConfigurationComponent';

interface AdminDataManagementProps {
  onBack: () => void;
}

type AdminView = 'DASHBOARD' | 'FACULTY' | 'STUDENTS' | 'SUBJECTS' | 'CONSTRAINTS';

export const AdminDataManagement: React.FC<AdminDataManagementProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<AdminView>('DASHBOARD');

  const adminModules = [
    {
      id: 'FACULTY' as AdminView,
      title: 'Faculty Management',
      description: 'Manage faculty members, availability, and subject assignments',
      icon: 'users',
      color: 'blue',
      stats: { total: 45, active: 42, available: 38 }
    },
    {
      id: 'STUDENTS' as AdminView,
      title: 'Student Enrollment',
      description: 'Handle student registrations and NEP compliance tracking',
      icon: 'graduation-cap',
      color: 'green',
      stats: { total: 1250, enrolled: 1200, compliant: 1150 }
    },
    {
      id: 'SUBJECTS' as AdminView,
      title: 'Subject Management',
      description: 'Configure subjects, NEP categories, and assessment patterns',
      icon: 'book',
      color: 'purple',
      stats: { total: 120, offered: 110, core: 60 }
    },
    {
      id: 'CONSTRAINTS' as AdminView,
      title: 'Constraint Configuration',
      description: 'Set institutional preferences and conflict resolution rules',
      icon: 'settings',
      color: 'orange',
      stats: { rules: 15, active: 12, conflicts: 3 }
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'purple':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'orange':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'FACULTY':
        return <FacultyManagementComponent onBack={() => setCurrentView('DASHBOARD')} />;
      case 'STUDENTS':
        return <StudentEnrollmentComponent onBack={() => setCurrentView('DASHBOARD')} />;
      case 'SUBJECTS':
        return <SubjectManagementComponent onBack={() => setCurrentView('DASHBOARD')} />;
      case 'CONSTRAINTS':
        return <ConstraintConfigurationComponent onBack={() => setCurrentView('DASHBOARD')} />;
      default:
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Icon name="arrow-left" className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Data Management</h1>
                    <p className="text-gray-600 mt-1">Comprehensive management system for academic data and configurations</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon name="users" className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Faculty</p>
                      <p className="text-2xl font-semibold text-gray-900">45</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Icon name="graduation-cap" className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-semibold text-gray-900">1,250</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Icon name="book" className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                      <p className="text-2xl font-semibold text-gray-900">120</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Icon name="settings" className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Rules</p>
                      <p className="text-2xl font-semibold text-gray-900">15</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminModules.map(module => (
                  <div
                    key={module.id}
                    onClick={() => setCurrentView(module.id)}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${getColorClasses(module.color)}`}>
                        <Icon name={module.icon} className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{module.title}</h3>
                        <p className="text-gray-600 mb-4">{module.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {Object.entries(module.stats).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <p className="font-semibold text-gray-900">{value.toLocaleString()}</p>
                              <p className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Icon name="chevron-right" className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="mt-8 bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">New faculty member added: Dr. Sarah Johnson</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Student enrollment updated: 25 new students</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Subject CS301 updated with new assessment pattern</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Constraint rules updated for room booking</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Icon name="upload" className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Bulk Upload Data</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Icon name="download" className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Export Reports</span>
                    </button>
                    <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Icon name="refresh" className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Sync Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderCurrentView();
};



