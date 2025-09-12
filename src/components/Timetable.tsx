import React from 'react';
import { TimetableData, TimetableSlot } from '../types';

interface TimetableProps {
  data: TimetableData | null;
  editable?: boolean;
  onChange?: (day: string, slot: string, value: TimetableSlot) => void;
}

export const Timetable: React.FC<TimetableProps> = ({ data, editable = false, onChange }) => {
  // Always show the structure, even if no data
  const showEmptyState = !data;

  // Define the exact time slots from the image
  const timeSlots = [
    '9:30 am-10:20 am',
    '10:20 am-11:10 am', 
    '11:10 am-12:00 pm',
    '12:00 pm-12:50 pm',
    '12:50 pm-2:20 pm',
    '2:20 pm-3:10 pm',
    '3:10 pm-4:00 pm',
    '4:00 pm-4:50 pm'
  ];

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Helpers to make rendering resilient to capitalization/spacing differences
  const findMatchingKey = (target: string, candidates: string[] | undefined) => {
    if (!candidates || candidates.length === 0) return undefined;
    const lower = target.toLowerCase();
    return candidates.find(k => k.toLowerCase() === lower);
  };

  const normalizeTime = (t: string) => {
    // Extract h:mm and am/pm, tolerate spaces and leading zeros
    const m = t.trim().toLowerCase().replace(/[\u2012-\u2015]/g, '-').replace(/\s+/g, ' ')
      .match(/^(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)$/i);
    if (!m) return t.trim().toLowerCase().replace(/\s+/g, ' ');
    const hour = String(parseInt(m[1], 10));
    const minutes = m[2];
    const meridiem = m[3].toLowerCase();
    return `${hour}:${minutes} ${meridiem}`;
  };

  const normalizeSlot = (s: string) => {
    const cleaned = s.trim().toLowerCase().replace(/[\u2012-\u2015]/g, '-').replace(/\s*-\s*/g, '-');
    const parts = cleaned.split('-');
    if (parts.length !== 2) return s.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${normalizeTime(parts[0])}-${normalizeTime(parts[1])}`;
  };

  const findMatchingTimeKey = (targetSlot: string, candidates: string[] | undefined) => {
    if (!candidates || candidates.length === 0) return undefined;
    const normTarget = normalizeSlot(targetSlot);
    return candidates.find(k => normalizeSlot(k) === normTarget);
  };

  return (
    <div className="overflow-auto bg-white">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">RAJKIYA ENGINEERING COLLEGE, SONBHARDRA</h1>
        <h2 className="text-base font-semibold">COMPUTER SCIENCE AND ENGINEERING</h2>
        <h3 className="text-sm">TIME TABLE, ODD SEM, 2025-26</h3>
        <p className="text-sm">4th Year(VII Sem.)</p>
      </div>

      <table className="w-full border-2 border-black text-xs table-fixed">
        <thead>
          <tr>
            <th className="border-2 border-black px-1 py-1 text-center bg-gray-100 font-bold w-20">Day</th>
            {timeSlots.map((slot, index) => (
              <th key={slot} className="border-2 border-black px-1 py-1 text-center bg-gray-100 font-bold w-24">
                {index === 4 ? (
                  <div className="transform -rotate-90 whitespace-nowrap text-xs">LUNCH</div>
                ) : (
                  <div className="text-xs">{slot}</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td className="border-2 border-black px-1 py-1 text-center font-semibold bg-gray-50 w-20">{day}</td>
              {timeSlots.map(slot => {
                // Resolve actual keys from incoming data resiliently
                const resolvedDayKey = showEmptyState ? undefined : findMatchingKey(day, data ? Object.keys(data) : undefined);
                const dayData = resolvedDayKey && data ? data[resolvedDayKey] : undefined;
                const resolvedSlotKey = dayData ? findMatchingTimeKey(slot, Object.keys(dayData)) : undefined;
                const slotData = resolvedSlotKey && dayData ? dayData[resolvedSlotKey] : undefined;
                return (
                  <td key={`${day}-${slot}`} className="border-2 border-black px-1 py-1 align-top w-24" data-day={day} data-slot={slot}>
                    {editable ? (
                      <div className="space-y-1">
                        <input
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]"
                          placeholder="Course"
                          value={slotData?.courseName || ''}
                          onChange={(e) => onChange && onChange(day, slot, {
                            courseName: e.target.value,
                            facultyName: slotData?.facultyName || '',
                            room: slotData?.room || ''
                          })}
                        />
                        <input
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]"
                          placeholder="Faculty"
                          value={slotData?.facultyName || ''}
                          onChange={(e) => onChange && onChange(day, slot, {
                            courseName: slotData?.courseName || '',
                            facultyName: e.target.value,
                            room: slotData?.room || ''
                          })}
                        />
                        <input
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]"
                          placeholder="Room"
                          value={slotData?.room || ''}
                          onChange={(e) => onChange && onChange(day, slot, {
                            courseName: slotData?.courseName || '',
                            facultyName: slotData?.facultyName || '',
                            room: e.target.value
                          })}
                        />
                      </div>
                    ) : (
                      slotData ? (
                        <div className="text-center">
                          <div className="font-semibold text-xs truncate">{slotData.courseName}</div>
                          <div className="text-xs text-gray-600 truncate">({slotData.facultyName})</div>
                          <div className="text-xs text-gray-500 truncate">{slotData.room}</div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dynamic Subject Details - Will be populated by AI */}
      {data && (
        <div className="mt-6 text-xs">
          <div className="mb-4">
            <h4 className="font-bold mb-2">Legend:</h4>
            <p>L: Lecture, P: Practical</p>
            <p>Generated dynamically based on organization data</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Theory Subjects - Dynamic */}
            <div>
              <h4 className="font-bold mb-2">THEORY SUBJECT</h4>
              <table className="w-full border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-1 py-1">SUBJECT CODE</th>
                    <th className="border border-black px-1 py-1">L</th>
                    <th className="border border-black px-1 py-1">T</th>
                    <th className="border border-black px-1 py-1">P</th>
                    <th className="border border-black px-1 py-1">THEORY SUBJECT</th>
                    <th className="border border-black px-1 py-1">FACULTY NAME</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="border border-black px-1 py-1 text-center text-gray-500">
                      Theory subjects will be generated by AI based on organization data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Practical Subjects - Dynamic */}
            <div>
              <h4 className="font-bold mb-2">PRACTICAL</h4>
              <table className="w-full border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-1 py-1">SUBJECT CODE</th>
                    <th className="border border-black px-1 py-1">L</th>
                    <th className="border border-black px-1 py-1">T</th>
                    <th className="border border-black px-1 py-1">P</th>
                    <th className="border border-black px-1 py-1">PRACTICAL</th>
                    <th className="border border-black px-1 py-1">FACULTY NAME</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="border border-black px-1 py-1 text-center text-gray-500">
                      Practical subjects will be generated by AI based on organization data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-xs">
            <p><strong>Note:</strong> Subject details and faculty assignments will be generated dynamically</p>
          </div>

          {/* Signatures - Dynamic */}
          <div className="flex justify-between mt-6 text-xs">
            <div>
              <p>Departmental Time table co-ordinator</p>
            </div>
            <div className="text-right">
              <p>H.O.D</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 