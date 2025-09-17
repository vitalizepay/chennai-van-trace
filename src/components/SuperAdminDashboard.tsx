import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bus, Users, MapPin, Settings, Bell, BarChart3, AlertTriangle, UserCog, LogOut, School, Building, Eye, Plus, Search, TrendingUp, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedGoogleMap from "./EnhancedGoogleMap";
import SuperAdminUserManagement from "./SuperAdminUserManagement";
import SchoolManagement from "./SchoolManagement";
import { supabase } from "@/integrations/supabase/client";

interface Analytics {
  totalUsers: number;
  activeSchools: number;
  totalVans: number;
  totalStudents: number;
  recentActivity: Array<{
    user_name: string;
    action: string;
    created_at: string;
  }>;
  schoolStats: Array<{
    name: string;
    total_vans: number;
    current_students: number;
    total_capacity: number;
  }>;
}

interface SuperAdminDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

interface School {
  id: string;
  name: string;
  location: string;
  totalVans: number;
  activeVans: number;
  totalStudents: number;
  status: "active" | "inactive";
}

interface Van {
  id: string;
  number: string;
  driver: string;
  status: "active" | "inactive" | "maintenance";
  students: number;
  route: string;
  school: string;
  schoolId: string;
}

interface Alert {
  id: string;
  type: "sos" | "delay" | "maintenance";
  message: string;
  time: string;
  van: string;
  school: string;
}

const SuperAdminDashboard = ({ language, onBack }: SuperAdminDashboardProps) => {
  const { signOut } = useAuth();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    activeSchools: 0,
    totalVans: 0,
    totalStudents: 0,
    recentActivity: [],
    schoolStats: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;

      // Fetch vans with school information
      const { data: vansData, error: vansError } = await supabase
        .from('vans')
        .select(`
          id,
          van_number,
          route_name,
          current_students,
          capacity,
          status,
          school_id,
          schools!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (vansError) throw vansError;

      // Fetch user count
      const { count: userCount, error: userCountError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userCountError) throw userCountError;

      // Fetch recent activity (simplified without join)
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_logs')
        .select('action, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      // Get user names for activities
      const userIds = [...new Set(activityData?.map(a => a.user_id) || [])];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u.full_name]) || []);

      // Transform data
      const transformedSchools: School[] = (schoolsData || []).map(school => ({
        id: school.id,
        name: school.name,
        location: school.location,
        totalVans: school.total_vans,
        activeVans: vansData?.filter(v => v.school_id === school.id && v.status === 'active').length || 0,
        totalStudents: school.total_students,
        status: school.status as 'active' | 'inactive'
      }));

      const transformedVans: Van[] = (vansData || []).map(van => ({
        id: van.id,
        number: van.van_number,
        driver: 'Driver Name', // TODO: Join with driver details
        status: van.status as 'active' | 'inactive' | 'maintenance',
        students: van.current_students,
        route: van.route_name || 'No route assigned',
        school: van.schools.name,
        schoolId: van.school_id || ''
      }));

      // Calculate analytics
      const totalStudents = vansData?.reduce((sum, van) => sum + (van.current_students || 0), 0) || 0;
      const totalCapacity = vansData?.reduce((sum, van) => sum + (van.capacity || 0), 0) || 0;
      
      const schoolStats = schoolsData?.map(school => {
        const schoolVans = vansData?.filter(van => van.school_id === school.id) || [];
        const schoolStudents = schoolVans.reduce((sum, van) => sum + (van.current_students || 0), 0);
        const schoolCapacity = schoolVans.reduce((sum, van) => sum + (van.capacity || 0), 0);
        
        return {
          name: school.name,
          total_vans: schoolVans.length,
          current_students: schoolStudents,
          total_capacity: schoolCapacity
        };
      }) || [];

      const recentActivity = activityData?.slice(0, 5).map(activity => ({
        user_name: usersMap.get(activity.user_id) || 'Unknown User',
        action: activity.action,
        created_at: activity.created_at
      })) || [];

      setSchools(transformedSchools);
      setVans(transformedVans);
      setAnalytics({
        totalUsers: userCount || 0,
        activeSchools: schoolsData?.filter(s => s.status === 'active').length || 0,
        totalVans: vansData?.length || 0,
        totalStudents,
        recentActivity,
        schoolStats
      });
      
      // Set mock alerts for now
      setAlerts([
        { id: "1", type: "sos", message: "SOS alert detected", time: "2 mins ago", van: transformedVans[0]?.number || "N/A", school: transformedVans[0]?.school || "N/A" },
        { id: "2", type: "delay", message: "Route running late", time: "8 mins ago", van: transformedVans[1]?.number || "N/A", school: transformedVans[1]?.school || "N/A" },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    en: {
      title: "Super Admin Dashboard",
      overview: "Overview",
      schools: "Schools",
      vanManagement: "All Vans",
      alerts: "Alerts",
      reports: "Reports",
      totalSchools: "Total Schools",
      activeSchools: "Active Schools",
      totalVans: "Total Vans",
      activeVans: "Active Vans",
      totalStudents: "Total Students",
      pendingAlerts: "Pending Alerts",
      schoolName: "School Name",
      location: "Location",
      vans: "Vans",
      students: "Students",
      status: "Status",
      actions: "Actions",
      vanNumber: "Van Number",
      driver: "Driver",
      route: "Route",
      school: "School",
      active: "Active",
      inactive: "Inactive",
      maintenance: "Maintenance",
      viewDetails: "View Details",
      manageSchool: "Manage School",
      sendNotification: "Send Global Notification",
      sos: "SOS Alert",
      delay: "Delay",
      noAlerts: "No alerts at this time",
      systemOverview: "System Overview"
    },
    ta: {
      title: "சூப்பர் நிர்வாக டாஷ்போர்டு",
      overview: "மேலோட்டம்",
      schools: "பள்ளிகள்",
      vanManagement: "அனைத்து வேன்கள்",
      alerts: "எச்சரிக்கைகள்",
      reports: "அறிக்கைகள்",
      totalSchools: "மொத்த பள்ளிகள்",
      activeSchools: "செயலில் உள்ள பள்ளிகள்",
      totalVans: "மொத்த வேன்கள்",
      activeVans: "செயலில் உள்ள வேன்கள்",
      totalStudents: "மொத்த மாணவர்கள்",
      pendingAlerts: "நிலுவையில் உள்ள எச்சரிக்கைகள்",
      schoolName: "பள்ளி பெயர்",
      location: "இடம்",
      vans: "வேன்கள்",
      students: "மாணவர்கள்",
      status: "நிலை",
      actions: "செயல்கள்",
      vanNumber: "வேன் எண்",
      driver: "ஓட்டுநர்",
      route: "பாதை",
      school: "பள்ளி",
      active: "செயலில்",
      inactive: "செயலில் இல்லை",
      maintenance: "பராமரிப்பு",
      viewDetails: "விவரங்களைப் பார்க்கவும்",
      manageSchool: "பள்ளியை நிர்வகிக்கவும்",
      sendNotification: "உலகளாவிய அறிவிப்பு அனுப்பவும்",
      sos: "SOS எச்சரிக்கை",
      delay: "தாமதம்",
      noAlerts: "இந்த நேரத்தில் எச்சரிக்கைகள் இல்லை",
      systemOverview: "அமைப்பு மேலோட்டம்"
    }
  };

  const t = texts[language];

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

  const handleSendGlobalNotification = () => {
    toast({
      title: "Global Notification Sent",
      description: "Alert sent to all schools and parents",
      className: "bg-success text-success-foreground"
    });
  };

  const totalSchools = schools.length;
  const activeSchools = schools.filter(school => school.status === "active").length;
  const totalVansCount = vans.length;
  const activeVansCount = vans.filter(van => van.status === "active").length;
  const totalStudents = vans.reduce((sum, van) => sum + van.students, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground hover:bg-primary-light/20">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="text-sm opacity-90">Multi-School Management System</p>
        </div>
        <Badge className="bg-red-600 text-white">
          Super Admin
        </Badge>
        <Button variant="ghost" size="sm" className="text-primary-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-primary-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </header>

      <div className="p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="schools" className="gap-2">
              <Building className="h-4 w-4" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <UserCog className="h-4 w-4" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="vans" className="gap-2">
              <Bus className="h-4 w-4" />
              {t.vanManagement}
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
                    <div className="text-2xl font-bold text-primary">{totalSchools}</div>
                    <p className="text-sm text-muted-foreground">{t.totalSchools}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{activeSchools}</div>
                    <p className="text-sm text-muted-foreground">{t.activeSchools}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{activeVansCount}</div>
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
            </div>

            {/* System Overview Map */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t.systemOverview} - All Schools Live Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedGoogleMap height="h-64" className="rounded-lg" showAllVans={true} />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Button className="w-full gap-2" onClick={handleSendGlobalNotification}>
                    <Bell className="h-4 w-4" />
                    {t.sendNotification}
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools" className="space-y-4">
            <SchoolManagement language={language} />
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            <SuperAdminUserManagement language={language} />
          </TabsContent>

          <TabsContent value="vans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.vanManagement} - All Schools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vans.map((van) => (
                  <div key={van.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{van.number}</p>
                      <p className="text-sm text-muted-foreground">{van.driver} • {van.route}</p>
                      <p className="text-xs text-muted-foreground">{van.school}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`bg-${getStatusColor(van.status)} text-${getStatusColor(van.status)}-foreground`}>
                        {t[van.status as keyof typeof t] || van.status}
                      </Badge>
                      <span className="text-sm font-medium">{van.students} students</span>
                      <Button variant="outline" size="sm">
                        {t.viewDetails}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.alerts} - All Schools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                      <AlertTriangle className={`h-4 w-4 text-${getAlertColor(alert.type)} mt-0.5`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time} • {alert.van} • {alert.school}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Users */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Schools */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Schools</p>
                      <p className="text-2xl font-bold">{analytics.activeSchools}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Vans */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Vans</p>
                      <p className="text-2xl font-bold">{analytics.totalVans}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Students */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{analytics.totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.action === 'login' ? 'bg-green-500' : 
                            activity.action === 'logout' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{activity.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.action === 'login' ? 'Logged in' : 
                               activity.action === 'logout' ? 'Logged out' : 
                               activity.action}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* School Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  School Van Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.schoolStats.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.schoolStats.map((school, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{school.name}</span>
                          <span className="text-muted-foreground">
                            {school.current_students}/{school.total_capacity} students
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${school.total_capacity > 0 ? (school.current_students / school.total_capacity * 100) : 0}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{school.total_vans} vans</span>
                          <span>
                            {school.total_capacity > 0 ? 
                              Math.round(school.current_students / school.total_capacity * 100) : 0}% capacity
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No school data available</p>
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

export default SuperAdminDashboard;