'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Navigation, Maximize2, X, MessageSquare, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#e8e0d8' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#fffdf9' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b5d4f4' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] }
];

const VanMarker = ({ heading }: { heading: number }) => (
  <motion.div 
    className="absolute -left-4 -top-2.5"
    animate={{ rotate: heading }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <svg width="32" height="20" viewBox="0 0 32 20">
      <rect x="1" y="4" width="28" height="14" rx="4" fill="white" stroke="#0B1021" strokeWidth="1"/>
      <rect x="14" y="5" width="12" height="8" rx="2" fill="#2BBFDF"/>
      <circle cx="7" cy="17" r="3" fill="#0B1021"/>
      <circle cx="23" cy="17" r="3" fill="#0B1021"/>
      <circle cx="29" cy="9" r="2" fill="#F5C800"/>
    </svg>
    {/* Pulse Animation Overlay */}
    <div className="absolute -inset-4 bg-[#2BBFDF]/30 rounded-full animate-ping pointer-events-none" />
  </motion.div>
);

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Chauffeur confirmé',
  in_progress_to_pickup: 'Van en route',
  arrived_pickup: 'Van arrivé !',
  in_progress_to_dropoff: 'En livraison',
  completed: 'Livraison terminée'
};

export function LiveTrackingMap({ job, driver, client_id }: { job: any, driver: any, client_id: string }) {
  const [vanPos, setVanPos] = useState({ lat: job.pickup_lat, lng: job.pickup_lng });
  const [vanHeading, setVanHeading] = useState(0);
  const [trail, setTrail] = useState<{lat: number, lng: number}[]>([]);
  const [eta, setEta] = useState<number | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [isMapCentered, setIsMapCentered] = useState(true);

  const mapRef = useRef<google.maps.Map | null>(null);
  const vanPosRef = useRef(vanPos); // To keep track of latest inside interpolation

  const animateVanTo = useCallback((targetLat: number, targetLng: number, targetHeading: number) => {
    const steps = 20;
    const stepLat = (targetLat - vanPosRef.current.lat) / steps;
    const stepLng = (targetLng - vanPosRef.current.lng) / steps;
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      setVanPos(prev => {
        const next = { lat: prev.lat + stepLat, lng: prev.lng + stepLng };
        vanPosRef.current = next;
        return next;
      });
      if (step >= steps) clearInterval(interval);
    }, 500 / steps);
    
    setVanHeading(targetHeading);
  }, []);

  useEffect(() => {
    // Listen to Direct Realtime Broadcasts instead of slow database updates
    const channel = supabase
      .channel(`tracking:${driver.id}`)
      .on('broadcast', { event: 'location_update' }, (payload) => {
        const { lat, lng, heading } = payload.payload;
        setTrail(prev => {
          const updated = [...prev, { lat, lng }];
          return updated.slice(-50);
        });
        animateVanTo(lat, lng, heading || 0);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driver.id, animateVanTo]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.functions.invoke('eta-calculator', {
        body: { driver_lat: vanPosRef.current.lat, driver_lng: vanPosRef.current.lng,
                dropoff_lat: job.dropoff_lat, dropoff_lng: job.dropoff_lng,
                job_id: job.id }
      });
      if (data && !data.error) {
        setEta(data.eta_minutes);
        setDistanceRemaining(data.distance_km);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [job.dropoff_lat, job.dropoff_lng, job.id]);

  const recenter = () => {
    if (mapRef.current) {
      mapRef.current.panTo(vanPos);
      setIsMapCentered(true);
    }
  };

  const handleSOS = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase.functions.invoke('sos-alert', {
        body: { job_id: job.id, user_id: client_id, user_type: 'client',
                lat: pos.coords.latitude, lng: pos.coords.longitude }
      });
      alert('Alerte envoyée — notre équipe vous contacte.');
    });
  };

  const GoogleMapsComponent = () => {
    const { isLoaded } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    });

    if (!isLoaded) return <div className="w-full h-full bg-[#e8e0d8] animate-pulse" />;

    return (
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={vanPos}
        zoom={16}
        options={{ styles: MAP_STYLE, disableDefaultUI: true }}
        onLoad={map => { mapRef.current = map; }}
        onDragStart={() => setIsMapCentered(false)}
      >
        <Polyline path={trail} options={{ strokeColor: '#2BBFDF', strokeOpacity: 0.9, strokeWeight: 3 }} />
        {/* Mocking marker overlay using Marker with an internal component or just default if complex */}
        <Marker position={vanPos} icon={{ url: "data:image/svg+xml;charset=UTF-8,%3Csvg width='32' height='20' viewBox='0 0 32 20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='1' y='4' width='28' height='14' rx='4' fill='white' stroke='%230B1021' stroke-width='1'/%3E%3Crect x='14' y='5' width='12' height='8' rx='2' fill='%232BBFDF'/%3E%3Ccircle cx='7' cy='17' r='3' fill='%230B1021'/%3E%3Ccircle cx='23' cy='17' r='3' fill='%230B1021'/%3E%3Ccircle cx='29' cy='9' r='2' fill='%23F5C800'/%3E%3C/svg%3E" }} />
        <Marker position={{ lat: job.pickup_lat, lng: job.pickup_lng }} label="A" />
        <Marker position={{ lat: job.dropoff_lat, lng: job.dropoff_lng }} label="B" />
      </GoogleMap>
    );
  };

  const MockMapComponent = () => (
    <div className="w-full h-full relative bg-[#e8e0d8] overflow-hidden center-flex items-center justify-center">
       <div className="absolute inset-x-0 h-[2px] bg-white/50 top-1/2" />
       <div className="absolute inset-y-0 w-[2px] bg-white/50 left-1/2" />
       
       <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-blue-500 text-xs text-white flex items-center justify-center shadow-lg">A</div>
       <div className="absolute top-3/4 right-1/4 w-4 h-4 rounded-full bg-green-500 text-xs text-white flex items-center justify-center shadow-lg">B</div>

       <VanMarker heading={vanHeading} />
    </div>
  );

  const MapContainer = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? GoogleMapsComponent : MockMapComponent;

  // Assuming driver object contains first_name, last_name, avatar_url, drivers(vehicle_plate, vehicle_type, rating) etc.
  const driverInitials = `${driver.first_name?.[0] || ''}${driver.last_name?.[0] || ''}`;

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Map Area */}
      <div className="relative flex-grow">
        <MapContainer />

        {!isMapCentered && (
          <button 
            onClick={recenter} 
            className="absolute bottom-6 right-4 bg-white rounded-full p-3 shadow-md z-10 text-[#051E3C] hover:bg-gray-50 aspect-square flex items-center justify-center transition-all"
            title="Recentrer sur le véhicule"
            aria-label="Recentrer la carte sur le chauffeur"
          >
            <Navigation className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom Sheet */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] w-full relative z-20 pb-safe">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" />
        
        <div className="px-6 pb-6 pt-2">
          {/* Status Pill & ETA */}
          <div className="flex justify-between items-center mb-6">
            <div className="px-3 py-1 bg-[#F5C800]/20 text-[#051E3C] rounded-full text-sm font-semibold border border-[#F5C800]/30">
              {STATUS_LABELS[job.status] || 'Confirmé'}
            </div>
            {eta !== null && (
              <div className="text-right">
                <span className="text-2xl font-bold font-heading text-[#051E3C]">{eta}</span>
                <span className="text-gray-500 text-sm ml-1">min</span>
              </div>
            )}
          </div>

          {/* Driver Card */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#051E3C] text-white flex items-center justify-center text-lg font-bold">
              {driver.avatar_url ? <img src={driver.avatar_url} alt="driver" className="w-full h-full rounded-full object-cover"/> : driverInitials}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#051E3C]">{driver.first_name} {driver.last_name}</h3>
              <p className="text-sm text-gray-500 font-medium">✨ {driver.rating || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#051E3C]">{driver.drivers?.vehicle_type || 'Fourgon'}</p>
              <p className="text-xs bg-gray-200 px-2 py-0.5 rounded font-mono font-bold uppercase mt-1">
                {driver.drivers?.vehicle_plate || 'TUN 0000'}
              </p>
            </div>
          </div>

          {/* Route Progress */}
          <div className="mb-6 relative">
            <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 px-1">
              <span>POINT A</span>
              <span>POINT B</span>
            </div>
            <div className="w-full">
              <progress 
                max="100" 
                value={distanceRemaining ? Math.max(10, 100 - (distanceRemaining * 10)) : 5} 
                className="w-full h-2 block rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-[#2BBFDF] [&::-webkit-progress-value]:to-[#1A99B4] [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-1000"
              />
            </div>
            {distanceRemaining !== null && (
               <p className="text-center text-sm font-semibold text-gray-400 mt-1">{distanceRemaining} km restants</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <a href={`tel:${driver.phone}`} className="flex-1 bg-[#F5C800] text-[#051E3C] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E0B800] transition filter drop-shadow-sm">
              <Phone className="w-5 h-5 fill-current" /> Appeler
            </a>
            <button 
              className="flex-1 bg-[#E8F8FA] text-[#2BBFDF] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#D0F0F5] transition"
              title="Envoyer un message au chauffeur"
            >
              <MessageCircle className="w-5 h-5 fill-current" /> Chat
            </button>
            <button 
              className="flex-none aspect-square bg-red-50 text-red-500 p-3 rounded-xl font-bold flex items-center justify-center hover:bg-red-100 transition"
              title="Fermer le suivi"
              aria-label="Quitter l'écran de suivi"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* SOS Long Press */}
          <div className="mt-8 flex justify-center">
             <button 
               onContextMenu={(e) => { e.preventDefault(); handleSOS(); }}
               className="text-xs font-bold text-red-400 uppercase tracking-widest opacity-80 hover:opacity-100 transition flex items-center gap-2"
               title="Maintenez le doigt ou clic droit pour activer SOS"
             >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Urgence (SOS)
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
