import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, LogOut, Bus, Home, Bell, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SOSButton from "@/components/SOSButton";
import EnhancedGoogleMap from "@/components/EnhancedGoogleMap";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [activeTab, setActiveTab] = useState<"profile" | "map" | "notifications">("map");
  const [vanStatus, setVanStatus] = useState<"approaching" | "arrived" | "en_route">("en_route");
  const [eta, setETA] = useState("12 mins");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [vanData, setVanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proximityAlertSent, setProximityAlertSent] = useState(false);
  
  // Edit states
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [parentDetails, setParentDetails] = useState<any>(null);
  const [editedAddress, setEditedAddress] = useState("");
  const [editedPickupTime, setEditedPickupTime] = useState("");
  const [editedDropTime, setEditedDropTime] = useState("");

  // Fetch student and van data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      try {
        // Fetch parent details
        const { data: parentData, error: parentError } = await supabase
          .from('parent_details')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!parentError && parentData) {
          setParentDetails(parentData);
          setEditedAddress(parentData.address || "");
        }

        // Fetch students
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
          // Geocode pickup locations immediately if not already stored
          const studentsWithCoords = await Promise.all(
            students.map(async (student) => {
              if (!student.pickup_lat || !student.pickup_lng) {
                const coords = await geocodeAddress(student.pickup_stop + ', Coimbatore, Tamil Nadu');
                if (coords) {
                  // Update database with geocoded coordinates
                  await supabase
                    .from('students')
                    .update({ pickup_lat: coords.lat, pickup_lng: coords.lng })
                    .eq('id', student.id);
                  
                  return { ...student, pickup_lat: coords.lat, pickup_lng: coords.lng };
                }
              }
              return student;
            })
          );
          
          setStudentData(studentsWithCoords);
          
          if (studentsWithCoords[0].vans) {
            setVanData(studentsWithCoords[0].vans);
          }
        } else {
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

  const texts = {
    en: {
      title: "Parent Dashboard",
      childName: studentData.length > 0 ? studentData[0].full_name : "Loading...",
      vanNumber: vanData ? vanData.van_number : "VAN-001",
      currentStatus: "Current Status",
      estimatedArrival: "Estimated Arrival",
      liveTracking: "Live Van Tracking",
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
          
          toast({
            title: newNotification.title,
            description: newNotification.message,
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

  // Geocode address helper
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await supabase.functions.invoke('get-google-maps-key');
      const { apiKey } = response.data;
      
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.results && geocodeData.results.length > 0) {
        const location = geocodeData.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  // Real-time van status tracking
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

        // Build pickup points using stored coordinates
        const studentPickupPoints = studentData.map((student) => ({
          name: student.full_name,
          pickupStop: student.pickup_stop,
          lat: student.pickup_lat || 11.0168,
          lng: student.pickup_lng || 76.9558
        }));

        // Geocode parent address for school location if available
        let schoolLocation = { lat: 11.0168, lng: 76.9558 }; // Default Coimbatore
        if (parentDetails?.address) {
          const schoolCoords = await geocodeAddress(parentDetails.address);
          if (schoolCoords) {
            schoolLocation = schoolCoords;
          }
        }

        if (vanUpdates.current_lat && vanUpdates.current_lng) {
          const vanLocation = { 
            lat: Number(vanUpdates.current_lat), 
            lng: Number(vanUpdates.current_lng) 
          };
          
          console.log('Van Location:', vanLocation);
          console.log('Pickup Points:', studentPickupPoints);
          
          const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          };

          let minDistanceToPickup = Infinity;
          let nearestStudent = null;
          
          for (const pickup of studentPickupPoints) {
            const distance = calculateDistance(vanLocation.lat, vanLocation.lng, pickup.lat, pickup.lng);
            console.log(`Distance to ${pickup.pickupStop}: ${distance.toFixed(2)}km`);
            if (distance < minDistanceToPickup) {
              minDistanceToPickup = distance;
              nearestStudent = pickup;
            }
          }
          
          const distanceToSchool = calculateDistance(vanLocation.lat, vanLocation.lng, schoolLocation.lat, schoolLocation.lng);
          console.log(`Distance to school: ${distanceToSchool.toFixed(2)}km`);
          
          // Calculate more accurate ETA based on distance and average speed (30 km/h in city traffic)
          const averageSpeedKmh = 30;
          const etaMinutes = Math.max(1, Math.round((minDistanceToPickup / averageSpeedKmh) * 60));
          
          console.log(`Calculated ETA: ${etaMinutes} minutes for ${minDistanceToPickup.toFixed(2)}km`);
          
          // Proximity alert (within 2km and 10 minutes)
          if (minDistanceToPickup < 2 && etaMinutes <= 10 && !proximityAlertSent && vanStatus === "en_route") {
            setProximityAlertSent(true);
            const fullAddress = nearestStudent?.pickupStop || 'pickup point';
            createNotification(
              'proximity_alert',
              '🚐 Van Approaching Your Area',
              `${vanData.van_number} is ${minDistanceToPickup.toFixed(1)}km away from ${fullAddress}. Expected arrival in ${etaMinutes} minutes.`,
              { 
                eta: etaMinutes, 
                pickup_stop: fullAddress,
                distance_km: minDistanceToPickup.toFixed(1),
                van_location: vanLocation
              }
            );
          }

          // At pickup point (within 200 meters)
          if (minDistanceToPickup < 0.2) {
            if (vanStatus !== "approaching") {
              setVanStatus("approaching");
              const fullAddress = nearestStudent?.pickupStop || 'pickup point';
              createNotification(
                'arrival_pickup',
                '✅ Van Arrived at Pickup',
                `${vanData.van_number} has arrived at ${fullAddress}. Please send your child out.`,
                { 
                  pickup_stop: fullAddress,
                  arrival_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                }
              );
            }
            setETA("At pickup point");
          } 
          // Near school (within 1km)
          else if (distanceToSchool < 1.0 && distanceToSchool > 0.2) {
            if (vanStatus !== "arrived") {
              const schoolAddress = parentDetails?.address || 'school';
              const schoolETA = Math.round((distanceToSchool / averageSpeedKmh) * 60);
              createNotification(
                'approaching_school',
                '🏫 Approaching School',
                `${vanData.van_number} is ${distanceToSchool.toFixed(1)}km from ${schoolAddress}. Drop-off in approximately ${schoolETA} minutes.`,
                { 
                  location: schoolAddress,
                  distance_km: distanceToSchool.toFixed(1),
                  eta: schoolETA
                }
              );
              setVanStatus("arrived");
            }
            setETA(`${Math.round((distanceToSchool / averageSpeedKmh) * 60)} mins to school`);
          }
          // At school (within 200 meters)
          else if (distanceToSchool < 0.2) {
            if (vanStatus !== "arrived") {
              const schoolAddress = parentDetails?.address || 'school';
              createNotification(
                'arrival_school',
                '🎓 Arrived at School',
                `${vanData.van_number} has reached ${schoolAddress}. Your child will be dropped off shortly.`,
                { 
                  location: schoolAddress,
                  arrival_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                }
              );
              setVanStatus("arrived");
            }
            setETA("At school");
          } 
          // En route
          else {
            if (vanStatus !== "en_route") {
              setVanStatus("en_route");
              setProximityAlertSent(false);
            }
            setETA(`${etaMinutes} mins`);
          }
        }
      } catch (error) {
        console.error('Error tracking van status:', error);
      }
    };

    trackVanStatus();
    const interval = setInterval(trackVanStatus, 30000);
    return () => clearInterval(interval);
  }, [vanData, studentData, vanStatus, createNotification, proximityAlertSent]);

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

  // Save address
  const saveAddress = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('parent_details')
        .update({ address: editedAddress })
        .eq('user_id', user.id);

      if (error) throw error;

      setParentDetails({ ...parentDetails, address: editedAddress });
      setEditingAddress(false);
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
    }
  };

  // Save student times
  const saveStudentTimes = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ 
          pickup_time: editedPickupTime,
          drop_time: editedDropTime 
        })
        .eq('id', studentId);

      if (error) throw error;

      setStudentData(prev => prev.map(s => 
        s.id === studentId 
          ? { ...s, pickup_time: editedPickupTime, drop_time: editedDropTime }
          : s
      ));
      setEditingStudent(null);
      toast({
        title: "Success",
        description: "Pickup and drop times updated successfully",
      });
    } catch (error) {
      console.error('Error updating times:', error);
      toast({
        title: "Error",
        description: "Failed to update times",
        variant: "destructive",
      });
    }
  };

  const startEditingStudent = (studentId: string, pickupTime: string, dropTime: string) => {
    setEditingStudent(studentId);
    setEditedPickupTime(pickupTime || "");
    setEditedDropTime(dropTime || "");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-foreground text-background p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-background hover:bg-background/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {activeTab === "profile" ? "Profile" : activeTab === "map" ? "Tracking" : "Notifications"}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          className="text-background hover:bg-background/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="p-4 space-y-4 pb-20">
          {/* Parent Info Card */}
          <Card className="bg-foreground text-background border-0 overflow-hidden">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {user?.email?.substring(0, 2).toUpperCase() || "MP"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.email}</h3>
                    <p className="text-background/70 text-sm">{parentDetails?.emergency_contact || "+919876543210"}</p>
                  </div>
                </div>
                {!editingAddress ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-background/70 hover:bg-background/10"
                    onClick={() => setEditingAddress(true)}
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-background/70 hover:bg-background/10"
                      onClick={saveAddress}
                    >
                      <Save className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-background/70 hover:bg-background/10"
                      onClick={() => {
                        setEditingAddress(false);
                        setEditedAddress(parentDetails?.address || "");
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm pt-2">
                <p className="text-background/90 font-medium">Address</p>
                {editingAddress ? (
                  <Textarea
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    className="bg-background/10 text-background border-background/20 min-h-[80px]"
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="text-background/70">{parentDetails?.address || "No address set"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Children Details */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Children Details</h3>
            {studentData.length > 0 ? studentData.map((student) => (
              <Card key={student.id} className="mb-3 border border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        S
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{student.full_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {student.vans?.route_name || "Maharishi Vidya Mandir Sr Sec School"}
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Bus Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bus className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">Bus Details</span>
                      </div>
                      {editingStudent !== student.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => startEditingStudent(student.id, student.pickup_time, student.drop_time)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit Times
                        </Button>
                      )}
                    </div>
                    <div className="ml-6 space-y-1 text-xs text-muted-foreground">
                      <p>{student.vans?.van_number || "Not assigned"}</p>
                    </div>

                    {/* Pickup Details */}
                    <div className="flex items-center gap-2 text-muted-foreground mt-3">
                      <MapPin className="w-4 h-4 text-success" />
                      <span className="font-medium text-foreground">Pickup Details</span>
                    </div>
                    <div className="ml-6 space-y-1 text-xs text-muted-foreground">
                      <p>Mon, Tue, Wed, Thu, Fri, Sat</p>
                      <p>{student.pickup_stop}</p>
                      {editingStudent === student.id ? (
                        <Input
                          value={editedPickupTime}
                          onChange={(e) => setEditedPickupTime(e.target.value)}
                          placeholder="e.g., 06:30 AM - 07:41 AM"
                          className="h-8 text-xs"
                        />
                      ) : (
                        <p className="text-foreground font-medium">
                          {student.pickup_time || "06:30 AM - 07:41 AM"}
                        </p>
                      )}
                    </div>

                    {/* Drop Details */}
                    <div className="flex items-center gap-2 text-muted-foreground mt-3">
                      <MapPin className="w-4 h-4 text-emergency" />
                      <span className="font-medium text-foreground">Drop Details</span>
                    </div>
                    <div className="ml-6 space-y-1 text-xs text-muted-foreground">
                      <p>Mon, Tue, Wed, Thu, Fri, Sat</p>
                      <p>{student.pickup_stop}</p>
                      {editingStudent === student.id ? (
                        <Input
                          value={editedDropTime}
                          onChange={(e) => setEditedDropTime(e.target.value)}
                          placeholder="e.g., 10:30 AM - 12:00 PM"
                          className="h-8 text-xs"
                        />
                      ) : (
                        <p className="text-foreground font-medium">
                          {student.drop_time || "10:30 AM - 12:00 PM"}
                        </p>
                      )}
                    </div>

                    {editingStudent === student.id && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => saveStudentTimes(student.id)}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditingStudent(null)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* View Location Button */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-foreground/20 hover:bg-foreground hover:text-background"
                    onClick={() => setActiveTab("map")}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View Location
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No children registered
                </CardContent>
              </Card>
            )}
          </div>

          {/* Change Password Section */}
          <div className="pt-4">
            <ChangePasswordDialog />
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === "map" && (
        <div className="relative h-[calc(100vh-8rem)]">
          <div className="w-full h-full">
            <EnhancedGoogleMap 
              height="h-full"
              parentId={user?.id}
            />
          </div>

          {/* Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {studentData.length > 0 ? studentData[0].full_name : "Loading..."}
                  </h3>
                  <p className="text-xs text-muted-foreground">{vanData?.van_number}</p>
                </div>
              </div>
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-semibold">
                {eta}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">10:30 AM</span>
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: vanStatus === "arrived" ? "100%" : vanStatus === "approaching" ? "60%" : "30%" }}></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">11:17 AM</span>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-muted text-foreground hover:bg-muted/80"
              onClick={() => setActiveTab("notifications")}
            >
              Trip Notifications
            </Button>
          </div>

          {/* ETA Badge on Map */}
          {vanData && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <span className="text-sm font-semibold">ETA</span>
              <span className="text-xs">{eta}</span>
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="p-4 space-y-3 pb-20">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            <p className="text-xs text-muted-foreground">Know updates from NeoTrack</p>
          </div>
          
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className="border-0 shadow-sm"
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) + ' ' + new Date(notification.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {notification.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex justify-around items-center py-3 px-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 ${activeTab === "profile" ? "text-primary" : "text-muted-foreground"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex flex-col items-center gap-1 ${activeTab === "map" ? "text-primary" : "text-muted-foreground"}`}
          >
            <MapPin className="w-6 h-6" />
            <span className="text-xs font-medium">Map</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex flex-col items-center gap-1 relative ${activeTab === "notifications" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Bell className="w-6 h-6" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emergency rounded-full text-white text-xs flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
            <span className="text-xs font-medium">Alerts</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <SOSButton />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
