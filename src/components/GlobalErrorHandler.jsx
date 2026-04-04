import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export class GlobalErrorHandler extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('[GlobalErrorHandler] Unhandled Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
          <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-2xl border border-red-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Erreur Inattendue
            </h1>
            
            <p className="text-gray-600 mb-8 max-w-md">
              Nous sommes désolés, une erreur critique s'est produite. L'application n'a pas pu continuer normalement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button 
                onClick={this.handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium rounded-xl"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Recharger l'application
              </Button>
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 h-12 text-base font-medium rounded-xl"
              >
                <Home className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 w-full text-left bg-gray-100 p-4 rounded-xl overflow-x-auto">
                <p className="text-xs font-mono text-red-600 font-bold mb-2">
                  {this.state.error.toString()}
                </p>
                <p className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack || this.state.error.stack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorHandler;