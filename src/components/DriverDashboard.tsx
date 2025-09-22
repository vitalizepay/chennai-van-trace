import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Play, Square, Users, MapPin, UserCheck, UserX, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SOSButton from "@/components/SOSButton";
import { toast } from "@/hooks/use-toast";

interface DriverDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

interface Student {
  id: string;
  name: string;
  stop: string;
  boarded: boolean;
  dropped: boolean;
}

const DriverDashboard = ({ language, onBack }: DriverDashboardProps) => {
  const { signOut, user } = useAuth();
  const [tripActive, setTripActive] = useState(false);
  const [vanId, setVanId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "Aarav Kumar", stop: "Anna Nagar", boarded: false, dropped: false },
    { id: "2", name: "Priya Sharma", stop: "T. Nagar", boarded: false, dropped: false },
    { id: "3", name: "Karthik Raja", stop: "Velachery", boarded: false, dropped: false },
    { id: "4", name: "Sneha Patel", stop: "Adyar", boarded: false, dropped: false },
  ]);

  const texts = {
    en: {
      title: "Driver Dashboard",
      driverName: "Raj Kumar",
      vanNumber: "VAN-001",
      startTrip: "Start Trip",
      stopTrip: "Stop Trip",
      tripStatus: "Trip Status",
      active: "Active",
      inactive: "Inactive",
      studentAttendance: "Student Attendance",
      currentRoute: "Current Route",
      boarded: "Boarded",
      dropped: "Dropped",
      pending: "Pending",
      routeStops: "Route: Anna Nagar → T.Nagar → Velachery → Adyar → School"
    },
    ta: {
      title: "ஓட்டுநர் டாஷ்போர்டு",
      driverName: "ராஜ் குமார்",
      vanNumber: "VAN-001",
      startTrip: "பயணம் தொடங்கு",
      stopTrip: "பயணம் நிறுத்து",
      tripStatus: "பயண நிலை",
      active: "செயலில்",
      inactive: "செயலில் இல்லை",
      studentAttendance: "மாணவர் வருகை",
      currentRoute: "தற்போதைய பாதை",
      boarded: "ஏறினார்",
      dropped: "இறக்கினார்",
      pending: "நிலுவை",
      routeStops: "பாதை: அண்ணா நகர் → டி.நகர் → வேளச்சேரி → அடையார் → பள்ளி"
    }
  };

  const t = texts[language];

  // Get driver's assigned van
  useEffect(() => {
    const fetchDriverVan = async () => {
      if (!user?.id) {
        console.log('No user ID available for van lookup');
        return;
      }
      
      console.log('Fetching van for driver:', user.id);
      
      const { data, error } = await supabase
        .from('vans')
        .select('id, van_number, route_name')
        .eq('driver_id', user.id)
        .maybeSingle();
      
      console.log('Van fetch result:', { data, error });
      
      if (data && !error) {
        console.log('Driver assigned to van:', data);
        setVanId(data.id);
      } else if (error) {
        console.error('Error fetching driver van:', error);
      } else {
        console.log('No van assigned to driver:', user.id);
      }
    };

    fetchDriverVan();
  }, [user?.id]);

  // Location tracking when trip is active
  useEffect(() => {
    console.log('Location tracking effect triggered:', { tripActive, vanId });
    
    if (!tripActive || !vanId) {
      console.log('Location tracking not starting:', { 
        tripActive: tripActive, 
        vanId: vanId,
        reason: !tripActive ? 'trip not active' : 'no van assigned' 
      });
      return;
    }

    const updateLocation = async () => {
      console.log('Attempting to get location...');
      
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Location obtained:', { 
            latitude, 
            longitude, 
            accuracy,
            timestamp: new Date().toISOString()
          });
          
          try {
            const { error } = await supabase
              .from('vans')
              .update({
                current_lat: latitude,
                current_lng: longitude,
                last_location_update: new Date().toISOString()
              })
              .eq('id', vanId);
              
            if (error) {
              console.error('Database update error:', error);
            } else {
              console.log('Location successfully updated in database for van:', vanId);
            }
          } catch (dbError) {
            console.error('Database operation failed:', dbError);
          }
        },
        (error) => {
          console.error('Geolocation error:', {
            code: error.code,
            message: error.message,
            details: {
              1: 'PERMISSION_DENIED - User denied location access',
              2: 'POSITION_UNAVAILABLE - Location information unavailable', 
              3: 'TIMEOUT - Location request timed out'
            }[error.code] || 'Unknown error'
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    };

    // Update location immediately when trip starts
    console.log('Starting location tracking for van:', vanId);
    updateLocation();

    // Then update every 10 seconds while trip is active
    const locationInterval = setInterval(() => {
      console.log('Periodic location update triggered');
      updateLocation();
    }, 10000);

    return () => {
      console.log('Stopping location tracking');
      clearInterval(locationInterval);
    };
  }, [tripActive, vanId]);

  const handleTripToggle = () => {
    setTripActive(!tripActive);
    if (!tripActive) {
      toast({
        title: "Trip Started",
        description: "GPS tracking is now active",
        className: "bg-success text-success-foreground"
      });
    } else {
      toast({
        title: "Trip Ended",
        description: "GPS tracking stopped",
        className: "bg-muted text-muted-foreground"
      });
      // Reset all students
      setStudents(prev => prev.map(student => ({ ...student, boarded: false, dropped: false })));
    }
  };

  const updateStudentStatus = (studentId: string, field: "boarded" | "dropped") => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: !student[field] }
        : student
    ));
  };

  const getStudentStatusBadge = (student: Student) => {
    if (student.dropped) return <Badge className="bg-success text-success-foreground">{t.dropped}</Badge>;
    if (student.boarded) return <Badge className="bg-primary text-primary-foreground">{t.boarded}</Badge>;
    return <Badge variant="outline">{t.pending}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-driver text-driver-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-driver-foreground hover:bg-driver-light/20">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="text-sm opacity-90">{t.driverName} • {t.vanNumber}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-driver-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
        <SOSButton />
      </header>

      <div className="p-4 space-y-4">
        {/* Trip Control */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t.tripStatus}</p>
                <Badge className={tripActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                  {tripActive ? t.active : t.inactive}
                </Badge>
              </div>
              <Button
                onClick={handleTripToggle}
                className={`gap-2 ${
                  tripActive 
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                    : "bg-success hover:bg-success/90 text-success-foreground"
                }`}
                size="lg"
              >
                {tripActive ? (
                  <>
                    <Square className="h-5 w-5" />
                    {t.stopTrip}
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    {t.startTrip}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Route */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-driver" />
              {t.currentRoute}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">{t.routeStops}</p>
            </div>
          </CardContent>
        </Card>

        {/* Student Attendance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-driver" />
              {t.studentAttendance}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.stop}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStudentStatusBadge(student)}
                  <div className="flex gap-2">
                    <Button
                      variant={student.boarded ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStudentStatus(student.id, "boarded")}
                      disabled={!tripActive}
                      className="gap-1"
                    >
                      <UserCheck className="h-3 w-3" />
                      Board
                    </Button>
                    <Button
                      variant={student.dropped ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStudentStatus(student.id, "dropped")}
                      disabled={!tripActive || !student.boarded}
                      className="gap-1"
                    >
                      <UserX className="h-3 w-3" />
                      Drop
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trip Summary */}
        {tripActive && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="h-3 w-3 bg-success rounded-full mx-auto animate-pulse"></div>
                <p className="text-sm font-medium">GPS Tracking Active</p>
                <p className="text-xs text-muted-foreground">
                  Parents can see your live location
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;