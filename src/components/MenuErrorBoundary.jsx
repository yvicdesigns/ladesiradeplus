import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export class MenuErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MenuErrorBoundary] Erreur capturée:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4 w-full">
          <Alert variant="destructive" className="max-w-md w-full bg-red-50/50">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">Une erreur est survenue</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-4">
              <p className="text-sm opacity-90">
                {this.state.error?.message || "Impossible de charger cette section. Veuillez réessayer."}
              </p>
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recharger la page
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}