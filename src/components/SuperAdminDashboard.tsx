import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bus, Users, MapPin, Settings, Bell, BarChart3, AlertTriangle, UserCog, LogOut, School, Building } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import GoogleMap from "./GoogleMap";
import UserManagement from "./UserManagement";

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
  
  const [schools] = useState<School[]>([
    { id: "1", name: "St. Mary's High School", location: "Chennai Central", totalVans: 4, activeVans: 3, totalStudents: 150, status: "active" },
    { id: "2", name: "Gandhi Memorial School", location: "T. Nagar", totalVans: 6, activeVans: 5, totalStudents: 220, status: "active" },
    { id: "3", name: "Modern Public School", location: "Anna Nagar", totalVans: 3, activeVans: 2, totalStudents: 90, status: "active" },
    { id: "4", name: "Sacred Heart School", location: "Velachery", totalVans: 5, activeVans: 4, totalStudents: 180, status: "inactive" },
  ]);

  const [vans] = useState<Van[]>([
    { id: "1", number: "SMH-001", driver: "Raj Kumar", status: "active", students: 24, route: "Route A", school: "St. Mary's High School", schoolId: "1" },
    { id: "2", number: "SMH-002", driver: "Priya Singh", status: "active", students: 18, route: "Route B", school: "St. Mary's High School", schoolId: "1" },
    { id: "3", number: "GMS-001", driver: "Kumar Das", status: "active", students: 32, route: "Route C", school: "Gandhi Memorial School", schoolId: "2" },
    { id: "4", number: "GMS-002", driver: "Meera Patel", status: "maintenance", students: 0, route: "Route D", school: "Gandhi Memorial School", schoolId: "2" },
    { id: "5", number: "MPS-001", driver: "Suresh K", status: "active", students: 22, route: "Route E", school: "Modern Public School", schoolId: "3" },
    { id: "6", number: "SHS-001", driver: "Lakshmi R", status: "inactive", students: 0, route: "Route F", school: "Sacred Heart School", schoolId: "4" },
  ]);

  const [alerts] = useState<Alert[]>([
    { id: "1", type: "sos", message: "SOS alert from SMH-001", time: "2 mins ago", van: "SMH-001", school: "St. Mary's High School" },
    { id: "2", type: "delay", message: "Route C running 15 minutes late", time: "8 mins ago", van: "GMS-001", school: "Gandhi Memorial School" },
    { id: "3", type: "maintenance", message: "Scheduled maintenance due", time: "1 hour ago", van: "GMS-002", school: "Gandhi Memorial School" },
  ]);

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="schools" className="gap-2">
              <School className="h-4 w-4" />
              {t.schools}
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
                <GoogleMap height="h-64" className="rounded-lg" />
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.schools}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {schools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <School className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-muted-foreground">{school.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">{school.activeVans}/{school.totalVans}</p>
                        <p className="text-xs text-muted-foreground">{t.vans}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{school.totalStudents}</p>
                        <p className="text-xs text-muted-foreground">{t.students}</p>
                      </div>
                      <Badge className={`bg-${getStatusColor(school.status)} text-${getStatusColor(school.status)}-foreground`}>
                        {t[school.status as keyof typeof t] || school.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {t.manageSchool}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.reports} - System Wide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg h-40 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">System Analytics Dashboard</p>
                    <p className="text-xs">Multi-school reports, attendance analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;