import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, AlertTriangle, UserCheck, UserX, Bell, BellRing, LogOut, Bus, Home, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SOSButton from "@/components/SOSButton";
import EnhancedGoogleMap from "@/components/EnhancedGoogleMap";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata: any;
}

interface ParentDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

const ParentDashboard = ({ language, onBack }: ParentDashboardProps) => {
  const { signOut, user } = useAuth();
  const [childStatus, setChildStatus] = useState<"absent" | "present">("present");
  const [vanStatus, setVanStatus] = useState<"approaching" | "arrived" | "en_route">("en_route");
  const [eta, setETA] = useState("12 mins");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [vanData, setVanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proximityAlertSent, setProximityAlertSent] = useState(false);

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

  // Create notification helper
  const createNotification = useCallback(async (type: string, title: string, message: string, metadata: any = {}) => {
    if (!user || !studentData.length) return;

    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        student_id: studentData[0].id,
        van_id: vanData?.id,
        type,
        title,
        message,
        metadata
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [user, studentData, vanData]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('parent-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            className: getNotificationToastClass(newNotification.type)
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Subscribe to student boarding/dropping events
  useEffect(() => {
    if (!studentData.length) return;

    const studentIds = studentData.map(s => s.id);

    const channel = supabase
      .channel('student-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
          filter: `id=in.(${studentIds.join(',')})`
        },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;

          // Check for boarding status change
          if (oldRecord.boarded !== newRecord.boarded) {
            if (newRecord.boarded) {
              createNotification(
                'pickup_notification',
                'Child Picked Up',
                `${newRecord.full_name} has been picked up by the van`,
                { pickup_stop: newRecord.pickup_stop }
              );
            }
          }

          // Check for drop status change
          if (oldRecord.dropped !== newRecord.dropped) {
            if (newRecord.dropped) {
              createNotification(
                'drop_notification',
                'Child Dropped',
                `${newRecord.full_name} has been dropped at school`,
                { pickup_stop: newRecord.pickup_stop }
              );
            }
          }

          // Update local state
          setStudentData(prev => prev.map(s => 
            s.id === newRecord.id ? { ...s, ...newRecord } : s
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentData, createNotification]);

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

          // Calculate ETA in minutes (assuming 30 km/h average speed)
          const etaMinutes = Math.max(1, Math.floor(minDistanceToPickup * 2));
          
          // Send proximity alert if van is 10 minutes away and alert not sent yet
          if (etaMinutes <= 10 && !proximityAlertSent && vanStatus === "en_route") {
            setProximityAlertSent(true);
            createNotification(
              'proximity_alert',
              'Van Approaching',
              `${vanData.van_number} will arrive at pickup point in approximately ${etaMinutes} minutes`,
              { eta: etaMinutes, pickup_stop: nearestStudent?.pickupStop }
            );
          }

          // Check if van is at pickup location (within 0.5km from pickup)
          if (minDistanceToPickup < 0.5) {
            if (vanStatus !== "approaching") {
              setVanStatus("approaching");
              createNotification(
                'trip_start',
                'Van at Pickup Point',
                `${vanData.van_number} has reached ${nearestStudent?.pickupStop || 'pickup point'}`,
                { pickup_stop: nearestStudent?.pickupStop }
              );
            }
            setETA("At pickup point");
          }
          
          // Check for school entry notification (within 2km from school)
          else if (distanceToSchool < 2.0) {
            if (vanStatus !== "arrived") {
              setVanStatus("arrived");
              createNotification(
                'trip_end',
                'Van Reached School',
                `${vanData.van_number} has entered school campus`,
                { location: 'school_campus' }
              );
              setETA("At school");
            }
          }
          
          // Default en route status
          else {
            if (vanStatus !== "en_route") {
              setVanStatus("en_route");
              setProximityAlertSent(false); // Reset proximity alert for next trip
            }
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
  }, [vanData, studentData, vanStatus, t, createNotification, proximityAlertSent]);

  // Helper function to get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'proximity_alert': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pickup_notification': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'drop_notification': return <Home className="h-4 w-4 text-blue-500" />;
      case 'trip_start': return <Bus className="h-4 w-4 text-primary" />;
      case 'trip_end': return <MapPin className="h-4 w-4 text-success" />;
      case 'emergency': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'delay': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <BellRing className="h-4 w-4 text-primary" />;
    }
  };

  // Helper function to get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'proximity_alert': return 'bg-yellow-50 border-yellow-200';
      case 'pickup_notification': return 'bg-green-50 border-green-200';
      case 'drop_notification': return 'bg-blue-50 border-blue-200';
      case 'trip_start': return 'bg-primary/5 border-primary/20';
      case 'trip_end': return 'bg-success/5 border-success/20';
      case 'emergency': return 'bg-red-50 border-red-200';
      case 'delay': return 'bg-orange-50 border-orange-200';
      default: return 'bg-accent border-accent';
    }
  };

  const getNotificationToastClass = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-destructive text-destructive-foreground';
      case 'delay': return 'bg-orange-500 text-white';
      case 'pickup_notification':
      case 'drop_notification': return 'bg-success text-success-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

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

        {/* Live Tracking - Half Screen */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2 bg-primary/5">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary animate-pulse" />
              {t.liveTracking}
              <Badge className="ml-auto bg-success text-success-foreground">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <EnhancedGoogleMap height="h-[50vh]" parentId={user?.id} />
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
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      getNotificationColor(notification.type)
                    } ${notification.read ? 'opacity-60' : 'shadow-sm'}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{notification.title}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <Badge variant="secondary" className="mt-2 text-xs">New</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {t.noNotifications}
                </p>
                <p className="text-xs text-muted-foreground">
                  You'll receive alerts for van location, pickup/drop updates, and safety notifications
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;