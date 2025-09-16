/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleMapProps {
  height?: string;
  className?: string;
}

const GoogleMap = ({ height = "h-40", className = "" }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
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

  const initializeMap = async (key: string) => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: key,
        version: "weekly",
        libraries: ["places"]
      });

      await loader.load();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 11.0168, lng: 76.9558 }, // Coimbatore, Tamil Nadu
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add a marker for the van
      const vanMarker = new google.maps.Marker({
        position: { lat: 11.0168, lng: 76.9558 },
        map: mapInstance,
        title: "School Van",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19h12l1-7H5l1 7z" fill="#FFB800"/>
              <circle cx="8" cy="19" r="2" fill="#333"/>
              <circle cx="16" cy="19" r="2" fill="#333"/>
              <path d="M7 12h10v-2H7v2z" fill="#333"/>
              <path d="M7 8h10V6H7v2z" fill="#333"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Simulate van movement
      let lat = 11.0168;
      let lng = 76.9558;
      setInterval(() => {
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;
        
        vanMarker.setPosition({ lat, lng });
      }, 5000);

      setMap(mapInstance);
      setError(null);
    } catch (error) {
      console.error("Error loading Google Maps:", error);
      setError("Failed to load Google Maps");
    }
  };

  useEffect(() => {
    const loadMap = async () => {
      setIsLoading(true);
      const apiKey = await fetchApiKey();
      
      if (apiKey) {
        await initializeMap(apiKey);
      }
      
      setIsLoading(false);
    };

    loadMap();
  }, []);

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
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;