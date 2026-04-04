import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Truck, MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom Icons
const scooterIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png', 
  shadowUrl: iconShadow,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -30]
});

// Component to handle smooth map movements
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  const previousCenter = useRef(center);

  useEffect(() => {
    if (center) {
      // Only fly if distance is significant to avoid jitter
      const dist = Math.sqrt(
        Math.pow(center[0] - previousCenter.current[0], 2) + 
        Math.pow(center[1] - previousCenter.current[1], 2)
      );

      if (dist > 0.0001) { // small threshold
         map.flyTo(center, zoom || map.getZoom(), {
           animate: true,
           duration: 1.5 // smooth animation duration
         });
         previousCenter.current = center;
      }
    }
  }, [center, zoom, map]);

  return null;
};

export const DeliveryMap = ({ driverLocation, deliveryAddress }) => {
  // Default to city center if no location (e.g., Abidjan coordinates roughly)
  const defaultCenter = [5.3600, -4.0083]; 
  
  // Parse driver location if valid
  const hasValidDriverLoc = driverLocation && 
                            typeof driverLocation.lat === 'number' && 
                            typeof driverLocation.lng === 'number';

  const center = hasValidDriverLoc ? [driverLocation.lat, driverLocation.lng] : defaultCenter;

  return (
    <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-inner border relative z-0">
      {!hasValidDriverLoc && (
        <div className="absolute inset-0 z-10 bg-gray-100/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
           <div className="bg-white p-4 rounded-full shadow-lg mb-3">
             <Navigation className="w-8 h-8 text-blue-500 animate-pulse" />
           </div>
           <h3 className="font-bold text-gray-800">Recherche du signal GPS...</h3>
           <p className="text-sm text-gray-600 max-w-xs mt-1">
             Position du livreur en attente de mise à jour.
           </p>
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {hasValidDriverLoc && (
          <>
            {/* Accuracy Radius Circle (fake visual if accuracy not provided) */}
            <Circle 
              center={center}
              radius={driverLocation.accuracy || 50}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
            />

            <Marker position={center} icon={scooterIcon}>
              <Popup>
                <div className="text-center">
                  <span className="font-bold text-sm">Livreur en route</span> <br/> 
                  <span className="text-xs text-gray-500">
                    Dernière maj: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </Popup>
            </Marker>
            
            <MapUpdater center={center} />
          </>
        )}
      </MapContainer>
    </div>
  );
};