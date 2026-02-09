import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { WordData } from '../../types';
import { SearchIcon, TrashIcon, EyeIcon } from '../Icons';

const StatCard = ({ title, value, sub, color }: any) => (
  <div className="bg-[#1A1A1E] border border-white/5 p-4 rounded-xl">
    <div className="text-slate-400 text-sm font-medium mb-1">{title}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
    {sub && <div className={`text-xs mt-2 ${color}`}>{sub}</div>}
  </div>
);

interface DashboardProps {
  onViewWord?: (word: WordData) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewWord }) => {
  const [search, setSearch] = useState('');
  
  const words = useLiveQuery(
    () => db.words.toArray()
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this word?')) {
      await db.words.delete(id);
    }
  };

  if (!words) return <div className="p-8 text-center text-slate-500">Loading database...</div>;

  const filtered = words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()));
  
  const total = words.length;
  const mastered = words.filter(w => (w.mastery || 0) > 80).length;
  const due = words.filter(w => {
    if (w.fsrs) return w.fsrs.due <= Date.now();
    if (w.srs) return w.srs.nextReview <= Date.now();
    return true;
  }).length;

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Data Manager</h1>
        <div className="flex gap-2">
           {/* Actions like Export/Import could go here */}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Words" value={total} sub="In your database" color="text-slate-400" />
        <StatCard title="Mastered" value={mastered} sub={`${total ? ((mastered/total)*100).toFixed(1) : 0}% Completion`} color="text-green-400" />
        <StatCard title="Due for Review" value={due} sub="Requires attention" color="text-orange-400" />
      </div>

      {/* Data Table Container */}
      <div className="bg-[#0F0F13] border border-white/10 rounded-xl overflow-hidden ring-1 ring-white/5">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-[#141418]">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter words..."
              className="w-full bg-[#1A1A1E] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {filtered.length} records
          </div>
          <div className="hidden md:block text-xs text-slate-500 italic">
            💡 Click any row to view details
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1A1A1E] text-slate-400 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3 border-b border-white/5">Word</th>
                <th className="px-6 py-3 border-b border-white/5">Definition</th>
                <th className="px-6 py-3 border-b border-white/5">Mastery</th>
                <th className="px-6 py-3 border-b border-white/5">Next Review</th>
                <th className="px-6 py-3 border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((word) => (
                <tr 
                  key={word.id || word.word} 
                  className="hover:bg-orange-500/5 transition-colors group cursor-pointer hover:border-l-2 hover:border-orange-500"
                  onClick={() => onViewWord && onViewWord(word)}
                  title="Click to view full details"
                >
                  <td className="px-6 py-3 font-medium text-white">
                    {word.word}
                    <div className="text-xs text-slate-500 font-normal">{word.partOfSpeech}</div>
                  </td>
                  <td className="px-6 py-3 text-slate-300 max-w-xs truncate" title={word.simpleDefinition}>
                    {word.simpleDefinition}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${word.mastery && word.mastery > 80 ? 'bg-green-500' : 'bg-orange-500'}`} 
                          style={{ width: `${word.mastery || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-400">{Math.round(word.mastery || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-400 font-mono text-xs">
                    {word.fsrs
                      ? new Date(word.fsrs.due).toLocaleDateString()
                      : word.srs
                        ? new Date(word.srs.nextReview).toLocaleDateString()
                        : '-'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewWord && onViewWord(word);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-orange-400"
                        title="View Word"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          word.id && handleDelete(word.id);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-red-400"
                        title="Delete Word"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No words found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
