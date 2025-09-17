import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, Users, Shield, MapPin, Bell, Languages } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ParentDashboard from "@/components/ParentDashboard";
import DriverDashboard from "@/components/DriverDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";
import ForcePasswordChange from "@/components/auth/ForcePasswordChange";

type UserRole = "parent" | "driver" | "admin" | "super_admin" | null;

const Index = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const { user, loading, userRole, needsPasswordChange } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center animate-pulse">
            <Bus className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show appropriate dashboard based on their role
  if (user && userRole) {
    // Check if user needs to change password from temp password
    if (needsPasswordChange) {
      return <ForcePasswordChange onSuccess={() => window.location.reload()} />;
    }

    return (
      <div className="min-h-screen bg-background">
        {userRole === "parent" && <ParentDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {userRole === "driver" && <DriverDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {userRole === "admin" && <AdminDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {userRole === "super_admin" && <SuperAdminDashboard language={language} onBack={() => setCurrentRole(null)} />}
      </div>
    );
  }

  // If user is authenticated but no role determined, show role selection
  if (user && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  const texts = {
    en: {
      title: "School Van Tracker",
      subtitle: "Safe, Smart School Transportation",
      parent: "Parent",
      driver: "Driver", 
      admin: "Admin",
      parentDesc: "Track your child's van in real-time",
      driverDesc: "Manage your route and student attendance",
      adminDesc: "Oversee all vans and routes",
      email: "Email",
      password: "Password",
      login: "Login",
      poweredBy: "Powered by Vitalizepay"
    },
    ta: {
      title: "பள்ளி வேன் டிராக்கர்",
      subtitle: "பள்ளிகளுக்கு பாதுகாப்பான, ஸ்மார்ட் போக்குவரத்து",
      parent: "பெற்றோர்",
      driver: "ஓட்டுநர்",
      admin: "நிர்வாகி",
      parentDesc: "உங்கள் குழந்தையின் வேனை நேரடியாக கண்காணிக்கவும்",
      driverDesc: "உங்கள் பாதை மற்றும் மாணவர் வருகையை நிர்வகிக்கவும்",
      adminDesc: "அனைத்து வேன்கள் மற்றும் பாதைகளை மேற்பார்வையிடுங்கள்",
      email: "மின்னஞ்சல்",
      password: "கடவுச்சொல்",
      login: "உள்நுழைய",
      poweredBy: "Vitalizepay ஆல் இயக்கப்படுகிறது"
    }
  };

  const t = texts[language];

  // Show login interface only if user is not authenticated
  if (currentRole) {
    return (
      <div className="min-h-screen bg-background">
        {currentRole === "parent" && <ParentDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {currentRole === "driver" && <DriverDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {currentRole === "admin" && <AdminDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {currentRole === "super_admin" && <SuperAdminDashboard language={language} onBack={() => setCurrentRole(null)} />}
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--gradient-primary)' }}
    >
      {/* Status Bar Area */}
      <div className="h-6 bg-black/10" />
      
      {/* Header */}
      <header className="flex justify-between items-center p-4 pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleLanguage} 
          className="text-white hover:bg-white/20 gap-2"
        >
          <Languages className="h-4 w-4" />
          {language === "en" ? "தமிழ்" : "English"}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="max-w-sm mx-auto w-full space-y-8">
          
          {/* School Logo Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full border-4 border-white/30 flex items-center justify-center shadow-lg">
                <Bus className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white text-center leading-tight">
                {t.title.toUpperCase()}
              </h1>
            </div>
          </div>

          {/* Role Selection */}
          <Tabs defaultValue="parent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20">
              <TabsTrigger 
                value="parent" 
                className="gap-2 data-[state=active]:bg-white data-[state=active]:text-primary text-white/80"
              >
                <Users className="h-4 w-4" />
                {t.parent}
              </TabsTrigger>
              <TabsTrigger 
                value="driver" 
                className="gap-2 data-[state=active]:bg-white data-[state=active]:text-primary text-white/80"
              >
                <Bus className="h-4 w-4" />
                {t.driver}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="parent">
              <RoleCard
                role="parent"
                title={t.parent}
                description={t.parentDesc}
                icon={<Users className="h-6 w-6" />}
                color="primary"
                onLogin={setCurrentRole}
                texts={t}
              />
            </TabsContent>

            <TabsContent value="driver">
              <RoleCard
                role="driver"
                title={t.driver}
                description={t.driverDesc}
                icon={<Bus className="h-6 w-6" />}
                color="driver"
                onLogin={setCurrentRole}
                texts={t}
              />
            </TabsContent>
          </Tabs>

          {/* Admin Login Link */}
          <div className="text-center pt-4">
            <button 
              className="text-white/70 hover:text-white text-xs underline"
              onClick={() => window.location.href = '/school-admin'}
              type="button"
            >
              Admin Login
            </button>
          </div>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-white/70 text-xs">{t.poweredBy}</p>
            <div className="flex justify-center items-center gap-1">
              <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">V</span>
              </div>
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
            </div>
            <p className="text-white/60 text-xs font-semibold">VITALIZEPAY</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "primary" | "driver" | "admin";
  onLogin: (role: UserRole) => void;
  texts: any;
}

const RoleCard = ({ role, title, description, icon, color, onLogin, texts }: RoleCardProps) => {
  return (
    <Card className="mt-4 bg-white/95 backdrop-blur-sm border-white/30 shadow-xl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white mb-3 shadow-lg">
          {icon}
        </div>
        <CardTitle className="text-xl font-bold text-primary">{title}</CardTitle>
        <CardDescription className="text-foreground/70 font-medium">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <Input 
            id={`${role}-email`} 
            type="text" 
            placeholder="User Name"
            className="h-12 text-base border-2 border-gray-200 rounded-lg focus:border-primary"
          />
        </div>
        <div className="space-y-3">
          <Input 
            id={`${role}-password`} 
            type="password" 
            placeholder="Password"
            className="h-12 text-base border-2 border-gray-200 rounded-lg focus:border-primary"
          />
        </div>
        
        <div className="space-y-4 pt-2">
          <button 
            className="w-full h-12 text-white font-bold text-base rounded-lg shadow-lg"
            style={{ background: 'var(--gradient-button)' }}
            onClick={() => window.location.href = '/auth'}
          >
            {texts.login}
          </button>

          <div className="space-y-3 text-center">
            <button className="text-primary font-semibold text-sm">
              Forgot Password?
            </button>
            <div className="flex items-center gap-2 justify-center">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-gray-600">Remember me</span>
            </div>
            <button className="text-primary font-semibold text-sm">
              Forgot Username?
            </button>
          </div>

          <button 
            className="text-red-500 font-semibold text-sm w-full"
            onClick={() => window.open('/privacy', '_blank')}
            type="button"
          >
            Privacy Policy
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Index;