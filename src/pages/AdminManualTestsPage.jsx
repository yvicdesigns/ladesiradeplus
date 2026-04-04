import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ClipboardCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManualTests } from '@/hooks/useManualTests';
import { TestSummaryCard } from '@/components/TestSummaryCard';
import { ExportReportButton } from '@/components/ExportReportButton';
import { TestCasesList } from '@/components/TestCasesList';
import { TestDetailModal } from '@/components/TestDetailModal';
import { AdminLayout } from '@/components/AdminLayout';

export const AdminManualTestsPage = () => {
  const { results, tests, saveTestResult, clearAllResults, getTestResult, calculateStats } = useManualTests();
  const [selectedTest, setSelectedTest] = useState(null);
  const stats = calculateStats();

  const handleRunTest = (test) => {
    setSelectedTest(test);
  };

  const handleSaveResult = (testId, status, notes) => {
    saveTestResult(testId, status, notes);
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Tests Manuels QA - Admin</title>
      </Helmet>

      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              Grille de Tests Manuels QA
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Framework de validation qualité. Exécutez les scénarios pour vérifier la robustesse de l'application.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
             <Button variant="outline" onClick={clearAllResults} className="gap-2 text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none">
                <Trash2 className="w-4 h-4" /> Réinitialiser
             </Button>
             <ExportReportButton results={results} stats={stats} />
          </div>
        </div>

        {/* Summary Card */}
        <TestSummaryCard stats={stats} />

        {/* Main List */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6">
           <TestCasesList 
             tests={tests} 
             results={results} 
             onRunTest={handleRunTest} 
           />
        </div>
      </div>

      {/* Execution Modal */}
      <TestDetailModal 
        isOpen={!!selectedTest}
        test={selectedTest}
        initialResult={selectedTest ? getTestResult(selectedTest.id) : null}
        onClose={() => setSelectedTest(null)}
        onSave={handleSaveResult}
      />
    </AdminLayout>
  );
};

export default AdminManualTestsPage;