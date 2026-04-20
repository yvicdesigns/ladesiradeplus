import React, { Component } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, Activity, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { testSupabaseConnection } from '@/lib/supabaseConnectionDiagnostics';
import { generateDiagnosticReport } from '@/lib/diagnosticReport';

class SupabaseErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
      showDetails: false,
      isChecking: false,
      diagnosticResult: null,
      reportReady: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SupabaseErrorBoundary caught an error:', error, errorInfo);
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1
    }));
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, diagnosticResult: null, reportReady: null });
  };

  handleCheckConnection = async () => {
    this.setState({ isChecking: true, diagnosticResult: null });
    
    if (!navigator.onLine) {
        this.setState({
            isChecking: false,
            diagnosticResult: 'Le navigateur est hors ligne. Vérifiez votre connexion Internet.'
        });
        return;
    }

    try {
        const test = await testSupabaseConnection();
        this.setState({ 
          isChecking: false, 
          diagnosticResult: test.success 
            ? 'Connexion réussie ! Tout semble fonctionner.' 
            : `Échec : ${test.errors.join(' | ')}`
        });
    } catch (e) {
        this.setState({ isChecking: false, diagnosticResult: `Erreur inattendue : ${e.message}` });
    }
  };

  handleDownloadDiagnostic = async () => {
    try {
      const report = await generateDiagnosticReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ladesiradeplus_diagnostic_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erreur lors de la génération du rapport: " + e.message);
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const isCritical = this.state.errorCount >= 3;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Alert variant="destructive" className="max-w-2xl w-full bg-white shadow-lg border-red-200">
            <Database className="h-6 w-6 text-red-600 mt-1" />
            <AlertTitle className="text-red-800 font-bold ml-2 text-lg">
              Une erreur inattendue s'est produite
            </AlertTitle>
            <AlertDescription className="ml-2 mt-3 flex flex-col gap-4">
              <p className="text-gray-700">
                {isCritical
                  ? "Des erreurs répétées ont été détectées. Veuillez contacter le support technique."
                  : "L'application a rencontré un problème. Appuyez sur Réessayer pour continuer."}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button onClick={this.handleRetry} className="bg-red-600 hover:bg-red-700 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
                </Button>
                <Button onClick={this.handleCheckConnection} variant="outline" disabled={this.state.isChecking} className="text-gray-700">
                  {this.state.isChecking ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                  Tester la connexion
                </Button>
                <Button onClick={this.handleDownloadDiagnostic} variant="secondary" className="bg-gray-100">
                  <Download className="h-4 w-4 mr-2" /> Rapport
                </Button>
              </div>

              {this.state.diagnosticResult && (
                <div className={`p-3 rounded-md text-sm font-medium ${this.state.diagnosticResult.includes('réussie') ? 'bg-amber-100 text-amber-800' : 'bg-amber-100 text-amber-800'}`}>
                  Diagnostic: {this.state.diagnosticResult}
                </div>
              )}

              <div className="mt-2 border-t pt-3">
                <button 
                  onClick={this.toggleDetails}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {this.state.showDetails ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  {this.state.showDetails ? 'Masquer les détails' : 'Afficher les détails techniques'}
                </button>
                
                {this.state.showDetails && (
                  <pre className="mt-3 bg-gray-100 p-3 rounded text-xs text-red-900 overflow-x-auto whitespace-pre-wrap">
                    {this.state.error?.toString()}
                    {'\n\nStack:\n'}{this.state.error?.stack}
                  </pre>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SupabaseErrorBoundary;