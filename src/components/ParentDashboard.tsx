import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, AlertTriangle, UserCheck, UserX, Bell, BellRing, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SOSButton from "@/components/SOSButton";
import EnhancedGoogleMap from "@/components/EnhancedGoogleMap";
import { toast } from "@/hooks/use-toast";

interface ParentDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

const ParentDashboard = ({ language, onBack }: ParentDashboardProps) => {
  const { signOut } = useAuth();
  const [childStatus, setChildStatus] = useState<"absent" | "present">("present");
  const [vanStatus, setVanStatus] = useState<"approaching" | "arrived" | "en_route">("en_route");
  const [eta, setETA] = useState("12 mins");
  const [notifications, setNotifications] = useState<string[]>([]);

  const texts = {
    en: {
      title: "Parent Dashboard",
      childName: "Aarav Kumar",
      vanNumber: "VAN-001",
      currentStatus: "Current Status",
      estimatedArrival: "Estimated Arrival",
      liveTracking: "Live Van Tracking",
      markAbsent: "Mark Child Absent",
      markPresent: "Mark Child Present",
      notifications: "Notifications",
      vanApproaching: "Van approaching your stop",
      vanArrived: "Van has arrived at your stop",
      enRoute: "Van is en route",
      noNotifications: "No new notifications"
    },
    ta: {
      title: "பெற்றோர் டாஷ்போர்டு",
      childName: "ஆரவ் குமார்",
      vanNumber: "VAN-001",
      currentStatus: "தற்போதைய நிலை",
      estimatedArrival: "வருகை நேரம்",
      liveTracking: "நேரடி வேன் கண்காணிப்பு",
      markAbsent: "குழந்தை இல்லை என குறிக்கவும்",
      markPresent: "குழந்தை உள்ளார் என குறிக்கவும்",
      notifications: "அறிவிப்புகள்",
      vanApproaching: "வேன் உங்கள் நிறுத்தத்தை நெருங்குகிறது",
      vanArrived: "வேன் உங்கள் நிறுத்தத்தை அடைந்துள்ளது",
      enRoute: "வேன் பாதையில் உள்ளது",
      noNotifications: "புதிய அறிவிப்புகள் இல்லை"
    }
  };

  const t = texts[language];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses = ["approaching", "arrived", "en_route"] as const;
      const currentIndex = statuses.indexOf(vanStatus);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      
      if (nextStatus === "approaching") {
        setNotifications(prev => [t.vanApproaching, ...prev.slice(0, 4)]);
        toast({
          title: "Van Update",
          description: t.vanApproaching,
          className: "bg-secondary text-secondary-foreground"
        });
      } else if (nextStatus === "arrived") {
        setNotifications(prev => [t.vanArrived, ...prev.slice(0, 4)]);
        toast({
          title: "Van Update", 
          description: t.vanArrived,
          className: "bg-success text-success-foreground"
        });
      }
      
      setVanStatus(nextStatus);
      setETA(nextStatus === "arrived" ? "Now" : `${Math.floor(Math.random() * 15) + 5} mins`);
    }, 8000);

    return () => clearInterval(interval);
  }, [vanStatus, t]);

  const getStatusColor = () => {
    switch (vanStatus) {
      case "approaching": return "secondary";
      case "arrived": return "success";
      default: return "primary";
    }
  };

  const getStatusText = () => {
    switch (vanStatus) {
      case "approaching": return t.vanApproaching;
      case "arrived": return t.vanArrived;
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

        {/* Live Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.liveTracking}</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedGoogleMap height="h-40" />
          </CardContent>
        </Card>

        {/* Child Attendance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">Child Attendance Today</span>
              <div className="flex gap-2">
                <Button
                  variant={childStatus === "present" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChildStatus("present")}
                  className="gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  {childStatus === "present" ? "Present" : t.markPresent}
                </Button>
                <Button
                  variant={childStatus === "absent" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setChildStatus("absent")}
                  className="gap-2"
                >
                  <UserX className="h-4 w-4" />
                  {childStatus === "absent" ? "Absent" : t.markAbsent}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              {t.notifications}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                    <BellRing className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-sm">{notification}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.noNotifications}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;