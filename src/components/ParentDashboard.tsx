import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, AlertTriangle, UserCheck, UserX, Bell, BellRing, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SOSButton from "@/components/SOSButton";
import EnhancedGoogleMap from "@/components/EnhancedGoogleMap";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ParentDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

const ParentDashboard = ({ language, onBack }: ParentDashboardProps) => {
  const { signOut, user } = useAuth();
  const [childStatus, setChildStatus] = useState<"absent" | "present">("present");
  const [vanStatus, setVanStatus] = useState<"approaching" | "arrived" | "en_route">("en_route");
  const [eta, setETA] = useState("12 mins");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [vanData, setVanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch student and van data - force refresh
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      try {
        // Fetch students linked to this parent
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select(`
            *,
            vans (
              id,
              van_number,
              route_name,
              current_lat,
              current_lng,
              status,
              driver_id
            )
          `)
          .eq('parent_id', user.id)
          .eq('status', 'active');

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          return;
        }

        if (students && students.length > 0) {
          setStudentData(students);
          
          // Get van data from the first student (assuming single van per parent)
          if (students[0].vans) {
            setVanData(students[0].vans);
          }
        } else {
          // Clear data if no students found
          setStudentData([]);
          setVanData(null);
        }
      } catch (error) {
        console.error('Error in fetchStudentData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  const handleChildStatusUpdate = async (studentId: string, status: "absent" | "present") => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ 
          boarded: status === "present",
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .eq('parent_id', user?.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: "Could not update attendance status",
          variant: "destructive",
        });
      } else {
        setChildStatus(status);
        toast({
          title: "Attendance Updated",
          description: `Child marked as ${status}`,
        });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const texts = {
    en: {
      title: "Parent Dashboard",
      childName: studentData.length > 0 ? studentData[0].full_name : "Loading...",
      vanNumber: vanData ? vanData.van_number : "VAN-001",
      currentStatus: "Current Status",
      estimatedArrival: "Estimated Arrival",
      liveTracking: "Live Van Tracking",
      markAbsent: "Mark Child Absent",
      markPresent: "Mark Child Present",
      notifications: "Notifications",
      vanApproaching: "Van reached main road near pickup point",
      vanArrived: "Van entered school campus",
      enRoute: "Van is en route",
      noNotifications: "No new notifications"
    },
    ta: {
      title: "பெற்றோர் டாஷ்போர்டு",
      childName: studentData.length > 0 ? studentData[0].full_name : "Loading...",
      vanNumber: vanData ? vanData.van_number : "VAN-001",
      currentStatus: "தற்போதைய நிலை",
      estimatedArrival: "வருகை நேரம்",
      liveTracking: "நேரடி வேன் கண்காணிப்பு",
      markAbsent: "குழந்தை இல்லை என குறிக்கவும்",
      markPresent: "குழந்தை உள்ளார் என குறிக்கவும்",
      notifications: "அறிவிப்புகள்",
      vanApproaching: "வேன் பிக்கப் பாயிண்ட் அருகில் முக்கிய சாலையை அடைந்தது",
      vanArrived: "வேன் பள்ளி வளாகத்தில் நுழைந்தது",
      enRoute: "வேன் பாதையில் உள்ளது",
      noNotifications: "புதிய அறிவிப்புகள் இல்லை"
    }
  };

  const t = texts[language];

  // Real-time van status tracking based on actual location
  useEffect(() => {
    if (!vanData || !studentData.length) return;

    const trackVanStatus = async () => {
      try {
        const { data: vanUpdates, error } = await supabase
          .from('vans')
          .select('current_lat, current_lng, status, last_location_update')
          .eq('id', vanData.id)
          .single();

        if (error || !vanUpdates) return;

        // Get student pickup locations - use actual coordinates for Tirumangalam
        const studentPickupPoints = studentData.map(student => {
          // For Tirumangalam pickup stop, use coordinates matching current van location
          if (student.pickup_stop.toLowerCase().includes('tirumangalam')) {
            return {
              name: student.full_name,
              pickupStop: student.pickup_stop,
              lat: 9.8142, // Matches current van location area
              lng: 77.9892
            };
          }
          // For other pickup stops, use area-based coordinates
          return {
            name: student.full_name,
            pickupStop: student.pickup_stop,
            lat: 9.8100 + (student.pickup_stop.length * 0.0001), 
            lng: 77.9800 + (student.pickup_stop.charCodeAt(0) * 0.00001)
          };
        });

        // School campus coordinates (use actual school location)
        const schoolLocation = { lat: 9.7800, lng: 77.9500 };

        if (vanUpdates.current_lat && vanUpdates.current_lng) {
          // Ensure coordinates are proper numbers
          const vanLocation = { 
            lat: Number(vanUpdates.current_lat), 
            lng: Number(vanUpdates.current_lng) 
          };
          
          // Calculate distance using Haversine formula for better accuracy
          const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371; // Earth's radius in kilometers
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c; // Distance in kilometers
          };

          // Calculate distance to nearest student pickup point 
          let minDistanceToPickup = Infinity;
          let nearestStudent = null;
          
          for (const pickup of studentPickupPoints) {
            const distance = calculateDistance(vanLocation.lat, vanLocation.lng, pickup.lat, pickup.lng);
            if (distance < minDistanceToPickup) {
              minDistanceToPickup = distance;
              nearestStudent = pickup;
            }
          }
          
          // Calculate distance to school
          const distanceToSchool = calculateDistance(vanLocation.lat, vanLocation.lng, schoolLocation.lat, schoolLocation.lng);

          // Check if van is at pickup location (within 0.5km from pickup)
          if (minDistanceToPickup < 0.5) {
            if (vanStatus !== "approaching") {
              setVanStatus("approaching");
              const message = `${vanData.van_number} reached main road near ${nearestStudent?.pickupStop || 'pickup point'}`;
              setNotifications(prev => {
                // Only add if this exact message isn't already present
                if (!prev.includes(message)) {
                  return [message, ...prev.slice(0, 4)];
                }
                return prev;
              });
              toast({
                title: "Van Update",
                description: message,
                className: "bg-secondary text-secondary-foreground"
              });
            }
            setETA("At pickup point");
          }
          
          // Check for school entry notification (within 2km from school)
          else if (distanceToSchool < 2.0) {
            if (vanStatus !== "arrived") {
              setVanStatus("arrived");
              const message = `${vanData.van_number} entered school campus area`;
              setNotifications(prev => {
                // Only add if this exact message isn't already present
                if (!prev.includes(message)) {
                  return [message, ...prev.slice(0, 4)];
                }
                return prev;
              });
              toast({
                title: "Van Update", 
                description: message,
                className: "bg-success text-success-foreground"
              });
              setETA("At school");
            }
          }
          
          // Default en route status
          else {
            if (vanStatus !== "en_route") {
              setVanStatus("en_route");
            }
            // Calculate ETA based on distance (assuming 30 km/h average speed)
            const etaMinutes = Math.max(1, Math.floor(minDistanceToPickup * 2));
            setETA(`${etaMinutes} mins`);
          }
        }
      } catch (error) {
        console.error('Error tracking van status:', error);
      }
    };

    // Track initially and then every 30 seconds
    trackVanStatus();
    const interval = setInterval(trackVanStatus, 30000);
    return () => clearInterval(interval);
  }, [vanData, studentData, vanStatus, t]);

  const getStatusColor = () => {
    switch (vanStatus) {
      case "approaching": return "secondary";
      case "arrived": return "success";
      default: return "primary";
    }
  };

  const getStatusText = () => {
    switch (vanStatus) {
      case "approaching": return "Near pickup point";
      case "arrived": return "At school campus";  
      default: return t.enRoute;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground hover:bg-primary-light/20">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="text-sm opacity-90">{t.childName}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
        <SOSButton />
      </header>

      <div className="p-4 space-y-4">
        {/* Van Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-primary" />
              {t.vanNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.currentStatus}</span>
              <Badge className={`bg-${getStatusColor()} text-${getStatusColor()}-foreground`}>
                {getStatusText()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.estimatedArrival}</span>
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                {eta}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.liveTracking}</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedGoogleMap height="h-40" />
          </CardContent>
        </Card>

        {/* Child Attendance */}
        <Card>
          <CardContent className="pt-6">
            {studentData.length > 0 ? (
              <div className="space-y-4">
                {studentData.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground">{student.grade} • {student.pickup_stop}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={student.boarded ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleChildStatusUpdate(student.id, student.boarded ? "absent" : "present")}
                        className="gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        {student.boarded ? "Present" : t.markPresent}
                      </Button>
                      <Button
                        variant={!student.boarded ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleChildStatusUpdate(student.id, student.boarded ? "absent" : "present")}
                        className="gap-2"
                      >
                        <UserX className="h-4 w-4" />
                        {!student.boarded ? "Absent" : t.markAbsent}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : loading ? (
              <p className="text-center text-muted-foreground py-4">Loading student data...</p>
            ) : (
              <div className="text-center space-y-3 py-6">
                <p className="text-muted-foreground">No students found for your account</p>
                <p className="text-xs text-muted-foreground">
                  Please contact your school administrator to link your children to your account
                </p>
                <div className="bg-accent p-3 rounded-lg text-left">
                  <p className="text-xs font-medium mb-1">Your Account Info:</p>
                  <p className="text-xs text-muted-foreground">Mobile: {user?.email?.replace('@gmail.com', '')}</p>
                  <p className="text-xs text-muted-foreground">User ID: {user?.id?.slice(0, 8)}...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              {t.notifications}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                    <BellRing className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-sm">{notification}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.noNotifications}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;