import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { GeneratedTimetable, ScheduleSlot, ConflictDetail } from '../types/nep-interfaces';

interface TimetableVisualizationProps {
  timetable: GeneratedTimetable;
  onClose: () => void;
  isEditable?: boolean;
  onSlotClick?: (slot: ScheduleSlot) => void;
  onSlotEdit?: (slot: ScheduleSlot) => void;
}

interface HoverDetails {
  slot: ScheduleSlot;
  x: number;
  y: number;
}

const TimetableVisualization: React.FC<TimetableVisualizationProps> = ({
  timetable,
  onClose,
  isEditable = false,
  onSlotClick,
  onSlotEdit
}) => {
  const [hoverDetails, setHoverDetails] = useState<HoverDetails | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [showConflicts, setShowConflicts] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const timetableRef = useRef<HTMLDivElement>(null);

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

  // Filter slots based on selected filters
  const filteredSlots = timetable.slots.filter(slot => {
    if (filterDay !== 'all' && slot.dayOfWeek !== days.indexOf(filterDay)) return false;
    if (filterTime !== 'all' && slot.timeSlot !== filterTime) return false;
    return true;
  });

  const getSlotColor = (slot: ScheduleSlot) => {
    if (slot.hasConflicts && showConflicts) return 'bg-red-100 border-red-300 text-red-800';
    if (slot.isOnline) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (slot.isAssessmentSlot) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-green-100 border-green-300 text-green-800';
  };

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSlotHover = (slot: ScheduleSlot, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverDetails({
      slot,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleSlotLeave = () => {
    setHoverDetails(null);
  };

  const handleSlotClick = (slot: ScheduleSlot) => {
    setSelectedSlot(slot);
    if (onSlotClick) onSlotClick(slot);
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const handleExportCalendar = () => {
    // Generate ICS file content
    const icsContent = generateICSContent(timetable.slots);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${timetable.name.replace(/\s+/g, '_')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateICSContent = (slots: ScheduleSlot[]) => {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Timetable Generator//EN\n';
    
    slots.forEach(slot => {
      const startDate = new Date();
      startDate.setHours(parseInt(slot.startTime.split(':')[0]), parseInt(slot.startTime.split(':')[1]));
      const endDate = new Date();
      endDate.setHours(parseInt(slot.endTime.split(':')[0]), parseInt(slot.endTime.split(':')[1]));
      
      ics += `BEGIN:VEVENT\n`;
      ics += `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ics += `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ics += `SUMMARY:${slot.subject.name}\n`;
      ics += `DESCRIPTION:${slot.subject.name} - ${slot.faculty.name} - ${slot.room.name}\n`;
      ics += `LOCATION:${slot.room.name}\n`;
      ics += `END:VEVENT\n`;
    });
    
    ics += 'END:VCALENDAR';
    return ics;
  };

  const renderGridView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left min-w-[120px]">Time</th>
            {days.map(day => (
              <th key={day} className="border border-gray-300 p-2 text-center min-w-[150px]">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="border border-gray-300 p-2 font-medium bg-gray-50">{timeSlot}</td>
              {days.map(day => {
                const slot = timetable.slots.find(s => 
                  s.dayOfWeek === days.indexOf(day) && s.timeSlot === timeSlot
                );
                return (
                  <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-1 text-center">
                    {slot ? (
                      <div
                        className={`p-2 rounded text-sm cursor-pointer transition-all hover:shadow-md ${getSlotColor(slot)}`}
                        onMouseEnter={(e) => handleSlotHover(slot, e)}
                        onMouseLeave={handleSlotLeave}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <div className="font-medium truncate">{slot.subject.code}</div>
                        <div className="text-xs opacity-75 truncate">{slot.faculty.name}</div>
                        <div className="text-xs opacity-75 truncate">{slot.room.name}</div>
                        {slot.hasConflicts && showConflicts && (
                          <div className="text-xs text-red-600 font-medium">⚠ Conflict</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm py-2">-</div>
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

  const renderListView = () => (
    <div className="space-y-4">
      {filteredSlots.map(slot => (
        <div
          key={slot.id}
          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getSlotColor(slot)}`}
          onMouseEnter={(e) => handleSlotHover(slot, e)}
          onMouseLeave={handleSlotLeave}
          onClick={() => handleSlotClick(slot)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-lg">{slot.subject.name}</div>
              <div className="text-sm opacity-75">{slot.subject.code}</div>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span>👨‍🏫 {slot.faculty.name}</span>
                <span>🏢 {slot.room.name}</span>
                <span>⏰ {slot.startTime} - {slot.endTime}</span>
                <span>📅 {days[slot.dayOfWeek]}</span>
              </div>
              {slot.hasConflicts && showConflicts && (
                <div className="mt-2 text-sm text-red-600 font-medium">⚠ Has conflicts</div>
              )}
            </div>
            {isEditable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSlotEdit) onSlotEdit(slot);
                }}
                className="ml-4 p-2 text-gray-600 hover:text-gray-800"
              >
                <Icon name="edit" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCalendarView = () => (
    <div className="grid grid-cols-7 gap-1">
      {days.map(day => (
        <div key={day} className="border border-gray-300 rounded-lg p-2">
          <div className="font-medium text-center mb-2">{day}</div>
          <div className="space-y-1">
            {timetable.slots
              .filter(slot => slot.dayOfWeek === days.indexOf(day))
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(slot => (
                <div
                  key={slot.id}
                  className={`p-2 rounded text-xs cursor-pointer ${getSlotColor(slot)}`}
                  onMouseEnter={(e) => handleSlotHover(slot, e)}
                  onMouseLeave={handleSlotLeave}
                  onClick={() => handleSlotClick(slot)}
                >
                  <div className="font-medium truncate">{slot.subject.code}</div>
                  <div className="opacity-75 truncate">{slot.startTime}</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {days.map(day => (
        <div key={day} className="border border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">{day}</h3>
          <div className="space-y-2">
            {timetable.slots
              .filter(slot => slot.dayOfWeek === days.indexOf(day))
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(slot => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-lg border cursor-pointer ${getSlotColor(slot)}`}
                  onMouseEnter={(e) => handleSlotHover(slot, e)}
                  onMouseLeave={handleSlotLeave}
                  onClick={() => handleSlotClick(slot)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{slot.subject.name}</div>
                      <div className="text-sm opacity-75">{slot.subject.code}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {slot.startTime} - {slot.endTime} • {slot.faculty.name} • {slot.room.name}
                      </div>
                    </div>
                    {slot.hasConflicts && showConflicts && (
                      <div className="text-red-600 text-sm">⚠</div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${isPrintMode ? 'print-mode' : ''}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{timetable.name}</h2>
            <p className="text-sm text-gray-600">
              {timetable.department?.name} • Year {timetable.year} • {timetable.slots.length} classes
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Icon name="print" className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportCalendar}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Icon name="calendar" className="w-4 h-4" />
              <span>Export Calendar</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between mb-6 space-y-2">
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { id: 'grid', label: 'Grid', icon: 'grid' },
                  { id: 'list', label: 'List', icon: 'list' },
                  { id: 'calendar', label: 'Calendar', icon: 'calendar' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon name={mode.icon as any} className="w-4 h-4" />
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* Filters */}
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Days</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>

              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Times</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showConflicts}
                  onChange={(e) => setShowConflicts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Conflicts</span>
              </label>
            </div>
          </div>

          {/* Timetable Content */}
          <div ref={timetableRef} className="bg-white">
            {isMobileView ? (
              renderMobileView()
            ) : viewMode === 'grid' ? (
              renderGridView()
            ) : viewMode === 'list' ? (
              renderListView()
            ) : (
              renderCalendarView()
            )}
          </div>

          {/* Hover Details Tooltip */}
          {hoverDetails && (
            <div
              className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs"
              style={{
                left: hoverDetails.x,
                top: hoverDetails.y,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="font-medium">{hoverDetails.slot.subject.name}</div>
              <div className="text-sm opacity-75">{hoverDetails.slot.subject.code}</div>
              <div className="text-sm opacity-75">{hoverDetails.slot.faculty.name}</div>
              <div className="text-sm opacity-75">{hoverDetails.slot.room.name}</div>
              <div className="text-sm opacity-75">
                {hoverDetails.slot.startTime} - {hoverDetails.slot.endTime}
              </div>
              {hoverDetails.slot.hasConflicts && (
                <div className="text-sm text-red-300 mt-1">⚠ Has conflicts</div>
              )}
            </div>
          )}

          {/* Selected Slot Details Modal */}
          {selectedSlot && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">Class Details</h3>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="close" className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">{selectedSlot.subject.name}</div>
                    <div className="text-sm text-gray-600">{selectedSlot.subject.code}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Faculty</div>
                      <div className="font-medium">{selectedSlot.faculty.name}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Room</div>
                      <div className="font-medium">{selectedSlot.room.name}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Time</div>
                      <div className="font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Day</div>
                      <div className="font-medium">{days[selectedSlot.dayOfWeek]}</div>
                    </div>
                  </div>

                  {selectedSlot.hasConflicts && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="font-medium text-red-800 mb-2">Conflicts</div>
                      <div className="space-y-1">
                        {selectedSlot.conflictDetails.map((conflict, index) => (
                          <div key={index} className="text-sm text-red-700">
                            • {conflict.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isEditable && (
                    <div className="flex space-x-2 pt-4">
                      <button
                        onClick={() => {
                          if (onSlotEdit) onSlotEdit(selectedSlot);
                          setSelectedSlot(null);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setSelectedSlot(null)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableVisualization;
