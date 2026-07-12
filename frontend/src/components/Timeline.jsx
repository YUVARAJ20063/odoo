import React from 'react';
import { Calendar, User, Cpu, Shield, RefreshCw, Key, CheckCircle } from 'lucide-react';

export const Timeline = ({ logs }) => {
  const getIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('create')) return <Cpu className="w-3.5 h-3.5" />;
    if (act.includes('allocate')) return <CheckCircle className="w-3.5 h-3.5" />;
    if (act.includes('transfer')) return <RefreshCw className="w-3.5 h-3.5" />;
    if (act.includes('return')) return <RefreshCw className="w-3.5 h-3.5" />;
    if (act.includes('login') || act.includes('auth')) return <Key className="w-3.5 h-3.5" />;
    if (act.includes('settings')) return <Shield className="w-3.5 h-3.5" />;
    return <User className="w-3.5 h-3.5" />;
  };

  const getDotColor = (action) => {
    const act = action.toLowerCase();
    if (act.includes('create')) return 'bg-blue-500 ring-blue-100 dark:ring-blue-900/30';
    if (act.includes('allocate')) return 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/30';
    if (act.includes('transfer')) return 'bg-purple-500 ring-purple-100 dark:ring-purple-900/30';
    if (act.includes('return')) return 'bg-amber-500 ring-amber-100 dark:ring-amber-900/30';
    if (act.includes('delete') || act.includes('cancel')) return 'bg-rose-500 ring-rose-100 dark:ring-rose-900/30';
    return 'bg-slate-500 ring-slate-100 dark:ring-slate-900/30';
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
        <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700" />
        No recent activities logged
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, logIdx) => (
          <li key={log._id || logIdx}>
            <div className="relative pb-8">
              {/* Vertical connector line */}
              {logIdx !== logs.length - 1 ? (
                <span 
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" 
                  aria-hidden="true" 
                />
              ) : null}
              
              <div className="relative flex space-x-3">
                {/* Dot with icon */}
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ${getDotColor(log.action)} text-white`}>
                    {getIcon(log.action)}
                  </span>
                </div>
                
                {/* Log Content */}
                <div className="flex-grow min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.user ? log.user.name : 'System'}
                      </span>{' '}
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {log.user ? log.user.role : 'Core'}
                      </span>{' '}
                      {log.details || log.action}
                    </p>
                  </div>
                  <div className="text-right text-[10px] whitespace-nowrap text-slate-400 dark:text-slate-500">
                    <time dateTime={log.timestamp}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block mt-0.5 text-[9px]">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </time>
                  </div>
                </div>

              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
