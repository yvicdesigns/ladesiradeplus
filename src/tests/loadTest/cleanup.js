/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import { loadTestConfig } from './loadTestConfig.js';

export const executeCleanup = async () => {
  console.log('\n--- Début de la procédure de nettoyage ---');
  
  if (!loadTestConfig.cleanup.autoClean) {
    console.log('Nettoyage automatique désactivé dans la configuration.');
    return;
  }

  const targetDir = path.resolve(loadTestConfig.paths.targetDirectory);

  try {
    if (fs.existsSync(targetDir)) {
      console.log(`Suppression du répertoire de test: ${targetDir}`);
      
      // Node.js v14+ recursive directory deletion
      fs.rmSync(targetDir, { recursive: true, force: true });
      
      if (!fs.existsSync(targetDir)) {
        console.log('✓ Nettoyage réussi. Aucun artefact restant.');
      } else {
        console.warn('⚠ Attention: Le répertoire n\'a pas pu être supprimé complètement.');
      }
    } else {
      console.log('Le répertoire n\'existe déjà plus.');
    }
  } catch (error) {
    console.error(`✗ Erreur lors du nettoyage: ${error.message}`);
    console.warn('Veuillez supprimer le dossier /src/tests/loadTest/ manuellement si nécessaire.');
  }
};