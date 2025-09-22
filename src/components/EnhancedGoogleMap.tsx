/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Bus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Van {
  id: string;
  van_number: string;
  school_name: string;
  route_name?: string;
  current_lat?: number;
  current_lng?: number;
  current_students: number;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
}

interface EnhancedGoogleMapProps {
  height?: string;
  className?: string;
  showAllVans?: boolean; // For super admin to show all school vans
  schoolId?: string; // For regular admin to show only their school vans
}

const EnhancedGoogleMap = ({ 
  height = "h-40", 
  className = "", 
  showAllVans = false,
  schoolId 
}: EnhancedGoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [vans, setVans] = useState<Van[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKey = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      
      if (error) {
        console.error('Error fetching API key:', error);
        setError('Failed to fetch Google Maps API key');
        return null;
      }
      
      return data.apiKey;
    } catch (err) {
      console.error('Error invoking function:', err);
      setError('Failed to connect to map service');
      return null;
    }
  };

  const fetchVans = async () => {
    try {
      let query = supabase
        .from('vans')
        .select(`
          id,
          van_number,
          route_name,
          current_lat,
          current_lng,
          current_students,
          capacity,
          status,
          schools!inner(name)
        `)
        .eq('status', 'active')
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null);

      // If schoolId is provided (for regular admin), filter by school
      if (schoolId && !showAllVans) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedVans: Van[] = (data || []).map((van: any) => ({
        id: van.id,
        van_number: van.van_number,
        school_name: van.schools.name,
        route_name: van.route_name,
        current_lat: van.current_lat,
        current_lng: van.current_lng,
        current_students: van.current_students,
        capacity: van.capacity,
        status: van.status
      }));

      setVans(formattedVans);
    } catch (error) {
      console.error('Error fetching vans:', error);
    }
  };

  const createVanIcon = (van: Van) => {
    const fillColor = van.status === 'active' ? '#10B981' : van.status === 'maintenance' ? '#F59E0B' : '#6B7280';
    
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="white" stroke="${fillColor}" stroke-width="2"/>
          <path d="M12 24h16l2-8H10l2 8z" fill="${fillColor}"/>
          <circle cx="15" cy="24" r="2" fill="#333"/>
          <circle cx="25" cy="24" r="2" fill="#333"/>
          <path d="M13 20h14v-2H13v2z" fill="white" opacity="0.8"/>
          <path d="M13 16h14v-2H13v2z" fill="white" opacity="0.8"/>
          <text x="20" y="32" text-anchor="middle" fill="${fillColor}" font-size="8" font-weight="bold">${van.current_students}</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20)
    };
  };

  const createVanInfoWindow = (van: Van) => {
    return new google.maps.InfoWindow({
      content: `
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19h12l1-7H5l1 7z" fill="#3B82F6"/>
                <circle cx="8" cy="19" r="2" fill="#1F2937"/>
                <circle cx="16" cy="19" r="2" fill="#1F2937"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">${van.van_number}</h3>
              <p class="text-sm text-gray-600">${van.school_name}</p>
            </div>
          </div>
          <div class="space-y-1 text-sm">
            ${van.route_name ? `<p><span class="font-medium">Route:</span> ${van.route_name}</p>` : ''}
            <p><span class="font-medium">Students:</span> ${van.current_students}/${van.capacity}</p>
            <p><span class="font-medium">Status:</span> 
              <span class="inline-block px-2 py-1 rounded text-xs ${
                van.status === 'active' ? 'bg-green-100 text-green-800' : 
                van.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }">${van.status.charAt(0).toUpperCase() + van.status.slice(1)}</span>
            </p>
          </div>
        </div>
      `
    });
  };

  const initializeMap = async (key: string) => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: key,
        version: "weekly",
        libraries: ["places"]
      });

      await loader.load();

      // Center map on Tamil Nadu region (to cover more schools)
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 11.0168, lng: 76.9558 }, // Central Tamil Nadu
        zoom: 8,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      setMap(mapInstance);
      setError(null);
    } catch (error) {
      console.error("Error loading Google Maps:", error);
      setError("Failed to load Google Maps");
    }
  };

  const addVanMarkers = () => {
    if (!map || vans.length === 0) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    vans.forEach(van => {
      if (van.current_lat && van.current_lng) {
        const position = { lat: van.current_lat, lng: van.current_lng };
        
        const marker = new google.maps.Marker({
          position,
          map,
          title: `${van.van_number} - ${van.school_name}`,
          icon: createVanIcon(van)
        });

        const infoWindow = createVanInfoWindow(van);
        
        marker.addListener('click', () => {
          // Close all other info windows
          markers.forEach(m => {
            if (m.get('infoWindow')) {
              m.get('infoWindow').close();
            }
          });
          
          infoWindow.open(map, marker);
        });

        marker.set('infoWindow', infoWindow);
        newMarkers.push(marker);
        bounds.extend(position);
      }
    });

    setMarkers(newMarkers);

    // Fit map to show all markers with better mobile handling
    if (newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        const position = newMarkers[0].getPosition();
        if (position) {
          map.setCenter(position);
          map.setZoom(15); // Closer zoom for single van
          console.log('🗺️ Centering map on single van at:', position.lat(), position.lng());
        }
      } else {
        map.fitBounds(bounds);
        // Add padding for better view
        const listener = google.maps.event.addListener(map, "idle", () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 14) map.setZoom(14);
          google.maps.event.removeListener(listener);
        });
      }
    }
  };

  useEffect(() => {
    const loadMap = async () => {
      setIsLoading(true);
      const apiKey = await fetchApiKey();
      
      if (apiKey) {
        await initializeMap(apiKey);
        await fetchVans();
      }
      
      setIsLoading(false);
    };

    loadMap();
  }, [schoolId, showAllVans]);

  useEffect(() => {
    if (map && vans.length > 0) {
      addVanMarkers();
    }
  }, [map, vans]);

  // Refresh van data every 30 seconds
  useEffect(() => {
    if (!isLoading) {
      const interval = setInterval(fetchVans, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoading, schoolId, showAllVans]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-destructive">
            <MapPin className="h-4 w-4" />
            Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${height} ${className} relative rounded-lg overflow-hidden`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Van count indicator */}
      {!isLoading && vans.length > 0 && (
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <Bus className="h-4 w-4 text-primary" />
            <span className="font-medium">{vans.length} Active Vans</span>
            {showAllVans && (
              <span className="text-xs text-muted-foreground">• All Schools</span>
            )}
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Loading live van locations...</p>
          </div>
        </div>
      )}
      
      {!isLoading && vans.length === 0 && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Bus className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No active vans found</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGoogleMap;