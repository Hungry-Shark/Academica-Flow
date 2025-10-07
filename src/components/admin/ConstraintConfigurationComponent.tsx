import React, { useState, useEffect } from 'react';
import { Icon } from '../Icons';

interface ConstraintConfigurationComponentProps {
  onBack: () => void;
}

interface InstitutionalPreferences {
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  minBreakBetweenClasses: number;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  preferMorningSlots: boolean;
  avoidBackToBackClasses: boolean;
  minimizeGaps: boolean;
  balanceWorkload: boolean;
  allowWeekendClasses: boolean;
  maxConsecutiveHours: number;
}

interface TimeSlotPattern {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  allowedDays: number[];
  subjectTypes: string[];
}

interface RoomBookingRule {
  id: string;
  roomType: string;
  minBookingDuration: number;
  maxBookingDuration: number;
  advanceBookingDays: number;
  allowConsecutiveBookings: boolean;
  requireApproval: boolean;
  specialRequirements: string[];
}

interface NEPComplianceSettings {
  coreCreditsPercentage: number;
  electiveCreditsPercentage: number;
  skillBasedCreditsPercentage: number;
  minCreditsPerSemester: number;
  maxCreditsPerSemester: number;
  practicalBlockMinHours: number;
  assessmentPatternCompliance: boolean;
  attendanceTrackingRequired: boolean;
  continuousAssessmentMinPercentage: number;
}

interface ConflictResolutionPriority {
  id: string;
  conflictType: string;
  priority: number;
  resolutionStrategy: string;
  autoResolve: boolean;
  requireApproval: boolean;
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

const ROOM_TYPES = [
  'LECTURE_HALL', 'TUTORIAL_ROOM', 'COMPUTER_LAB', 'LABORATORY', 'SEMINAR_ROOM'
];

const CONFLICT_TYPES = [
  'FACULTY_DOUBLE_BOOKING',
  'ROOM_DOUBLE_BOOKING',
  'STUDENT_SUBJECT_CONFLICT',
  'TIME_SLOT_OVERLAP',
  'ROOM_CAPACITY_EXCEEDED',
  'FACULTY_OVERLOAD',
  'STUDENT_OVERLOAD',
  'PREREQUISITE_VIOLATION'
];

const RESOLUTION_STRATEGIES = [
  'AUTO_RESCHEDULE',
  'FIND_ALTERNATIVE_ROOM',
  'FIND_ALTERNATIVE_TIME',
  'REQUIRE_APPROVAL',
  'REJECT_ENROLLMENT',
  'NOTIFY_ADMIN'
];

export const ConstraintConfigurationComponent: React.FC<ConstraintConfigurationComponentProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('institutional');
  const [institutionalPrefs, setInstitutionalPrefs] = useState<InstitutionalPreferences>({
    maxHoursPerDay: 6,
    maxHoursPerWeek: 30,
    minBreakBetweenClasses: 15,
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    preferMorningSlots: true,
    avoidBackToBackClasses: true,
    minimizeGaps: true,
    balanceWorkload: true,
    allowWeekendClasses: false,
    maxConsecutiveHours: 3
  });

  const [timeSlotPatterns, setTimeSlotPatterns] = useState<TimeSlotPattern[]>([]);
  const [roomBookingRules, setRoomBookingRules] = useState<RoomBookingRule[]>([]);
  const [nepSettings, setNepSettings] = useState<NEPComplianceSettings>({
    coreCreditsPercentage: 60,
    electiveCreditsPercentage: 30,
    skillBasedCreditsPercentage: 10,
    minCreditsPerSemester: 15,
    maxCreditsPerSemester: 30,
    practicalBlockMinHours: 2,
    assessmentPatternCompliance: true,
    attendanceTrackingRequired: true,
    continuousAssessmentMinPercentage: 40
  });

  const [conflictPriorities, setConflictPriorities] = useState<ConflictResolutionPriority[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Mock data - replace with actual API calls
    setTimeSlotPatterns([
      {
        id: '1',
        name: 'Morning Lecture',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        isActive: true,
        priority: 'HIGH',
        allowedDays: [1, 2, 3, 4, 5],
        subjectTypes: ['LECTURE']
      },
      {
        id: '2',
        name: 'Afternoon Practical',
        startTime: '14:00',
        endTime: '16:00',
        duration: 120,
        isActive: true,
        priority: 'MEDIUM',
        allowedDays: [1, 2, 3, 4, 5],
        subjectTypes: ['PRACTICAL', 'LABORATORY']
      }
    ]);

    setRoomBookingRules([
      {
        id: '1',
        roomType: 'LECTURE_HALL',
        minBookingDuration: 60,
        maxBookingDuration: 180,
        advanceBookingDays: 7,
        allowConsecutiveBookings: true,
        requireApproval: false,
        specialRequirements: []
      },
      {
        id: '2',
        roomType: 'COMPUTER_LAB',
        minBookingDuration: 120,
        maxBookingDuration: 240,
        advanceBookingDays: 14,
        allowConsecutiveBookings: false,
        requireApproval: true,
        specialRequirements: ['Computer', 'Internet']
      }
    ]);

    setConflictPriorities([
      {
        id: '1',
        conflictType: 'FACULTY_DOUBLE_BOOKING',
        priority: 1,
        resolutionStrategy: 'AUTO_RESCHEDULE',
        autoResolve: true,
        requireApproval: false
      },
      {
        id: '2',
        conflictType: 'ROOM_CAPACITY_EXCEEDED',
        priority: 2,
        resolutionStrategy: 'FIND_ALTERNATIVE_ROOM',
        autoResolve: true,
        requireApproval: false
      }
    ]);
  };

  const validateInstitutionalPrefs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (institutionalPrefs.maxHoursPerDay < 1 || institutionalPrefs.maxHoursPerDay > 12) {
      newErrors.maxHoursPerDay = 'Max hours per day must be between 1 and 12';
    }
    if (institutionalPrefs.maxHoursPerWeek < 1 || institutionalPrefs.maxHoursPerWeek > 60) {
      newErrors.maxHoursPerWeek = 'Max hours per week must be between 1 and 60';
    }
    if (institutionalPrefs.minBreakBetweenClasses < 0 || institutionalPrefs.minBreakBetweenClasses > 120) {
      newErrors.minBreakBetweenClasses = 'Min break must be between 0 and 120 minutes';
    }
    if (institutionalPrefs.maxConsecutiveHours < 1 || institutionalPrefs.maxConsecutiveHours > 8) {
      newErrors.maxConsecutiveHours = 'Max consecutive hours must be between 1 and 8';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveInstitutionalPrefs = () => {
    if (validateInstitutionalPrefs()) {
      // Save to backend
      console.log('Saving institutional preferences:', institutionalPrefs);
      setIsEditing(false);
    }
  };

  const handleSaveTimeSlotPatterns = () => {
    // Save to backend
    console.log('Saving time slot patterns:', timeSlotPatterns);
  };

  const handleSaveRoomBookingRules = () => {
    // Save to backend
    console.log('Saving room booking rules:', roomBookingRules);
  };

  const handleSaveNEPSettings = () => {
    // Save to backend
    console.log('Saving NEP settings:', nepSettings);
  };

  const handleSaveConflictPriorities = () => {
    // Save to backend
    console.log('Saving conflict priorities:', conflictPriorities);
  };

  const addTimeSlotPattern = () => {
    const newPattern: TimeSlotPattern = {
      id: Date.now().toString(),
      name: '',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      isActive: true,
      priority: 'MEDIUM',
      allowedDays: [1, 2, 3, 4, 5],
      subjectTypes: ['LECTURE']
    };
    setTimeSlotPatterns([...timeSlotPatterns, newPattern]);
  };

  const updateTimeSlotPattern = (id: string, updates: Partial<TimeSlotPattern>) => {
    setTimeSlotPatterns(patterns => 
      patterns.map(pattern => 
        pattern.id === id ? { ...pattern, ...updates } : pattern
      )
    );
  };

  const removeTimeSlotPattern = (id: string) => {
    setTimeSlotPatterns(patterns => patterns.filter(pattern => pattern.id !== id));
  };

  const addRoomBookingRule = () => {
    const newRule: RoomBookingRule = {
      id: Date.now().toString(),
      roomType: 'LECTURE_HALL',
      minBookingDuration: 60,
      maxBookingDuration: 180,
      advanceBookingDays: 7,
      allowConsecutiveBookings: true,
      requireApproval: false,
      specialRequirements: []
    };
    setRoomBookingRules([...roomBookingRules, newRule]);
  };

  const updateRoomBookingRule = (id: string, updates: Partial<RoomBookingRule>) => {
    setRoomBookingRules(rules => 
      rules.map(rule => 
        rule.id === id ? { ...rule, ...updates } : rule
      )
    );
  };

  const removeRoomBookingRule = (id: string) => {
    setRoomBookingRules(rules => rules.filter(rule => rule.id !== id));
  };

  const addConflictPriority = () => {
    const newPriority: ConflictResolutionPriority = {
      id: Date.now().toString(),
      conflictType: 'FACULTY_DOUBLE_BOOKING',
      priority: conflictPriorities.length + 1,
      resolutionStrategy: 'AUTO_RESCHEDULE',
      autoResolve: true,
      requireApproval: false
    };
    setConflictPriorities([...conflictPriorities, newPriority]);
  };

  const updateConflictPriority = (id: string, updates: Partial<ConflictResolutionPriority>) => {
    setConflictPriorities(priorities => 
      priorities.map(priority => 
        priority.id === id ? { ...priority, ...updates } : priority
      )
    );
  };

  const removeConflictPriority = (id: string) => {
    setConflictPriorities(priorities => priorities.filter(priority => priority.id !== id));
  };

  const tabs = [
    { id: 'institutional', label: 'Institutional Preferences', icon: 'settings' },
    { id: 'timeslots', label: 'Time Slot Patterns', icon: 'clock' },
    { id: 'roombooking', label: 'Room Booking Rules', icon: 'home' },
    { id: 'nep', label: 'NEP Compliance', icon: 'book' },
    { id: 'conflicts', label: 'Conflict Resolution', icon: 'alert-triangle' }
  ];

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
                <h1 className="text-3xl font-bold text-gray-900">Constraint Configuration</h1>
                <p className="text-gray-600 mt-1">Configure institutional preferences, time slots, and NEP compliance settings</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Icon name="edit" className="w-4 h-4" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Settings'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon name={tab.icon} className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Institutional Preferences */}
          {activeTab === 'institutional' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Institutional Preferences</h2>
                {isEditing && (
                  <button
                    onClick={handleSaveInstitutionalPrefs}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Hours Per Day</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={institutionalPrefs.maxHoursPerDay}
                      onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, maxHoursPerDay: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.maxHoursPerDay ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-100' : ''}`}
                    />
                    {errors.maxHoursPerDay && <p className="text-red-500 text-xs mt-1">{errors.maxHoursPerDay}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Hours Per Week</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={institutionalPrefs.maxHoursPerWeek}
                      onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, maxHoursPerWeek: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.maxHoursPerWeek ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-100' : ''}`}
                    />
                    {errors.maxHoursPerWeek && <p className="text-red-500 text-xs mt-1">{errors.maxHoursPerWeek}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Break Between Classes (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={institutionalPrefs.minBreakBetweenClasses}
                      onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, minBreakBetweenClasses: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.minBreakBetweenClasses ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-100' : ''}`}
                    />
                    {errors.minBreakBetweenClasses && <p className="text-red-500 text-xs mt-1">{errors.minBreakBetweenClasses}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Consecutive Hours</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={institutionalPrefs.maxConsecutiveHours}
                      onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, maxConsecutiveHours: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.maxConsecutiveHours ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-100' : ''}`}
                    />
                    {errors.maxConsecutiveHours && <p className="text-red-500 text-xs mt-1">{errors.maxConsecutiveHours}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Break Start</label>
                      <input
                        type="time"
                        value={institutionalPrefs.lunchBreakStart}
                        onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, lunchBreakStart: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          !isEditing ? 'bg-gray-100' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Break End</label>
                      <input
                        type="time"
                        value={institutionalPrefs.lunchBreakEnd}
                        onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, lunchBreakEnd: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          !isEditing ? 'bg-gray-100' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={institutionalPrefs.preferMorningSlots}
                        onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, preferMorningSlots: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Prefer Morning Slots</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={institutionalPrefs.avoidBackToBackClasses}
                        onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, avoidBackToBackClasses: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Avoid Back-to-Back Classes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={institutionalPrefs.minimizeGaps}
                        onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, minimizeGaps: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Minimize Gaps Between Classes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={institutionalPrefs.balanceWorkload}
                        onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, balanceWorkload: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Balance Workload Distribution</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={institutionalPrefs.allowWeekendClasses}
                        onChange={(e) => setInstitutionalPrefs({ ...institutionalPrefs, allowWeekendClasses: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow Weekend Classes</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Slot Patterns */}
          {activeTab === 'timeslots' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Time Slot Patterns</h2>
                <button
                  onClick={addTimeSlotPattern}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  <span>Add Pattern</span>
                </button>
              </div>
              <div className="space-y-4">
                {timeSlotPatterns.map(pattern => (
                  <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pattern Name</label>
                        <input
                          type="text"
                          value={pattern.name}
                          onChange={(e) => updateTimeSlotPattern(pattern.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={pattern.startTime}
                          onChange={(e) => updateTimeSlotPattern(pattern.id, { startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          value={pattern.endTime}
                          onChange={(e) => updateTimeSlotPattern(pattern.id, { endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={pattern.priority}
                          onChange={(e) => updateTimeSlotPattern(pattern.id, { priority: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={pattern.isActive}
                            onChange={(e) => updateTimeSlotPattern(pattern.id, { isActive: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                      <button
                        onClick={() => removeTimeSlotPattern(pattern.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={handleSaveTimeSlotPatterns}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Time Slot Patterns
                </button>
              </div>
            </div>
          )}

          {/* Room Booking Rules */}
          {activeTab === 'roombooking' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Room Booking Rules</h2>
                <button
                  onClick={addRoomBookingRule}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  <span>Add Rule</span>
                </button>
              </div>
              <div className="space-y-4">
                {roomBookingRules.map(rule => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                        <select
                          value={rule.roomType}
                          onChange={(e) => updateRoomBookingRule(rule.id, { roomType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {ROOM_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Duration (min)</label>
                        <input
                          type="number"
                          min="15"
                          value={rule.minBookingDuration}
                          onChange={(e) => updateRoomBookingRule(rule.id, { minBookingDuration: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Duration (min)</label>
                        <input
                          type="number"
                          min="15"
                          value={rule.maxBookingDuration}
                          onChange={(e) => updateRoomBookingRule(rule.id, { maxBookingDuration: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={rule.allowConsecutiveBookings}
                            onChange={(e) => updateRoomBookingRule(rule.id, { allowConsecutiveBookings: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Allow Consecutive Bookings</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={rule.requireApproval}
                            onChange={(e) => updateRoomBookingRule(rule.id, { requireApproval: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Require Approval</span>
                        </label>
                      </div>
                      <button
                        onClick={() => removeRoomBookingRule(rule.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={handleSaveRoomBookingRules}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Room Booking Rules
                </button>
              </div>
            </div>
          )}

          {/* NEP Compliance Settings */}
          {activeTab === 'nep' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">NEP Compliance Settings</h2>
                <button
                  onClick={handleSaveNEPSettings}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save NEP Settings
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Credit Distribution</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Core Credits Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nepSettings.coreCreditsPercentage}
                      onChange={(e) => setNepSettings({ ...nepSettings, coreCreditsPercentage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Elective Credits Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nepSettings.electiveCreditsPercentage}
                      onChange={(e) => setNepSettings({ ...nepSettings, electiveCreditsPercentage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skill-based Credits Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nepSettings.skillBasedCreditsPercentage}
                      onChange={(e) => setNepSettings({ ...nepSettings, skillBasedCreditsPercentage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Semester Limits</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Credits Per Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={nepSettings.minCreditsPerSemester}
                      onChange={(e) => setNepSettings({ ...nepSettings, minCreditsPerSemester: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Credits Per Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={nepSettings.maxCreditsPerSemester}
                      onChange={(e) => setNepSettings({ ...nepSettings, maxCreditsPerSemester: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Practical Block Min Hours</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={nepSettings.practicalBlockMinHours}
                      onChange={(e) => setNepSettings({ ...nepSettings, practicalBlockMinHours: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Assessment Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={nepSettings.assessmentPatternCompliance}
                      onChange={(e) => setNepSettings({ ...nepSettings, assessmentPatternCompliance: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enforce Assessment Pattern Compliance</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={nepSettings.attendanceTrackingRequired}
                      onChange={(e) => setNepSettings({ ...nepSettings, attendanceTrackingRequired: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Require Attendance Tracking</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Continuous Assessment Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={nepSettings.continuousAssessmentMinPercentage}
                    onChange={(e) => setNepSettings({ ...nepSettings, continuousAssessmentMinPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conflict Resolution Priorities */}
          {activeTab === 'conflicts' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Conflict Resolution Priorities</h2>
                <button
                  onClick={addConflictPriority}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  <span>Add Priority</span>
                </button>
              </div>
              <div className="space-y-4">
                {conflictPriorities.map(priority => (
                  <div key={priority.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conflict Type</label>
                        <select
                          value={priority.conflictType}
                          onChange={(e) => updateConflictPriority(priority.id, { conflictType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {CONFLICT_TYPES.map(type => (
                            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <input
                          type="number"
                          min="1"
                          value={priority.priority}
                          onChange={(e) => updateConflictPriority(priority.id, { priority: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Strategy</label>
                        <select
                          value={priority.resolutionStrategy}
                          onChange={(e) => updateConflictPriority(priority.id, { resolutionStrategy: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {RESOLUTION_STRATEGIES.map(strategy => (
                            <option key={strategy} value={strategy}>{strategy.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => removeConflictPriority(priority.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={priority.autoResolve}
                          onChange={(e) => updateConflictPriority(priority.id, { autoResolve: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Auto Resolve</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={priority.requireApproval}
                          onChange={(e) => updateConflictPriority(priority.id, { requireApproval: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Require Approval</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={handleSaveConflictPriorities}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Conflict Priorities
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



