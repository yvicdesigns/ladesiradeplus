export const QUARTERS = [
  { id: 'aer', name: 'Aéroport', fee: 1500, coordinates: { latitude: -4.2592, longitude: 15.2504 } },
  { id: 'bac', name: 'Bacongo', fee: 1500, coordinates: { latitude: -4.2750, longitude: 15.2670 } },
  { id: 'bat', name: 'Batignole', fee: 1000, coordinates: { latitude: -4.2300, longitude: 15.2900 } },
  { id: 'cen', name: 'Centre-Ville', fee: 1000, coordinates: { latitude: -4.2706, longitude: 15.2829 } },
  { id: 'cha', name: "Chateau d'Eau", fee: 1500, coordinates: { latitude: -4.2800, longitude: 15.2400 } },
  { id: 'com', name: 'Commission', fee: 1500, coordinates: { latitude: -4.2900, longitude: 15.2500 } },
  { id: 'con', name: 'Congo Chine', fee: 2500, coordinates: { latitude: -4.1700, longitude: 15.2200 } },
  { id: 'dji', name: 'Djiri', fee: 3000, coordinates: { latitude: -4.1830, longitude: 15.2670 } },
  { id: 'dom', name: 'Domaine', fee: 2000, coordinates: { latitude: -4.2100, longitude: 15.2900 } },
  { id: 'kin', name: 'Kinsoudi', fee: 2000, coordinates: { latitude: -4.3000, longitude: 15.2300 } },
  { id: 'kte', name: 'Kintélé', fee: 3000, coordinates: { latitude: -4.1330, longitude: 15.3000 } },
  { id: 'lab', name: 'La Base', fee: 1500, coordinates: { latitude: -4.2600, longitude: 15.2600 } },
  { id: 'lap', name: 'La Poudrière', fee: 1500, coordinates: { latitude: -4.2400, longitude: 15.2700 } },
  { id: 'lyc', name: 'Lycée', fee: 1500, coordinates: { latitude: -4.2200, longitude: 15.2800 } },
  { id: 'maf', name: 'Mafouta', fee: 2000, coordinates: { latitude: -4.3100, longitude: 15.2300 } },
  { id: 'mka', name: 'Makandilou', fee: 2500, coordinates: { latitude: -4.1600, longitude: 15.2500 } },
  { id: 'mak', name: 'Makélékélé', fee: 1500, coordinates: { latitude: -4.2980, longitude: 15.2530 } },
  { id: 'mas', name: 'Massengo', fee: 2000, coordinates: { latitude: -4.1900, longitude: 15.2600 } },
  { id: 'may', name: 'Mayanga', fee: 2500, coordinates: { latitude: -4.3200, longitude: 15.2200 } },
  { id: 'maz', name: 'Mazala', fee: 1500, coordinates: { latitude: -4.2950, longitude: 15.2450 } },
  { id: 'mfi', name: 'Mfilou', fee: 1500, coordinates: { latitude: -4.2500, longitude: 15.2330 } },
  { id: 'mik', name: 'Mikalou', fee: 1500, coordinates: { latitude: -4.2000, longitude: 15.2700 } },
  { id: 'mou', name: 'Moungali', fee: 1000, coordinates: { latitude: -4.2580, longitude: 15.2830 } },
  { id: 'mpil', name: 'Mpila', fee: 1000, coordinates: { latitude: -4.2650, longitude: 15.2950 } },
  { id: 'mpis', name: 'Mpissa', fee: 1500, coordinates: { latitude: -4.2850, longitude: 15.2550 } },
  { id: 'nko', name: 'Nkombo', fee: 2000, coordinates: { latitude: -4.2062, longitude: 15.2433 } },
  { id: 'oms', name: 'OMS', fee: 2000, coordinates: { latitude: -4.2300, longitude: 15.2200 } },
  { id: 'oue', name: 'Ouenzé', fee: 1000, coordinates: { latitude: -4.2420, longitude: 15.2830 } },
  { id: 'pk', name: 'PK', fee: 2000, coordinates: { latitude: -4.2400, longitude: 15.2100 } },
  { id: 'pla', name: 'Plateau', fee: 1000, coordinates: { latitude: -4.2750, longitude: 15.2850 } },
  { id: 'pot', name: 'Poto-Poto', fee: 1000, coordinates: { latitude: -4.2670, longitude: 15.2830 } },
  { id: 'tal', name: 'Talangaï', fee: 1500, coordinates: { latitude: -4.2170, longitude: 15.2830 } }
];

export const QUARTERS_WITH_FEES = QUARTERS.reduce((acc, quarter) => {
  acc[quarter.name] = quarter.fee;
  return acc;
}, {});

export const getQuarterByName = (name) => {
  if (!name) return null;
  return QUARTERS.find(q => q.name.toLowerCase() === name.toLowerCase()) || null;
};