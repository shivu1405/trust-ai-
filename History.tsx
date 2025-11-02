import React from 'react';
import { HistoryItem, ReportData } from '../types';
import { ShieldCheckIcon, TrashIcon, InformationCircleIcon } from './icons/Icons';

interface HistoryProps {
    history: HistoryItem[];
    onViewReport: (report: ReportData) => void;
    onClearHistory: () => void;
}

const getStatusColor = (status: ReportData['credibility']['status']) => {
    switch (status) {
        case 'Credible':
        case 'Mostly Credible':
            return 'border-green-500';
        case 'Uncertain':
            return 'border-yellow-500';
        case 'Potentially Misleading':
        case 'Not Credible':
            return 'border-red-500';
        default:
            return 'border-slate-500';
    }
};

export const History: React.FC<HistoryProps> = ({ history, onViewReport, onClearHistory }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">Analysis History</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">Review your past analyses.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
              Your history is saved privately on this device and is not shared.
            </p>
        </div>
        {history.length > 0 && (
             <button 
                onClick={onClearHistory}
                className="flex items-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold py-2 px-4 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
                <TrashIcon className="w-5 h-5" />
                Clear History
            </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center bg-white dark:bg-slate-800 p-12 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <ShieldCheckIcon className="mx-auto h-16 w-16 text-slate-400" />
            <h2 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-200">No History Yet</h2>
            <p className="mt-2 text-slate-500">Your completed analyses will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
            {history.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => onViewReport(item.report)}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border dark:border-slate-700 border-l-4 ${getStatusColor(item.report.credibility.status)} flex justify-between items-center cursor-pointer hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all`}
                >
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md md:max-w-lg">{item.inputSummary}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(item.id).toLocaleString()} - Score: {item.report.credibility.score}
                        </p>
                    </div>
                    <span className="text-sm font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                        {item.report.credibility.status}
                    </span>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};