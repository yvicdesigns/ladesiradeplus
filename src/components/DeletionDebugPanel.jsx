import React, { useState, useEffect } from 'react';
import { deletionDebugLogger } from '@/lib/DeletionDebugLogger';
import { Terminal, X, Minimize2, Maximize2, Trash2, Download, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export const DeletionDebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initial load
    setLogs(deletionDebugLogger.getLogs());

    // Subscribe to updates
    const unsubscribe = deletionDebugLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = () => {
    const logText = logs.map(l => `[${l.timestamp}] [${l.functionName}] ${l.message}\n${l.data ? JSON.stringify(l.data, null, 2) : ''}`).join('\n\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    deletionDebugLogger.clearLogs();
  };

  const handleExport = () => {
    deletionDebugLogger.exportLogs();
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-slate-900 text-green-400 hover:bg-slate-800"
        size="icon"
        title="Open Deletion Debugger"
      >
        <Terminal className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed z-50 bg-slate-950 text-slate-300 border border-slate-800 shadow-2xl rounded-tl-xl rounded-tr-xl sm:rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
          isMinimized 
            ? 'bottom-0 right-4 w-72 h-12 rounded-b-none' 
            : 'bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-[500px] h-[50vh] sm:max-h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center gap-2 font-mono text-sm text-green-400">
            <Terminal className="h-4 w-4" />
            <span>Deletion Debugger</span>
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
              {logs.length} logs
            </span>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-red-500/20" onClick={() => setIsOpen(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-slate-900/50 border-b border-slate-800">
              <Button variant="outline" size="sm" onClick={handleClear} className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300">
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300">
                <Copy className="h-3 w-3 mr-1" /> {copied ? 'Copied!' : 'Copy All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 ml-auto">
                <Download className="h-3 w-3 mr-1" /> Export JSON
              </Button>
            </div>

            {/* Log List */}
            <ScrollArea className="flex-1 p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-2 mt-20">
                  <Terminal className="h-8 w-8" />
                  <p>Listening for deletion events...</p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {/* Show only last 10 logs visually in the panel to keep it clean, though memory has 50 */}
                  {logs.slice(0, 10).map((log) => {
                    const isError = log.message.toLowerCase().includes('error');
                    const isSuccess = log.message.toLowerCase().includes('success');
                    
                    return (
                      <div key={log.id} className="border-l-2 pl-3 py-1 border-slate-700 hover:bg-slate-800/30 transition-colors">
                        <div className="flex justify-between items-start mb-1 opacity-70">
                          <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="text-[10px] text-blue-400">fn: {log.functionName}</span>
                        </div>
                        <div className={`flex items-start gap-2 ${isError ? 'text-red-400' : isSuccess ? 'text-green-400' : 'text-slate-300'}`}>
                          {isError && <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />}
                          <span className="break-words">{log.message}</span>
                        </div>
                        {log.data && (
                          <pre className="mt-2 p-2 bg-slate-900/80 rounded text-[10px] overflow-x-auto text-slate-400 border border-slate-800/50">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                  {logs.length > 10 && (
                    <div className="text-center text-slate-600 pt-2 text-[10px]">
                      + {logs.length - 10} older logs (export to view all)
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};