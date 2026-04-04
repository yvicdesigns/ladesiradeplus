import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { TestDataManager } from '@/lib/TestDataManager';

export const useTestTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runTest = async () => {
    setLoading(true);
    const start = performance.now();
    const details = [];
    const errors = [];
    let success = true;

    try {
      details.push("Début du test de transaction atomique...");
      
      // Fetch 3 random menu items for testing
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, price')
        .eq('is_deleted', false)
        .limit(3);

      if (menuError || !menuItems || menuItems.length === 0) {
        throw new Error("Impossible de récupérer les articles du menu pour le test.");
      }

      const testItems = menuItems.map(item => ({
        menu_item_id: item.id,
        quantity: 2,
        price: item.price
      }));

      details.push(`Création d'une commande avec ${testItems.length} articles...`);
      const createResult = await TestDataManager.createTestOrder(null, testItems);

      if (!createResult.success) {
        errors.push(createResult.error);
        success = false;
      } else {
        details.push(`Commande créée avec succès (ID: ${createResult.orderId})`);
        
        // Verify items were added
        const { data: insertedItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', createResult.orderId);

        if (itemsError) {
          errors.push("Erreur lors de la vérification des order_items: " + itemsError.message);
          success = false;
        } else if (insertedItems.length !== testItems.length) {
          errors.push(`Nombre d'articles incorrect: attendu ${testItems.length}, reçu ${insertedItems.length}`);
          success = false;
        } else {
          details.push("Tous les articles ont été insérés correctement (Atomicité confirmée).");
        }

        // Verify total
        const expectedTotal = testItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        const { data: orderData } = await supabase.from('orders').select('total').eq('id', createResult.orderId).single();
        
        if (Number(orderData?.total) !== expectedTotal) {
          errors.push(`Total incorrect. Attendu: ${expectedTotal}, Reçu: ${orderData?.total}`);
          success = false;
        } else {
          details.push(`Le calcul du total est correct (${expectedTotal}).`);
        }
      }

      // Cleanup immediately
      await TestDataManager.cleanupTestData();
      details.push("Données de test nettoyées.");

    } catch (err) {
      success = false;
      errors.push(err.message);
    }

    const executionTime = Math.round(performance.now() - start);
    const finalResults = { success, executionTime, details, errors };
    setResults(finalResults);
    setLoading(false);
    return finalResults;
  };

  return { runTest, results, loading };
};