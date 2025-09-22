import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bus, Users, MapPin, Settings, Bell, BarChart3, AlertTriangle, UserCog, LogOut, Shield, TrendingUp, Clock, MapPin as LocationIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import EnhancedGoogleMap from "./EnhancedGoogleMap";
import UserManagement from "./UserManagement";

interface AdminDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

interface Van {
  id: string;
  van_number: string;
  driver_id: string | null;
  status: "active" | "inactive" | "maintenance";
  current_students: number;
  capacity: number;
  route_name: string | null;
  current_lat: number | null;
  current_lng: number | null;
  school_id: string;
}

interface SchoolData {
  id: string;
  name: string;
  location: string;
  total_students: number;
  total_vans: number;
}

interface Analytics {
  totalTrips: number;
  avgAttendance: number;
  onTimePerformance: number;
  maintenanceAlerts: number;
}

interface Alert {
  id: string;
  type: "sos" | "delay" | "maintenance";
  message: string;
  time: string;
  van: string;
}

const AdminDashboard = ({ language, onBack }: AdminDashboardProps) => {
  const { signOut, user } = useAuth();
  const [vans, setVans] = useState<Van[]>([]);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalTrips: 0,
    avgAttendance: 0,
    onTimePerformance: 0,
    maintenanceAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [alerts] = useState<Alert[]>([
    { id: "1", type: "sos", message: "SOS alert from Van", time: "2 mins ago", van: "Active Van" },
    { id: "2", type: "delay", message: "Route running 15 minutes late", time: "8 mins ago", van: "Route Van" },
    { id: "3", type: "maintenance", message: "Scheduled maintenance due", time: "1 hour ago", van: "Maintenance Van" },
  ]);

  const texts = {
    en: {
      title: "Admin Dashboard",
      overview: "Overview",
      vanManagement: "Van Management",
      alerts: "Alerts",
      reports: "Reports",
      activeVans: "Active Vans",
      totalStudents: "Total Students",
      activeRoutes: "Active Routes",
      pendingAlerts: "Pending Alerts",
      vanNumber: "Van Number",
      driver: "Driver",
      status: "Status",
      students: "Students",
      route: "Route",
      actions: "Actions",
      active: "Active",
      inactive: "Inactive",
      maintenance: "Maintenance",
      viewDetails: "View Details",
      sendNotification: "Send Notification",
      sos: "SOS Alert",
      delay: "Delay",
      totalTrips: "Total Trips",
      avgAttendance: "Avg Attendance",
      onTimePerformance: "On-Time Performance",
      maintenanceAlerts: "Maintenance Alerts",
      noVansAssigned: "No vans assigned to your school",
      schoolNotAssigned: "School not assigned",
      noAlerts: "No alerts at this time"
    },
    ta: {
      title: "நிர்வாக டாஷ்போர்டு",
      overview: "மேலோட்டம்",
      vanManagement: "வேன் மேலாண்மை",
      alerts: "எச்சரிக்கைகள்",
      reports: "அறிக்கைகள்",
      activeVans: "செயலில் உள்ள வேன்கள்",
      totalStudents: "மொத்த மாணவர்கள்",
      activeRoutes: "செயலில் உள்ள பாதைகள்",
      pendingAlerts: "நிலுவையில் உள்ள எச்சரிக்கைகள்",
      vanNumber: "வேன் எண்",
      driver: "ஓட்டுநர்",
      status: "நிலை",
      students: "மாணவர்கள்",
      route: "பாதை",
      actions: "செயல்கள்",
      active: "செயலில்",
      inactive: "செயலில் இல்லை",
      maintenance: "பராமரிப்பு",
      viewDetails: "விவரங்களைப் பார்க்கவும்",
      sendNotification: "அறிவிப்பு அனுப்பவும்",
      sos: "SOS எச்சரிக்கை",
      delay: "தாமதம்",
      totalTrips: "மொத்த பயணங்கள்",
      avgAttendance: "சராசரி வருகை",
      onTimePerformance: "சரியான நேர செயல்திறன்",
      maintenanceAlerts: "பராமரிப்பு எச்சரிக்கைகள்",
      noVansAssigned: "உங்கள் பள்ளிக்கு வேன்கள் ஒதுக்கப்படவில்லை",
      schoolNotAssigned: "பள்ளி ஒதுக்கப்படவில்லை",
      noAlerts: "இந்த நேரத்தில் எச்சரிக்கைகள் இல்லை"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchSchoolData();
  }, [user]);

  const fetchSchoolData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get admin's school assignment
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('school_id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData?.school_id) {
        setSchoolData(null);
        setVans([]);
        setLoading(false);
        return;
      }

      // Fetch school details
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', roleData.school_id)
        .single();

      if (schoolError) throw schoolError;
      setSchoolData(school);

      // Fetch vans for this school
      const { data: vansData, error: vansError } = await supabase
        .from('vans')
        .select(`
          id,
          van_number,
          driver_id,
          status,
          current_students,
          capacity,
          route_name,
          current_lat,
          current_lng,
          school_id
        `)
        .eq('school_id', roleData.school_id);

      if (vansError) throw vansError;
      // Type-cast and set vans data
      const typedVansData = (vansData || []).map(van => ({
        ...van,
        status: van.status as "active" | "inactive" | "maintenance"
      }));
      setVans(typedVansData);

      // Calculate analytics
      const totalVans = typedVansData.length;
      const activeVans = typedVansData.filter(v => v.status === 'active').length;
      const totalStudents = typedVansData.reduce((sum, van) => sum + (van.current_students || 0), 0);
      const totalCapacity = typedVansData.reduce((sum, van) => sum + (van.capacity || 0), 0);
      
      setAnalytics({
        totalTrips: activeVans * 2, // Assuming 2 trips per active van per day
        avgAttendance: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
        onTimePerformance: 85, // Mock data - would come from tracking
        maintenanceAlerts: typedVansData.filter(v => v.status === 'maintenance').length
      });

    } catch (error) {
      console.error('Error fetching school data:', error);
      toast({
        title: "Error",
        description: "Failed to load school data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "inactive": return "muted";
      case "maintenance": return "secondary";
      default: return "muted";
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "sos": return "emergency";
      case "delay": return "secondary";
      case "maintenance": return "muted";
      default: return "muted";
    }
  };

  const handleSendNotification = () => {
    toast({
      title: "Notification Sent",
      description: "Alert sent to all parents",
      className: "bg-success text-success-foreground"
    });
  };

  const handleViewVanDetails = (van: Van) => {
    toast({
      title: `Van Details: ${van.van_number}`,
      description: `Route: ${van.route_name || 'No route assigned'} | Students: ${van.current_students}/${van.capacity} | Status: ${van.status}`,
      className: "bg-primary text-primary-foreground"
    });
  };

  const activeVansCount = vans.filter(van => van.status === "active").length;
  const totalStudents = vans.reduce((sum, van) => sum + (van.current_students || 0), 0);
  const activeRoutes = new Set(vans.filter(van => van.status === "active" && van.route_name).map(van => van.route_name)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-admin text-admin-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-admin-foreground hover:bg-admin-light/20">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="text-sm opacity-90">
            {schoolData ? schoolData.name : "School Management System"}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-admin-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-admin-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </header>

      <div className="p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="vans" className="gap-2">
              <Bus className="h-4 w-4" />
              Vans
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserCog className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t.alerts}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.reports}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{activeVansCount}</div>
                    <p className="text-sm text-muted-foreground">{t.activeVans}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totalStudents}</div>
                    <p className="text-sm text-muted-foreground">{t.totalStudents}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{activeRoutes}</div>
                    <p className="text-sm text-muted-foreground">{t.activeRoutes}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emergency">{alerts.length}</div>
                    <p className="text-sm text-muted-foreground">{t.pendingAlerts}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2" onClick={handleSendNotification}>
                  <Bell className="h-4 w-4" />
                  {t.sendNotification}
                </Button>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Live Van Tracking Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EnhancedGoogleMap height="h-48" className="rounded-lg" />
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.vanManagement}</CardTitle>
                {schoolData && (
                  <p className="text-sm text-muted-foreground">
                    Managing {vans.length} vans for {schoolData.name}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading vans...</p>
                  </div>
                ) : !schoolData ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.schoolNotAssigned}</p>
                    <p className="text-xs">Please contact super admin to assign you to a school</p>
                  </div>
                ) : vans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.noVansAssigned}</p>
                  </div>
                ) : (
                  vans.map((van) => (
                    <div key={van.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{van.van_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {van.route_name || "No route assigned"} • Capacity: {van.capacity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`bg-${getStatusColor(van.status)} text-${getStatusColor(van.status)}-foreground`}>
                          {t[van.status as keyof typeof t] || van.status}
                        </Badge>
                        <span className="text-sm font-medium">{van.current_students}/{van.capacity} students</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewVanDetails(van)}
                        >
                          {t.viewDetails}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {/* Admin Role Info */}
            <Card className="bg-admin/5 border-admin/20 mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-admin" />
                  <h3 className="font-semibold text-admin">School Admin Role</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  As a school admin, you can create and manage parent and driver accounts for your school only.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">Super Admin</Badge>
                  <span>→</span>
                  <Badge className="bg-admin text-admin-foreground text-xs">School Admin (You)</Badge>
                  <span>→</span>
                  <Badge variant="outline" className="text-xs">Parents & Drivers</Badge>
                </div>
              </CardContent>
            </Card>
            <UserManagement language={language} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.alerts}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                      <AlertTriangle className={`h-4 w-4 text-${getAlertColor(alert.type)} mt-0.5`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time} • {alert.van}</p>
                      </div>
                      <Badge className={`bg-${getAlertColor(alert.type)} text-${getAlertColor(alert.type)}-foreground`}>
                        {alert.type === "sos" ? t.sos : alert.type === "delay" ? t.delay : t.maintenance}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t.noAlerts}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.reports}</CardTitle>
                {schoolData && (
                  <p className="text-sm text-muted-foreground">
                    Analytics for {schoolData.name}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading analytics...</p>
                  </div>
                ) : !schoolData ? (
                  <div className="bg-muted rounded-lg h-40 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">{t.schoolNotAssigned}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Analytics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-700">{analytics.totalTrips}</p>
                              <p className="text-xs text-blue-600">{t.totalTrips}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-700">{analytics.avgAttendance}%</p>
                              <p className="text-xs text-green-600">{t.avgAttendance}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                              <Clock className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-700">{analytics.onTimePerformance}%</p>
                              <p className="text-xs text-purple-600">{t.onTimePerformance}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-orange-700">{analytics.maintenanceAlerts}</p>
                              <p className="text-xs text-orange-600">{t.maintenanceAlerts}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Van Status Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Van Status Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Active Vans</span>
                            <span className="font-medium text-green-600">{activeVansCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Students</span>
                            <span className="font-medium">{totalStudents}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Active Routes</span>
                            <span className="font-medium text-blue-600">{activeRoutes}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;