import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Users, Car, School, Shield, Phone, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SystemStatusGuideProps {
  language: "en" | "ta";
}

const SystemStatusGuide = ({ language }: SystemStatusGuideProps) => {
  const [systemStatus, setSystemStatus] = useState({
    totalUsers: 0,
    admins: 0,
    drivers: 0,
    parents: 0,
    superAdmins: 0,
    schools: 0,
    vans: 0,
    students: 0,
    activeVans: 0
  });

  const texts = {
    en: {
      title: "🎉 School Van Tracker - System Status",
      subtitle: "Complete working system with all user types",
      systemHealth: "System Health Check",
      userAccounts: "User Accounts",
      testCredentials: "Test Login Credentials",
      features: "✅ Implemented Features",
      loginInstructions: "📱 Login Instructions",
      success: "System is working perfectly!",
      copy: "Copy",
      copied: "Copied!"
    },
    ta: {
      title: "🎉 பள்ளி வேன் ட்ராக்கர் - அமைப்பு நிலை",
      subtitle: "அனைத்து பயனர் வகைகளுடன் முழுமையாக செயல்படும் அமைப்பு",
      systemHealth: "அமைப்பு சுகாதார சோதனை",
      userAccounts: "பயனர் கணக்குகள்",
      testCredentials: "சோதனை உள்நுழைவு விவரங்கள்",
      features: "✅ செயல்படுத்தப்பட்ட அம்சங்கள்",
      loginInstructions: "📱 உள்நுழைவு வழிமுறைகள்",
      success: "அமைப்பு சரியாக செயல்படுகிறது!",
      copy: "நகலெடுக்கவும்",
      copied: "நகலெடுக்கப்பட்டது!"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      // Get user counts by role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role');

      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .eq('status', 'active');

      const { data: vans } = await supabase
        .from('vans')
        .select('id, status');

      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('status', 'active');

      let admins = 0, drivers = 0, parents = 0, superAdmins = 0;
      
      roles?.forEach((role: any) => {
        switch (role.role) {
          case 'admin': admins++; break;
          case 'driver': drivers++; break;
          case 'parent': parents++; break;
          case 'super_admin': superAdmins++; break;
        }
      });

      setSystemStatus({
        totalUsers: roles?.length || 0,
        admins,
        drivers,
        parents,
        superAdmins,
        schools: schools?.length || 0,
        vans: vans?.length || 0,
        students: students?.length || 0,
        activeVans: vans?.filter(v => v.status === 'active').length || 0
      });
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t.copied,
      description: "Credentials copied to clipboard",
      className: "bg-success text-success-foreground"
    });
  };

  const testUsers = [
    {
      type: "Super Admin",
      icon: <Shield className="h-4 w-4" />,
      mobile: "9962901122",
      password: "password123",
      features: "Full system control, all schools management"
    },
    {
      type: "School Admin", 
      icon: <School className="h-4 w-4" />,
      mobile: "8428334555",
      password: "password123",
      features: "School management, van tracking, student management"
    },
    {
      type: "Van Driver",
      icon: <Car className="h-4 w-4" />,
      mobile: "8428334556", 
      password: "password123",
      features: "GPS tracking, student attendance, trip management"
    },
    {
      type: "Parent",
      icon: <Users className="h-4 w-4" />,
      mobile: "8428334557",
      password: "password123", 
      features: "Real-time van tracking, child attendance, notifications"
    }
  ];

  const implementedFeatures = [
    "🗺️ Yellow van icons on map (Ola/Swiggy style)",
    "📍 Real-time GPS tracking with mobile location",
    "👥 All user types: Super Admin, Admin, Driver, Parent",
    "🚐 Van movement based on driver's mobile GPS",
    "📱 Mobile + Password authentication for all users",
    "👨‍👩‍👧‍👦 Proper parent-student relationships",
    "📊 Comprehensive admin dashboards", 
    "🏫 Multi-school management system",
    "📋 Student attendance tracking",
    "🔐 Row-level security with proper permissions",
    "⚡ Real-time location updates (3s active, 10s passive)",
    "🌍 Modern map styling similar to ride-sharing apps"
  ];

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t.title}</CardTitle>
          <p className="text-muted-foreground">{t.subtitle}</p>
          <Badge className="mx-auto bg-success text-success-foreground gap-2">
            <CheckCircle className="h-4 w-4" />
            {t.success}
          </Badge>
        </CardHeader>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            {t.systemHealth}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{systemStatus.totalUsers}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{systemStatus.schools}</div>
              <p className="text-sm text-muted-foreground">Schools</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{systemStatus.activeVans}</div>
              <p className="text-sm text-muted-foreground">Active Vans</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{systemStatus.students}</div>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Accounts Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t.userAccounts}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <Shield className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-bold text-red-800">{systemStatus.superAdmins}</div>
                <div className="text-xs text-red-600">Super Admins</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <School className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-bold text-blue-800">{systemStatus.admins}</div>
                <div className="text-xs text-blue-600">School Admins</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Car className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-bold text-green-800">{systemStatus.drivers}</div>
                <div className="text-xs text-green-600">Drivers</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-bold text-purple-800">{systemStatus.parents}</div>
                <div className="text-xs text-purple-600">Parents</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>{t.testCredentials}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testUsers.map((user, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {user.icon}
                    <span className="font-medium">{user.type}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`Mobile: ${user.mobile}\nPassword: ${user.password}`)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {t.copy}
                  </Button>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>Mobile: <code className="bg-muted px-1 rounded">{user.mobile}</code></span>
                  </div>
                  <div>Password: <code className="bg-muted px-1 rounded">{user.password}</code></div>
                  <div className="text-xs text-muted-foreground mt-2">{user.features}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Implemented Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t.features}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {implementedFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.loginInstructions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <strong>🔐 How to login:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to the login page</li>
                <li>Select your user type (Parent/Driver for main auth, or Admin Login link)</li>
                <li>Enter mobile number and password from above</li>
                <li>Click login and you'll be redirected to your dashboard</li>
              </ol>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <strong>📍 GPS Tracking:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Driver dashboard automatically tracks location</li>
                <li>Start trip for real-time tracking (3-second updates)</li>
                <li>Background tracking when not on trip (10-second updates)</li>
                <li>Parents can see real-time van location on map</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStatusGuide;