import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, Users, Shield, MapPin, Bell, Languages } from "lucide-react";
import ParentDashboard from "@/components/ParentDashboard";
import DriverDashboard from "@/components/DriverDashboard";
import AdminDashboard from "@/components/AdminDashboard";

type UserRole = "parent" | "driver" | "admin" | null;

const Index = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [language, setLanguage] = useState<"en" | "ta">("en");

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  const texts = {
    en: {
      title: "School Van Tracker",
      subtitle: "Safe, Smart School Transportation for Tamil Nadu",
      parent: "Parent",
      driver: "Driver", 
      admin: "Admin",
      parentDesc: "Track your child's van in real-time",
      driverDesc: "Manage your route and student attendance",
      adminDesc: "Oversee all vans and routes",
      email: "Email",
      password: "Password",
      login: "Login",
      demoLogin: "Continue as Demo",
      poweredBy: "Powered by Tamil Nadu Schools"
    },
    ta: {
      title: "பள்ளி வேன் டிராக்கர்",
      subtitle: "தமிழ்நாடு பள்ளிகளுக்கு பாதுகாப்பான, ஸ்மார்ட் போக்குவரத்து",
      parent: "பெற்றோர்",
      driver: "ஓட்டுநர்",
      admin: "நிர்வாகி",
      parentDesc: "உங்கள் குழந்தையின் வேனை நேரடியாக கண்காணிக்கவும்",
      driverDesc: "உங்கள் பாதை மற்றும் மாணவர் வருகையை நிர்வகிக்கவும்",
      adminDesc: "அனைத்து வேன்கள் மற்றும் பாதைகளை மேற்பார்வையிடுங்கள்",
      email: "மின்னஞ்சல்",
      password: "கடவுச்சொல்",
      login: "உள்நுழைய",
      demoLogin: "டெமோவாக தொடரவும்",
      poweredBy: "தமிழ்நாடு பள்ளிகளால் இயக்கப்படுகிறது"
    }
  };

  const t = texts[language];

  if (currentRole) {
    return (
      <div className="min-h-screen bg-background">
        {currentRole === "parent" && <ParentDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {currentRole === "driver" && <DriverDashboard language={language} onBack={() => setCurrentRole(null)} />}
        {currentRole === "admin" && <AdminDashboard language={language} onBack={() => setCurrentRole(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <Bus className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">{t.title}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-2">
          <Languages className="h-4 w-4" />
          {language === "en" ? "தமிழ்" : "English"}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-8">
        <div className="max-w-md mx-auto w-full space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="relative">
                <Bus className="h-20 w-20 text-primary" />
                <MapPin className="h-6 w-6 text-secondary absolute -top-1 -right-1 bg-background rounded-full p-1" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t.subtitle}</h2>
          </div>

          {/* Role Selection */}
          <Tabs defaultValue="parent" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="parent" className="gap-2">
                <Users className="h-4 w-4" />
                {t.parent}
              </TabsTrigger>
              <TabsTrigger value="driver" className="gap-2">
                <Bus className="h-4 w-4" />
                {t.driver}
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="h-4 w-4" />
                {t.admin}
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

            <TabsContent value="admin">
              <RoleCard
                role="admin"
                title={t.admin}
                description={t.adminDesc}
                icon={<Shield className="h-6 w-6" />}
                color="admin"
                onLogin={setCurrentRole}
                texts={t}
              />
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>{t.poweredBy}</p>
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
    <Card className="mt-4">
      <CardHeader className="text-center pb-3">
        <div className={`mx-auto w-12 h-12 rounded-full bg-${color}/10 flex items-center justify-center text-${color} mb-2`}>
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${role}-email`}>{texts.email}</Label>
          <Input id={`${role}-email`} type="email" placeholder="name@school.edu" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${role}-password`}>{texts.password}</Label>
          <Input id={`${role}-password`} type="password" />
        </div>
        <div className="space-y-2">
          <Button 
            className={`w-full bg-${color} hover:bg-${color}/90 text-${color}-foreground`}
            disabled
          >
            {texts.login}
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => onLogin(role)}
          >
            {texts.demoLogin}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Index;