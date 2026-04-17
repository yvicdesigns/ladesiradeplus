import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { motion, AnimatePresence } from 'framer-motion';
import { DebugPermissionsPanel } from '@/components/DebugPermissionsPanel';
import { DeleteDebugPanel } from '@/components/DeleteDebugPanel';
import { PersistentOrderAlertBanner } from '@/components/PersistentOrderAlertBanner';
import { AlertCircle, TerminalSquare, Settings, ShieldAlert, ActivitySquare, SearchCode, DatabaseZap } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePersistentOrderAlert } from '@/hooks/usePersistentOrderAlert';

class SidebarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Sidebar Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full md:w-64 landscape:md:w-20 lg:landscape:w-64 bg-destructive/10 p-4 border-r border-destructive/20 text-destructive h-full flex flex-col gap-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold text-sm">Erreur de la Barre Latérale</h3>
          <p className="text-xs font-mono break-all opacity-80">{this.state.error?.message || "Une erreur inattendue est survenue."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AdminLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const { role } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { pendingOrders, acknowledgeAll } = usePersistentOrderAlert();

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden font-sans text-foreground landscape:flex-row">
      <div className="hidden md:block h-full z-20 bg-card border-r border-border w-20 lg:w-64 landscape:w-20 lg:landscape:w-64 flex-shrink-0 transition-all duration-300">
        <SidebarErrorBoundary>
          <AdminSidebar />
        </SidebarErrorBoundary>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-muted/20">
        <AdminTopbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <PersistentOrderAlertBanner
          pendingOrders={pendingOrders}
          onAcknowledgeAll={acknowledgeAll}
        />
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
              />
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm md:hidden bg-card border-r border-border landscape:w-64"
              >
                <SidebarErrorBoundary>
                  <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
                </SidebarErrorBoundary>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main key={currentLanguage} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 landscape:p-3 landscape:md:p-4 scroll-smooth relative w-full">
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto w-full space-y-4 md:space-y-6 landscape:space-y-3"
          >
            {role === 'admin' && (
              <div className="flex justify-end mb-2 relative z-10 landscape:mb-1 gap-2 flex-wrap bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDebugPanelOpen(!debugPanelOpen)}
                  className="bg-card text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 gap-2 landscape:h-8"
                >
                  <TerminalSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Journaux</span>
                  <span className="sm:hidden">Logs</span>
                </Button>
              </div>
            )}
            
            {role === 'admin' && <DebugPermissionsPanel />}
            
            {children}
          </motion.div>
        </main>
      </div>
      
      <DeleteDebugPanel isOpen={debugPanelOpen} onClose={() => setDebugPanelOpen(false)} />
    </div>
  );
};