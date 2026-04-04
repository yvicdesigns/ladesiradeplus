import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export const TestSummaryCard = ({ stats }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-lg font-bold text-gray-900">Résumé des Tests</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        
        {/* Main Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-3xl font-black text-gray-900">{stats.successRate}%</span>
              <span className="text-sm font-medium text-gray-500 ml-2">Taux de succès</span>
            </div>
            <div className="text-right text-sm font-medium text-gray-500">
              <span className="text-gray-900 font-bold">{stats.completed}</span> / {stats.total} complétés
            </div>
          </div>
          <Progress value={stats.totalProgress} className="h-3 bg-gray-100" />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-amber-50 border border-green-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-6 h-6 text-amber-500 mb-1" />
            <span className="text-2xl font-bold text-amber-700">{stats.passed}</span>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Succès</span>
          </div>
          
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <XCircle className="w-6 h-6 text-red-500 mb-1" />
            <span className="text-2xl font-bold text-red-700">{stats.failed}</span>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Échecs</span>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mb-1" />
            <span className="text-2xl font-bold text-yellow-700">{stats.warnings}</span>
            <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Alertes</span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <HelpCircle className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-2xl font-bold text-gray-700">{stats.notRun}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">À Faire</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};