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
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

interface DriverDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

interface Student {
  id: string;
  full_name: string;
  pickup_stop: string;
  grade: string;
  boarded: boolean;
  dropped: boolean;
}

const DriverDashboard = ({ language, onBack }: DriverDashboardProps) => {
  const { signOut, user } = useAuth();
  const [tripActive, setTripActive] = useState(false);
  const [vanId, setVanId] = useState<string | null>(null);
  const [vanData, setVanData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'active' | 'unavailable' | 'permission-denied'>('active');
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);

  const texts = {
    en: {
      title: "Driver Dashboard",
      driverName: "Driver",
      vanNumber: vanData?.van_number || "No Van Assigned",
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
      routeStops: vanData?.route_name || "No route assigned"
    },
    ta: {
      title: "ஓட்டுநர் டாஷ்போர்டு",
      driverName: "ஓட்டுநர்",
      vanNumber: vanData?.van_number || "வேன் ஒதுக்கப்படவில்லை",
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
      routeStops: vanData?.route_name || "பாதை ஒதுக்கப்படவில்லை"
    }
  };

  const t = texts[language];

  // Get driver's assigned van and students - force refresh
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user?.id) {
        console.log('No user ID available for van lookup');
        return;
      }
      
      console.log('Fetching van for driver:', user.id);
      
      const { data: vanData, error: vanError } = await supabase
        .from('vans')
        .select('id, van_number, route_name, current_students')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      console.log('Van fetch result:', { vanData, vanError });
      
      if (vanData && !vanError) {
        console.log('Driver assigned to van:', vanData);
        setVanId(vanData.id);
        setVanData(vanData);
        
        // Fetch students for this specific van only
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, full_name, pickup_stop, grade, boarded, dropped')
          .eq('van_id', vanData.id)
          .eq('status', 'active')
          .order('full_name');
          
        if (studentsData && !studentsError) {
          setStudents(studentsData);
          console.log(`Loaded ${studentsData.length} students for van ${vanData.van_number}`);
        } else if (studentsError) {
          console.error('Error fetching students:', studentsError);
          setStudents([]);
        }
      } else if (vanError) {
        console.error('Error fetching driver van:', vanError);
        setStudents([]);
        setVanData(null);
      } else {
        console.log('No active van assigned to driver:', user.id);
        setStudents([]);
        setVanData(null);
      }
    };

    fetchDriverData();
  }, [user?.id]);

  // Request location permission explicitly first
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        console.log('🔐 Requesting location permission...');
        console.log('Device info:', {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol
        });

        // Request permission explicitly
        const result = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Permission status:', result.state);

        if (result.state === 'denied') {
          setGpsStatus('permission-denied');
          toast({
            title: "Location Permission Denied",
            description: "Please enable location in your device settings and browser",
            variant: "destructive"
          });
          return;
        }

        // Try to get location once to trigger permission prompt
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Initial location obtained:', position.coords);
            toast({
              title: "GPS Ready",
              description: "Location tracking enabled successfully",
              className: "bg-success text-success-foreground"
            });
          },
          (error) => {
            console.error('❌ Initial location error:', error);
            toast({
              title: "Location Error",
              description: `Error code ${error.code}: ${error.message}`,
              variant: "destructive"
            });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } catch (error) {
        console.error('Permission check error:', error);
      }
    };

    requestLocationPermission();
  }, []);

  // Location tracking with watchPosition for continuous GPS
  useEffect(() => {
    console.log('📍 Location tracking effect triggered:', { tripActive, vanId });
    
    if (!vanId) {
      console.log('⚠️ No van assigned, cannot track location');
      return;
    }

    if (!navigator.geolocation) {
      console.error('❌ Geolocation is not supported by this browser');
      setGpsStatus('unavailable');
      toast({
        title: "GPS Not Available",
        description: "Your device doesn't support GPS tracking",
        variant: "destructive"
      });
      return;
    }

    let watchId: number;

    const startWatching = () => {
      console.log('🚐 Starting continuous GPS tracking for van:', vanId);
      console.log('📱 Device details:', {
        userAgent: navigator.userAgent,
        isMobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
        hasGeolocation: !!navigator.geolocation,
        protocol: window.location.protocol,
        isSecure: window.isSecureContext
      });
      
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
          const now = new Date();
          
          console.log('📍 GPS LOCATION RECEIVED:', { 
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            accuracy: Math.round(accuracy) + ' meters',
            altitude: altitude ? Math.round(altitude) + ' m' : 'N/A',
            heading: heading ? Math.round(heading) + '°' : 'N/A',
            speed: speed ? (speed * 3.6).toFixed(1) + ' km/h' : 'N/A',
            timestamp: now.toISOString(),
            tripActive
          });
          
          setGpsStatus('active');
          setLastLocationUpdate(now);
          
          // Show success toast only on first successful location
          if (gpsStatus !== 'active') {
            toast({
              title: "GPS Active",
              description: `Accuracy: ${Math.round(accuracy)}m`,
              className: "bg-success text-success-foreground"
            });
          }
          
          try {
            console.log('💾 Updating database with location...');
            const { error, data } = await supabase
              .from('vans')
              .update({
                current_lat: latitude,
                current_lng: longitude,
                last_location_update: now.toISOString(),
                status: 'active'
              })
              .eq('id', vanId)
              .select();
              
            if (error) {
              console.error('❌ Database update error:', error);
              toast({
                title: "Database Error",
                description: error.message,
                variant: "destructive"
              });
            } else {
              console.log('✅ Database updated successfully:', data);
            }
          } catch (dbError) {
            console.error('❌ Database operation exception:', dbError);
          }
        },
        (error) => {
          console.error('❌ GEOLOCATION ERROR:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.code === 1,
            POSITION_UNAVAILABLE: error.code === 2,
            TIMEOUT: error.code === 3,
            timestamp: new Date().toISOString()
          });
          
          let errorTitle = "GPS Error";
          let errorDescription = "Unknown error";
          
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              setGpsStatus('permission-denied');
              errorTitle = "Permission Denied";
              errorDescription = "Go to Settings → Privacy → Location Services and enable location for your browser";
              break;
            case 2: // POSITION_UNAVAILABLE
              setGpsStatus('unavailable');
              errorTitle = "GPS Unavailable";
              errorDescription = "Make sure GPS is enabled and you're outdoors with clear sky view";
              break;
            case 3: // TIMEOUT
              errorTitle = "GPS Timeout";
              errorDescription = "Location request timed out. Move to an area with better GPS signal";
              break;
          }
          
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    };

    startWatching();

    return () => {
      console.log('🛑 Stopping continuous GPS tracking');
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [vanId, tripActive]);

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

  const updateStudentStatus = async (studentId: string, field: "boarded" | "dropped") => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const newValue = !student[field];
    
    // Update in database
    const { error } = await supabase
      .from('students')
      .update({ [field]: newValue })
      .eq('id', studentId);
      
    if (error) {
      console.error('Error updating student status:', error);
      toast({
        title: "Update Failed",
        description: "Could not update student status",
        variant: "destructive"
      });
      return;
    }
    
    // Update local state
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: newValue }
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
          <p className="text-sm opacity-90">{vanData?.van_number || 'No Van Assigned'} • {vanData?.route_name || 'No Route'}</p>
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
              <p className="text-sm">{vanData?.route_name || 'No route assigned'}</p>
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
            {students.length > 0 ? (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">{student.pickup_stop} • {student.grade}</p>
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
              ))
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-muted-foreground">No students assigned to your van</p>
                <p className="text-xs text-muted-foreground">
                  Contact your school administrator if this seems incorrect
                </p>
                {vanData && (
                  <div className="bg-accent p-3 rounded-lg text-left">
                    <p className="text-xs font-medium mb-1">Your Van Info:</p>
                    <p className="text-xs text-muted-foreground">Van: {vanData.van_number}</p>
                    <p className="text-xs text-muted-foreground">Route: {vanData.route_name || 'No route assigned'}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPS Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">GPS Status</span>
                {gpsStatus === 'active' ? (
                  <Badge className="bg-success text-success-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-success-foreground rounded-full animate-pulse"></div>
                      Active
                    </div>
                  </Badge>
                ) : gpsStatus === 'permission-denied' ? (
                  <Badge variant="destructive">Permission Denied</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Unavailable
                  </Badge>
                )}
              </div>
              
              {lastLocationUpdate && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {lastLocationUpdate.toLocaleTimeString()}
                </p>
              )}
              
              {tripActive && gpsStatus === 'active' && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-success">🚐 Real-Time Tracking Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Parents can see your live location on the map
                  </p>
                </div>
              )}
              
              {gpsStatus !== 'active' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-destructive">⚠️ GPS Not Working</p>
                  <p className="text-xs text-muted-foreground">
                    {gpsStatus === 'permission-denied' 
                      ? 'Please enable location permissions in your browser settings'
                      : 'Please use a mobile device with GPS, ensure location services are enabled, and that your browser has HTTPS access'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password Section */}
        <Card>
          <CardContent className="pt-6">
            <ChangePasswordDialog />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;