export const checkSWRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    return { status: 'unsupported', message: 'Service Worker non supporté par ce navigateur.' };
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      return { status: 'registered', message: 'Service Worker actif et enregistré.', details: registrations };
    }
    return { status: 'unregistered', message: 'Aucun Service Worker enregistré.' };
  } catch (error) {
    return { status: 'error', message: 'Erreur lors de la vérification du Service Worker.', error };
  }
};

export const getCacheStatus = async () => {
  if (!('caches' in window)) {
    return { status: 'unsupported', message: 'API Cache non supportée.', size: 0, caches: [] };
  }
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    const cacheDetails = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      // Estimating size since exact size is hard without StorageManager per cache
      cacheDetails.push({ name, count: keys.length });
    }

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      totalSize = estimate.usage || 0;
    }

    return { 
      status: 'success', 
      message: `${cacheNames.length} cache(s) trouvé(s).`,
      size: totalSize,
      caches: cacheDetails 
    };
  } catch (error) {
    return { status: 'error', message: 'Erreur lors de la lecture des caches.', error };
  }
};

export const clearCache = async () => {
  if (!('caches' in window)) return false;
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Unregister SW to force a full clean state on reload
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache:', error);
    return false;
  }
};

export const validateManifest = async () => {
  try {
    const response = await fetch('/manifest.json');
    if (!response.ok) throw new Error('Manifest introuvable');
    const manifest = await response.json();
    
    const errors = [];
    if (!manifest.name) errors.push('Le champ "name" est manquant.');
    if (!manifest.short_name) errors.push('Le champ "short_name" est manquant.');
    if (!manifest.start_url) errors.push('Le champ "start_url" est manquant.');
    if (!manifest.icons || manifest.icons.length === 0) errors.push('Les icônes sont manquantes.');
    
    return { 
      valid: errors.length === 0, 
      errors, 
      manifest 
    };
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }
};