'use client';

import { useEffect, useState, useMemo } from 'react';
import { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface RouteMapProps {
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  className?: string;
}

export default function RouteMap({
  pickupLat, pickupLng, dropoffLat, dropoffLng, driverLat, driverLng, className = "h-64 w-full rounded-2xl overflow-hidden"
}: RouteMapProps) {
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'fr'
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Parse coords safely
  const pLat = pickupLat ? Number(pickupLat) : null;
  const pLng = pickupLng ? Number(pickupLng) : null;
  const dLat = dropoffLat ? Number(dropoffLat) : null;
  const dLng = dropoffLng ? Number(dropoffLng) : null;
  const drLat = driverLat ? Number(driverLat) : null;
  const drLng = driverLng ? Number(driverLng) : null;

  const hasPickup = pLat !== null && pLng !== null;
  const hasDropoff = dLat !== null && dLng !== null;
  const hasDriver = drLat !== null && drLng !== null;

  useEffect(() => {
    if (!isLoaded || !hasPickup || !hasDropoff) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(pLat!, pLng!),
        destination: new google.maps.LatLng(dLat!, dLng!),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setMapError(null);
        } else {
          console.error("Directions error", status);
          if (status === 'REQUEST_DENIED') {
            setMapError("L'API 'Directions API' n'est pas activée dans votre console Google Cloud. Veuillez l'activer pour voir l'itinéraire.");
          } else if (status === 'ZERO_RESULTS') {
            setMapError("Aucun itinéraire routier trouvé entre ces deux points.");
          } else {
            setMapError("Impossible de calculer l'itinéraire (" + status + ")");
          }
        }
      }
    );
  }, [pLat, pLng, dLat, dLng, isLoaded, hasPickup, hasDropoff]);

  if (loadError) {
    return <div className={`flex items-center justify-center bg-gray-100 ${className}`}><p className="text-red-500 font-bold">Erreur de chargement Google Maps</p></div>;
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border border-gray-100 ${className}`}>
        <Loader2 className="w-8 h-8 text-vanz-teal animate-spin" />
      </div>
    );
  }

  // Default center (Tunisia)
  const center = hasPickup ? { lat: pLat!, lng: pLng! } : { lat: 36.8065, lng: 10.1815 };

  return (
    <div className={className}>
      <GoogleMap
        zoom={10}
        center={center}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        {mapError && (
          <div className="absolute top-2 left-2 right-2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-red-200 shadow-sm">
             <p className="text-[10px] font-bold text-red-600 leading-tight">⚠️ {mapError}</p>
          </div>
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#00BFA6', // Vanz Teal
                strokeWeight: 5,
              }
            }}
          />
        )}
        
        {/* Fallback Markers if directions fail */}
        {!directions && hasPickup && (
          <Marker position={{ lat: pLat!, lng: pLng! }} label="A" />
        )}
        {!directions && hasDropoff && (
          <Marker position={{ lat: dLat!, lng: dLng! }} label="B" />
        )}
        
        {/* If we have a driver location, show it as a specific moving marker */}
        {hasDriver && (
          <Marker 
            position={{ lat: drLat!, lng: drLng! }}
            icon="/delivery-truck-icon.png" // Assume we have a truck icon, otherwise fallback to default
          />
        )}

      </GoogleMap>
    </div>
  );
}
