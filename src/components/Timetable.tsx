import React from 'react';
import { TimetableData } from '../types';

interface TimetableProps {
  data: TimetableData | null;
}

export const Timetable: React.FC<TimetableProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="border border-black rounded-md p-4 text-black/60">No timetable available</div>
    );
  }

  const days = Object.keys(data);
  const timeSlots = Array.from(new Set(days.flatMap(d => Object.keys(data[d] || {})))).sort();

  return (
    <div className="overflow-auto">
      <table className="min-w-full border border-black">
        <thead>
          <tr>
            <th className="border border-black px-3 py-2 text-left">Time</th>
            {days.map(day => (
              <th key={day} className="border border-black px-3 py-2 text-left">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(slot => (
            <tr key={slot}>
              <td className="border border-black px-3 py-2">{slot}</td>
              {days.map(day => {
                const slotData = data[day]?.[slot];
                return (
                  <td key={`${day}-${slot}`} className="border border-black px-3 py-2 align-top">
                    {slotData ? (
                      <div>
                        <div className="font-semibold">{slotData.courseName}</div>
                        <div className="text-sm text-black/70">{slotData.facultyName}</div>
                        <div className="text-sm text-black/70">Room: {slotData.room}</div>
                      </div>
                    ) : (
                      <span className="text-black/40">—</span>
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