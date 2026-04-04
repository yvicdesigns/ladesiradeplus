import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from '@/providers/AppProviders';
import App from '@/App';
import '@/index.css';

window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});

const bootstrap = () => {
  console.log('[Main] Bootstrapping React app');
  
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
  );

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Failed to find the root element');
    return;
  }

  const root = ReactDOM.createRoot(rootElement);

  if (missingEnvVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingEnvVars.join(', ')}. Please check your .env file.`;
    console.error(errorMessage);
    
    root.render(
      <div style={{ 
        padding: '20px', 
        fontFamily: 'system-ui, sans-serif', 
        maxWidth: '600px', 
        margin: '50px auto',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        color: '#991b1b'
      }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Erreur de Configuration</h1>
        <p>L'application ne peut pas démarrer car certaines configurations sont manquantes.</p>
        <pre style={{ 
          backgroundColor: '#fee2e2', 
          padding: '12px', 
          borderRadius: '4px',
          overflowX: 'auto',
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          {errorMessage}
        </pre>
      </div>
    );
  } else {
    // AppProviders contient BrowserRouter et TOUS les contextes métier en toute sécurité
    root.render(
      <AppProviders>
        <App />
      </AppProviders>
    );
  }
};

bootstrap();