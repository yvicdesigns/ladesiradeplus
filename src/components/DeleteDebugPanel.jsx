import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Trash2, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deletionLogger } from '@/lib/deletionLogger';

export const DeleteDebugPanel = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    setLogs(deletionLogger.getLogs());
    
    // Subscribe to updates
    const unsubscribe = deletionLogger.subscribe((newLogs) => {
      setLogs([...newLogs]); // trigger re-render
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.type}] ${l.message}\n${l.data ? JSON.stringify(l.data, null, 2) : ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    deletionLogger.clearLogs();
  };

  const getLogColor = (type) => {
    switch(type) {
      case 'ERROR': return 'text-red-500 bg-red-500/10';
      case 'WARN': return 'text-yellow-500 bg-yellow-500/10';
      case 'SUCCESS': return 'text-amber-500 bg-amber-500/10';
      case 'QUERY': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className={`fixed bottom-4 right-4 z-[9999] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col text-gray-100 font-mono text-xs w-[450px] transition-all duration-300 ${isMinimized ? 'h-[48px]' : 'h-[500px]'}`}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-black/40 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center gap-2 font-bold">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Logs de Suppression ({logs.length})</span>
          </div>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
               {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-400/20" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth flex flex-col-reverse">
              <div ref={endOfMessagesRef} />
              {logs.map(log => (
                <div key={log.id} className="pb-3 border-b border-gray-800/50">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <span className="text-gray-500 text-[10px] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold ${getLogColor(log.type)}`}>
                      {log.type}
                    </span>
                  </div>
                  <div className="text-gray-200 break-words leading-relaxed">{log.message}</div>
                  {log.data && (
                    <pre className="mt-2 p-2 bg-black/40 rounded border border-gray-800 overflow-x-auto text-[10px] text-gray-400">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-500 py-10 italic">Aucun log enregistré. Effectuez une suppression pour voir les détails.</div>
              )}
            </div>

            <div className="p-3 border-t border-gray-700 bg-black/40 flex justify-between gap-2">
              <Button variant="outline" size="sm" onClick={handleClear} className="h-8 bg-transparent border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800">
                <Trash2 className="w-3 h-3 mr-2" /> Effacer
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 bg-blue-600/20 border-blue-500/50 text-blue-300 hover:text-white hover:bg-blue-600/40">
                <Copy className="w-3 h-3 mr-2" /> Copier tout
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};