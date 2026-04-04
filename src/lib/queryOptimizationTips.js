import { supabase } from './customSupabaseClient';

/**
 * Guide d'Optimisation des Requêtes Supabase
 * 
 * Ce fichier contient des fonctions d'aide et des exemples pour optimiser les performances
 * de la base de données et réduire la latence.
 */

/* --------------------------------------------------------------------------------
   1. SELECT SPECIFIC COLUMNS
   Pourquoi: Réduit la taille du payload réseau et la charge mémoire sur le client.
   Ne faites jamais `select('*')` si vous n'avez besoin que de 2 champs.
-------------------------------------------------------------------------------- */

/**
 * BAD: Select all columns
 */
export const fetchAllColumnsBad = async (table) => {
  return await supabase.from(table).select('*');
};

/**
 * GOOD: Select specific columns
 */
export const fetchSpecificColumns = async (table, columns = []) => {
  // columns example: 'id, name, status'
  const selector = columns.join(', ');
  return await supabase.from(table).select(selector);
};

/* --------------------------------------------------------------------------------
   2. ADD LIMITS
   Pourquoi: Empêche le chargement accidentel de milliers de lignes.
   Utilisez toujours la pagination pour les grandes listes.
-------------------------------------------------------------------------------- */

/**
 * GOOD: Limit results
 */
export const fetchWithLimit = async (table, limit = 50) => {
  return await supabase.from(table).select('id, created_at').limit(limit);
};

/* --------------------------------------------------------------------------------
   3. USE COUNT OPTIMIZATIONS
   Pourquoi: Compter les lignes peut être coûteux.
   Utilisez { count: 'exact', head: true } pour obtenir le nombre sans les données.
   Utilisez { count: 'estimated' } pour les très grandes tables (>100k lignes).
-------------------------------------------------------------------------------- */

/**
 * GOOD: Lightweight Count
 */
export const getCountOnly = async (table) => {
  // head: true signifie qu'aucune donnée de ligne n'est retournée, seulement le total
  return await supabase.from(table).select('*', { count: 'exact', head: true });
};

/* --------------------------------------------------------------------------------
   4. BATCH OPERATIONS
   Pourquoi: Réduit le nombre d'allers-retours HTTP (Round Trips).
   Au lieu de faire 5 inserts séparés, faites-en un seul avec un tableau.
-------------------------------------------------------------------------------- */

/**
 * GOOD: Batch Insert
 */
export const batchInsert = async (table, items = []) => {
  // items array: [{name: 'A'}, {name: 'B'}]
  return await supabase.from(table).insert(items);
};

/* --------------------------------------------------------------------------------
   5. INDEXING TIPS (Server Side)
   
   - Toujours indexer les colonnes utilisées dans les clauses WHERE, ORDER BY, et JOIN.
   - Les Foreign Keys (clés étrangères) doivent généralement être indexées.
   - Utilisez l'explorateur de base de données Supabase pour voir les suggestions d'index.
-------------------------------------------------------------------------------- */