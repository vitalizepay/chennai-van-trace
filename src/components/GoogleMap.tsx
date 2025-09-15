/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Key } from "lucide-react";

interface GoogleMapProps {
  height?: string;
  className?: string;
}

const GoogleMap = ({ height = "h-40", className = "" }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initializeMap = async (key: string) => {
    if (!mapRef.current) return;

    setIsLoading(true);
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
      new google.maps.Marker({
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
        
        const vanMarker = new google.maps.Marker({
          position: { lat, lng },
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
      }, 5000);

      setMap(mapInstance);
      setIsApiKeySet(true);
      localStorage.setItem("google_maps_api_key", key);
    } catch (error) {
      console.error("Error loading Google Maps:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedApiKey = localStorage.getItem("google_maps_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      initializeMap(savedApiKey);
    }
  }, []);

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      initializeMap(apiKey.trim());
    }
  };

  if (!isApiKeySet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4" />
            Google Maps API Key Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Enter your Google Maps API key to enable live tracking
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter Google Maps API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="text-xs"
            />
            <Button 
              size="sm" 
              onClick={handleSetApiKey}
              disabled={!apiKey.trim() || isLoading}
            >
              {isLoading ? "Loading..." : "Set"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key from{" "}
            <a 
              href="https://console.cloud.google.com/google/maps-apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Cloud Console
            </a>
          </p>
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