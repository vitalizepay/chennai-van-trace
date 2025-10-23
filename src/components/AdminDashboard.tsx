import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bus, Users, MapPin, Settings, Bell, BarChart3, AlertTriangle, UserCog, LogOut, Shield, TrendingUp, Clock, MapPin as LocationIcon, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import EnhancedGoogleMap from "./EnhancedGoogleMap";
import ComprehensiveUserManager from "./ComprehensiveUserManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isCreateVanOpen, setIsCreateVanOpen] = useState(false);
  const [isManageDriverOpen, setIsManageDriverOpen] = useState(false);
  const [selectedVan, setSelectedVan] = useState<Van | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Array<{ id: string; name: string; currentVan: string | null }>>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [newVan, setNewVan] = useState({
    van_number: "",
    route_name: "",
    capacity: "30",
    current_lat: "11.0168",
    current_lng: "76.9558"
  });

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

  const fetchAvailableDrivers = async () => {
    if (!schoolData) return;

    try {
      // Get all driver user_ids for this school
      const { data: driverRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver')
        .eq('school_id', schoolData.id);

      if (rolesError) throw rolesError;

      if (!driverRoles || driverRoles.length === 0) {
        setAvailableDrivers([]);
        return;
      }

      // Get driver IDs
      const driverIds = driverRoles.map(r => r.user_id);

      // Fetch profiles for these drivers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', driverIds);

      if (profilesError) throw profilesError;

      // Get current van assignments
      const { data: vanAssignments, error: vansError } = await supabase
        .from('vans')
        .select('id, van_number, driver_id')
        .eq('school_id', schoolData.id);

      if (vansError) throw vansError;

      // Map drivers with their current van assignments
      const drivers = (profiles || []).map((profile: any) => {
        const assignedVan = (vanAssignments || []).find(v => v.driver_id === profile.user_id);
        return {
          id: profile.user_id,
          name: profile.full_name,
          currentVan: assignedVan ? assignedVan.van_number : null
        };
      });

      console.log('Available drivers:', drivers);
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive"
      });
    }
  };

  const handleManageDriver = (van: Van) => {
    setSelectedVan(van);
    setSelectedDriverId(van.driver_id || "");
    fetchAvailableDrivers();
    setIsManageDriverOpen(true);
  };

  const handleAssignDriver = async () => {
    if (!selectedVan) return;

    try {
      // If unassigning driver (empty selection)
      if (!selectedDriverId || selectedDriverId === "unassign") {
        const { error } = await supabase
          .from('vans')
          .update({ 
            driver_id: null,
            status: 'inactive'
          })
          .eq('id', selectedVan.id);

        if (error) throw error;

        // Also update driver_details to remove van assignment
        if (selectedVan.driver_id) {
          await supabase
            .from('driver_details')
            .update({ van_assigned: null })
            .eq('user_id', selectedVan.driver_id);
        }

        toast({
          title: "Driver Unassigned",
          description: `Driver removed from ${selectedVan.van_number}`,
        });
      } else {
        // Assigning a new driver
        
        // First, remove this driver from any other vans
        await supabase
          .from('vans')
          .update({ driver_id: null })
          .eq('driver_id', selectedDriverId);

        // Assign driver to the selected van
        const { error } = await supabase
          .from('vans')
          .update({ 
            driver_id: selectedDriverId,
            status: 'active'
          })
          .eq('id', selectedVan.id);

        if (error) throw error;

        // Update driver_details
        await supabase
          .from('driver_details')
          .update({ 
            van_assigned: selectedVan.van_number,
            route_assigned: selectedVan.route_name
          })
          .eq('user_id', selectedDriverId);

        toast({
          title: "Driver Assigned",
          description: `Driver successfully assigned to ${selectedVan.van_number}`,
          className: "bg-success text-success-foreground"
        });
      }

      setIsManageDriverOpen(false);
      setSelectedVan(null);
      setSelectedDriverId("");
      
      // Refresh van data
      fetchSchoolData();
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign driver",
        variant: "destructive"
      });
    }
  };

  const handleCreateVan = async () => {
    if (!schoolData) {
      toast({
        title: "Error",
        description: "No school assigned",
        variant: "destructive"
      });
      return;
    }

    if (!newVan.van_number || !newVan.route_name) {
      toast({
        title: "Error",
        description: "Van number and route name are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vans')
        .insert({
          van_number: newVan.van_number,
          route_name: newVan.route_name,
          capacity: parseInt(newVan.capacity),
          current_lat: parseFloat(newVan.current_lat),
          current_lng: parseFloat(newVan.current_lng),
          school_id: schoolData.id,
          status: 'active',
          current_students: 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Van created successfully",
        className: "bg-success text-success-foreground"
      });

      setIsCreateVanOpen(false);
      setNewVan({
        van_number: "",
        route_name: "",
        capacity: "30",
        current_lat: "11.0168",
        current_lng: "76.9558"
      });

      // Refresh van data
      fetchSchoolData();
    } catch (error: any) {
      console.error('Error creating van:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create van",
        variant: "destructive"
      });
    }
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
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="vans" className="gap-2">
              <Bus className="h-4 w-4" />
              Vehicles
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
              <MapPin className="h-4 w-4" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserCog className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-3">Loading dashboard...</p>
              </div>
            ) : !schoolData ? (
              <Card className="border-warning bg-warning/5">
                <CardContent className="pt-6 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-warning" />
                  <p className="font-medium mb-1">{t.schoolNotAssigned}</p>
                  <p className="text-sm text-muted-foreground">Contact super admin for school assignment</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Modern Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Total Students</p>
                          <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{totalStudents}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Active Drivers</p>
                          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{availableDrivers.length || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                          <UserCog className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Active Vans</p>
                          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{activeVansCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Bus className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">System running normally</p>
                        <p className="text-xs text-muted-foreground">{activeVansCount} vehicles active</p>
                      </div>
                      <span className="text-xs text-muted-foreground">Just now</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={handleSendNotification}>
                      <Bell className="h-5 w-5" />
                      <span className="text-xs">Send Notification</span>
                    </Button>
                    <Dialog open={isCreateVanOpen} onOpenChange={setIsCreateVanOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                          <Plus className="h-5 w-5" />
                          <span className="text-xs">Add Vehicle</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Van</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="van_number">Van Number *</Label>
                            <Input 
                              id="van_number"
                              placeholder="VAN-001"
                              value={newVan.van_number}
                              onChange={(e) => setNewVan({...newVan, van_number: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="route_name">Route Name *</Label>
                            <Input 
                              id="route_name"
                              placeholder="Route A"
                              value={newVan.route_name}
                              onChange={(e) => setNewVan({...newVan, route_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="capacity">Capacity</Label>
                            <Input 
                              id="capacity"
                              type="number"
                              placeholder="30"
                              value={newVan.capacity}
                              onChange={(e) => setNewVan({...newVan, capacity: e.target.value})}
                            />
                          </div>
                          <Button onClick={handleCreateVan} className="w-full">
                            Create Van
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="vans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Vehicle List</CardTitle>
                    {schoolData && (
                      <p className="text-sm text-muted-foreground">
                        Managing {vans.length} vehicles
                      </p>
                    )}
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => setIsCreateVanOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading vehicles...</p>
                  </div>
                ) : !schoolData ? (
                  <div className="text-center py-8">
                    <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t.schoolNotAssigned}</p>
                  </div>
                ) : vans.length === 0 ? (
                  <div className="text-center py-8">
                    <Bus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t.noVansAssigned}</p>
                  </div>
                ) : (
                  vans.map((van) => (
                    <Card key={van.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-base">{van.van_number}</h4>
                              <Badge variant={van.status === 'active' ? 'default' : 'secondary'}>
                                {van.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {van.route_name || "No route assigned"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground mb-1">Occupancy</p>
                            <p className="text-sm font-semibold">{van.current_students}/{van.capacity}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground mb-1">Driver</p>
                            <p className="text-sm font-semibold">{van.driver_id ? 'Assigned' : 'Not assigned'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleManageDriver(van)}
                            className="flex-1"
                          >
                            <UserCog className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewVanDetails(van)}
                            className="flex-1"
                          >
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Manage Driver Dialog */}
            <Dialog open={isManageDriverOpen} onOpenChange={setIsManageDriverOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Van Driver</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Assign or swap driver for {selectedVan?.van_number}
                  </p>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Current Route</Label>
                    <p className="text-sm font-medium mt-1">{selectedVan?.route_name || "No route"}</p>
                  </div>
                  <div>
                    <Label htmlFor="driver-select">Assign Driver</Label>
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger id="driver-select" className="mt-1">
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassign">
                          <span className="text-muted-foreground">Unassign driver</span>
                        </SelectItem>
                        {availableDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-2">
                              <span>{driver.name}</span>
                              {driver.currentVan && (
                                <Badge variant="secondary" className="text-xs">
                                  Currently: {driver.currentVan}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: Assigning a driver will remove them from their current van
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsManageDriverOpen(false);
                        setSelectedVan(null);
                        setSelectedDriverId("");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAssignDriver}
                      className="flex-1"
                    >
                      Assign Driver
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Live Tracking
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time location of all vehicles
                </p>
              </CardHeader>
              <CardContent>
                <EnhancedGoogleMap 
                  height="h-[500px]" 
                  className="rounded-lg" 
                  showAllVans={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <ComprehensiveUserManager language={language} />
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