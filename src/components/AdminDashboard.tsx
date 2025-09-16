import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bus, Users, MapPin, Settings, Bell, BarChart3, AlertTriangle, UserCog, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import GoogleMap from "./GoogleMap";
import UserManagement from "./UserManagement";

interface AdminDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

interface Van {
  id: string;
  number: string;
  driver: string;
  status: "active" | "inactive" | "maintenance";
  students: number;
  route: string;
}

interface Alert {
  id: string;
  type: "sos" | "delay" | "maintenance";
  message: string;
  time: string;
  van: string;
}

const AdminDashboard = ({ language, onBack }: AdminDashboardProps) => {
  const { signOut } = useAuth();
  const [vans] = useState<Van[]>([
    { id: "1", number: "VAN-001", driver: "Raj Kumar", status: "active", students: 24, route: "Route A" },
    { id: "2", number: "VAN-002", driver: "Priya Singh", status: "active", students: 18, route: "Route B" },
    { id: "3", number: "VAN-003", driver: "Kumar Das", status: "inactive", students: 0, route: "Route C" },
    { id: "4", number: "VAN-004", driver: "Meera Patel", status: "maintenance", students: 0, route: "Route D" },
  ]);

  const [alerts] = useState<Alert[]>([
    { id: "1", type: "sos", message: "SOS alert from VAN-001", time: "2 mins ago", van: "VAN-001" },
    { id: "2", type: "delay", message: "Route B running 15 minutes late", time: "8 mins ago", van: "VAN-002" },
    { id: "3", type: "maintenance", message: "Scheduled maintenance due", time: "1 hour ago", van: "VAN-004" },
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
      noAlerts: "இந்த நேரத்தில் எச்சரிக்கைகள் இல்லை"
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

  const handleSendNotification = () => {
    toast({
      title: "Notification Sent",
      description: "Alert sent to all parents",
      className: "bg-success text-success-foreground"
    });
  };

  const activeVansCount = vans.filter(van => van.status === "active").length;
  const totalStudents = vans.reduce((sum, van) => sum + van.students, 0);
  const activeRoutes = new Set(vans.filter(van => van.status === "active").map(van => van.route)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-admin text-admin-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-admin-foreground hover:bg-admin-light/20">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="text-sm opacity-90">School Management System</p>
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
                    <GoogleMap height="h-48" className="rounded-lg" />
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.vanManagement}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vans.map((van) => (
                  <div key={van.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{van.number}</p>
                      <p className="text-sm text-muted-foreground">{van.driver} • {van.route}</p>
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

          <TabsContent value="users" className="space-y-4">
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
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg h-40 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Analytics Dashboard</p>
                    <p className="text-xs">Trip history, attendance reports</p>
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

export default AdminDashboard;