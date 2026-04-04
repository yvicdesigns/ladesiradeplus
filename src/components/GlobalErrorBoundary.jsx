import React from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour que le prochain rendu affiche l'UI de secours.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // On pourrait logger l'erreur dans un service externe ici (ex: Sentry)
    console.error('[GlobalErrorBoundary caught an error]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optionnel: Recharger la page ou rediriger vers l'accueil
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Afficher une interface de secours si une erreur est interceptée
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-card p-8 rounded-xl shadow-lg border">
            <ErrorState 
              title="Oups ! Quelque chose s'est mal passé."
              message="Un problème inattendu est survenu dans l'application. Nos équipes ont été alertées."
              onRetry={this.handleReset}
            />
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 p-4 bg-muted rounded-md overflow-auto text-xs text-muted-foreground">
                <p className="font-bold mb-2">Détails techniques :</p>
                <pre>{this.state.error.toString()}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Si pas d'erreur, on rend les enfants normalement
    return this.props.children;
  }
}

export default GlobalErrorBoundary;