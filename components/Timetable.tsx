import React from 'react';
// FIX: Correct import path for types
import { TimetableData } from './../types';

interface TimetableProps {
  data: TimetableData | null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

export const Timetable: React.FC<TimetableProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full border-2 border-dashed border-black rounded-lg bg-white text-black">
        Generate a timetable to see it here.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-black overflow-auto h-full">
      <table className="min-w-full divide-y divide-black">
        <thead className="bg-white">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider sticky left-0 bg-white z-10">Time</th>
            {DAYS.map(day => (
              <th key={day} className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-black">
          {TIME_SLOTS.map(time => (
            <tr key={time}>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-black sticky left-0 bg-white z-10">{time}</td>
              {DAYS.map(day => {
                const slot = data[day]?.[time];
                return (
                  <td key={`${day}-${time}`} className="px-4 py-4 whitespace-nowrap text-sm">
                    {slot ? (
                      <div className="p-2 rounded-md bg-white border border-black">
                        <p className="font-bold text-black">{slot.courseName}</p>
                        <p className="text-black">{slot.facultyName}</p>
                        <p className="text-xs text-black/80 italic">{slot.room}</p>
                      </div>
                    ) : (
                      <div className="text-black/50">-</div>
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