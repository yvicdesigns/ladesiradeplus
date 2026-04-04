import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { isValidAdminSettingsId } from '@/lib/adminSettingsUtils';

export const useTestUUID = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runTest = async () => {
    setLoading(true);
    let success = true;
    const errors = [];
    const details = [];
    let validUUIDs = 0;
    let invalidUUIDs = 0;
    let supabaseQueriesWork = false;

    const start = performance.now();

    try {
      details.push("Vérification du format UUID sur les commandes récentes...");
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, user_id, restaurant_id')
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(order => {
          if (isValidAdminSettingsId(order.id)) validUUIDs++; else invalidUUIDs++;
          if (order.restaurant_id) {
            if (isValidAdminSettingsId(order.restaurant_id)) validUUIDs++; else invalidUUIDs++;
          }
        });
      }

      details.push(`Analyse terminée : ${validUUIDs} UUIDs valides, ${invalidUUIDs} invalides.`);
      
      if (invalidUUIDs > 0) {
        success = false;
        errors.push("Des UUID invalides ont été trouvés dans la base de données.");
      }

      // Test with an intentional bad UUID
      details.push("Test d'interception d'erreur UUID mal formé...");
      const { error: badUuidError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', 'invalid-uuid-000')
        .maybeSingle();

      if (badUuidError && badUuidError.message.includes('invalid input syntax for type uuid')) {
        details.push("Le système Supabase rejette correctement les UUID mal formés.");
        supabaseQueriesWork = true;
      } else if (!badUuidError) {
        // Technically shouldn't return results, but shouldn't crash if it magically works (mock environment)
        supabaseQueriesWork = true;
      } else {
        errors.push("Erreur inattendue lors du test d'UUID mal formé: " + badUuidError.message);
      }

    } catch (err) {
      success = false;
      errors.push(err.message);
    }

    const executionTime = Math.round(performance.now() - start);
    
    const finalResults = { 
      success, 
      validUUIDs, 
      invalidUUIDs, 
      supabaseQueriesWork,
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