import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { RestaurantProvider } from '@/contexts/RestaurantContext';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AdminLanguageProvider } from '@/contexts/AdminLanguageContext';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { SoundProvider } from '@/hooks/useSound';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';
import SupabaseErrorBoundary from '@/components/SupabaseErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

/**
 * AppProviders centralizes ALL application contexts.
 * 
 * STRICT HIERARCHY (CRITICAL for i18n):
 * 1. BrowserRouter (Absolute root for routing)
 * 2. I18nextProvider (Must wrap LanguageProvider to provide context to useTranslation)
 * 3. TooltipProvider (UI)
 * 4. Language Providers (Can now safely use useTranslation)
 * 5. AuthProvider (Needs navigation and language)
 * 6. Data Providers (Restaurant, Cart)
 * 7. Error & Utilities
 */
export const AppProviders = ({ children }) => {
  // Test i18n context availability during initialization
  console.log("[i18n] Provider initialization status:", i18n.isInitialized);
  
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <LanguageProvider>
            <AdminLanguageProvider>
              <AuthProvider>
                <RestaurantProvider>
                  <CartProvider>
                    <ErrorProvider>
                      <SoundProvider>
                        <GlobalErrorHandler>
                          <SupabaseErrorBoundary>
                            {children}
                            <Toaster />
                          </SupabaseErrorBoundary>
                        </GlobalErrorHandler>
                      </SoundProvider>
                    </ErrorProvider>
                  </CartProvider>
                </RestaurantProvider>
              </AuthProvider>
            </AdminLanguageProvider>
          </LanguageProvider>
        </TooltipProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};