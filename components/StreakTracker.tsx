import React from 'react';
import { UserStreak } from '../types';

interface StreakTrackerProps {
  streak: UserStreak;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ streak }) => {
  // Generate last 28 days for calendar view
  const getLast28Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const days = getLast28Days();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-[#0F0F13] border border-white/10 rounded-xl p-6 ring-1 ring-white/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Study Streak</h3>
          <p className="text-sm text-slate-400">Keep your momentum going!</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-500">🔥 {streak.currentStreak}</div>
          <div className="text-xs text-slate-500 mt-1">
            Best: {streak.longestStreak} days
          </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 text-xs text-slate-500 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center font-medium">{day[0]}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = streak.calendar[dateStr] || false;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <div
                key={idx}
                className={`
                  aspect-square rounded-md transition-all
                  ${isCompleted 
                    ? 'bg-green-500/20 border border-green-500/40' 
                    : 'bg-slate-800/50 border border-slate-700/50'
                  }
                  ${isToday ? 'ring-2 ring-orange-500/50' : ''}
                `}
                title={`${dateStr}${isCompleted ? ' ✓' : ''}`}
              >
                <div className={`w-full h-full flex items-center justify-center text-xs ${isCompleted ? 'text-green-400' : 'text-slate-600'}`}>
                  {isCompleted && '✓'}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-white/5">
          <span>Total study days: {streak.totalStudyDays}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-800/50 border border-slate-700/50"></div>
              <span>Not studied</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;
