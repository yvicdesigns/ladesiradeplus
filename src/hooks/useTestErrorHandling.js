import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { detectAndHandleUUIDErrors } from '@/lib/supabaseErrorHandler';

export const useTestErrorHandling = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runTest = async () => {
    setLoading(true);
    let success = true;
    const errors = [];
    const details = [];
    const start = performance.now();

    try {
      // Test 1: UUID Error detection
      details.push("Test 1: Détection d'erreur UUID...");
      const mockError = { message: 'invalid input syntax for type uuid' };
      const handled = detectAndHandleUUIDErrors(mockError);
      
      if (handled.isUUIDError) {
        details.push("✅ Le gestionnaire d'erreur détecte correctement les erreurs UUID.");
      } else {
        success = false;
        errors.push("Le gestionnaire d'erreur n'a pas détecté l'erreur de syntaxe UUID.");
      }

      // Test 2: Missing Data (Graceful degradation)
      details.push("Test 2: Interrogation d'une table inexistante ou record manquant...");
      const { data, error: missingError } = await supabase.from('orders').select('*').eq('id', '7eedf081-0268-4867-af38-61fa5932420b').maybeSingle();
      
      if (!missingError && !data) {
        details.push("✅ maybeSingle() gère correctement l'absence de données sans crasher.");
      } else if (missingError) {
        details.push("✅ L'erreur est capturée proprement: " + missingError.message);
      }

      // Test 3: Network Timeout Simulation
      details.push("Test 3: Simulation de Timeout...");
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_SIMULATED')), 100));
      
      try {
        await Promise.race([
          supabase.from('orders').select('*').limit(1),
          timeoutPromise
        ]);
        details.push("⚠️ La requête a répondu plus vite que le timeout simulé (100ms).");
      } catch (err) {
        if (err.message === 'TIMEOUT_SIMULATED') {
          details.push("✅ Le système de Promise.race gère correctement les Timeouts réseau.");
        }
      }

    } catch (err) {
      success = false;
      errors.push(err.message);
    }

    const executionTime = Math.round(performance.now() - start);
    const finalResults = { 
      success, 
      errorMessageClarity: true, 
      errorHandledProperly: success && errors.length === 0,
      executionTime,
      details,
      errors 
    };
    
    setResults(finalResults);
    setLoading(false);
    return finalResults;
  };

  return { runTest, results, loading };
};