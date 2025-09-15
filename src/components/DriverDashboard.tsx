import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Play, Square, Users, MapPin, UserCheck, UserX } from "lucide-react";
import SOSButton from "@/components/SOSButton";
import { toast } from "@/hooks/use-toast";

interface DriverDashboardProps {
  language: "en" | "ta";
  onBack: () => void;
}

interface Student {
  id: string;
  name: string;
  stop: string;
  boarded: boolean;
  dropped: boolean;
}

const DriverDashboard = ({ language, onBack }: DriverDashboardProps) => {
  const [tripActive, setTripActive] = useState(false);
  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "Aarav Kumar", stop: "Anna Nagar", boarded: false, dropped: false },
    { id: "2", name: "Priya Sharma", stop: "T. Nagar", boarded: false, dropped: false },
    { id: "3", name: "Karthik Raja", stop: "Velachery", boarded: false, dropped: false },
    { id: "4", name: "Sneha Patel", stop: "Adyar", boarded: false, dropped: false },
  ]);

  const texts = {
    en: {
      title: "Driver Dashboard",
      driverName: "Raj Kumar",
      vanNumber: "TN 07 AB 1234",
      startTrip: "Start Trip",
      stopTrip: "Stop Trip",
      tripStatus: "Trip Status",
      active: "Active",
      inactive: "Inactive",
      studentAttendance: "Student Attendance",
      currentRoute: "Current Route",
      boarded: "Boarded",
      dropped: "Dropped",
      pending: "Pending",
      routeStops: "Route: Anna Nagar → T.Nagar → Velachery → Adyar → School"
    },
    ta: {
      title: "ஓட்டுநர் டாஷ்போர்டு",
      driverName: "ராஜ் குமார்",
      vanNumber: "TN 07 AB 1234",
      startTrip: "பயணம் தொடங்கு",
      stopTrip: "பயணம் நிறுத்து",
      tripStatus: "பயண நிலை",
      active: "செயலில்",
      inactive: "செயலில் இல்லை",
      studentAttendance: "மாணவர் வருகை",
      currentRoute: "தற்போதைய பாதை",
      boarded: "ஏறினார்",
      dropped: "இறக்கினார்",
      pending: "நிலுவை",
      routeStops: "பாதை: அண்ணா நகர் → டி.நகர் → வேளச்சேரி → அடையார் → பள்ளி"
    }
  };

  const t = texts[language];

  const handleTripToggle = () => {
    setTripActive(!tripActive);
    if (!tripActive) {
      toast({
        title: "Trip Started",
        description: "GPS tracking is now active",
        className: "bg-success text-success-foreground"
      });
    } else {
      toast({
        title: "Trip Ended",
        description: "GPS tracking stopped",
        className: "bg-muted text-muted-foreground"
      });
      // Reset all students
      setStudents(prev => prev.map(student => ({ ...student, boarded: false, dropped: false })));
    }
  };

  const updateStudentStatus = (studentId: string, field: "boarded" | "dropped") => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: !student[field] }
        : student
    ));
  };

  const getStudentStatusBadge = (student: Student) => {
    if (student.dropped) return <Badge className="bg-success text-success-foreground">{t.dropped}</Badge>;
    if (student.boarded) return <Badge className="bg-primary text-primary-foreground">{t.boarded}</Badge>;
    return <Badge variant="outline">{t.pending}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-driver text-driver-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-driver-foreground hover:bg-driver-light/20">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t.title}</h1>
          <p className="text-sm opacity-90">{t.driverName} • {t.vanNumber}</p>
        </div>
        <SOSButton />
      </header>

      <div className="p-4 space-y-4">
        {/* Trip Control */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t.tripStatus}</p>
                <Badge className={tripActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                  {tripActive ? t.active : t.inactive}
                </Badge>
              </div>
              <Button
                onClick={handleTripToggle}
                className={`gap-2 ${
                  tripActive 
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                    : "bg-success hover:bg-success/90 text-success-foreground"
                }`}
                size="lg"
              >
                {tripActive ? (
                  <>
                    <Square className="h-5 w-5" />
                    {t.stopTrip}
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    {t.startTrip}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Route */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-driver" />
              {t.currentRoute}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">{t.routeStops}</p>
            </div>
          </CardContent>
        </Card>

        {/* Student Attendance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-driver" />
              {t.studentAttendance}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.stop}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStudentStatusBadge(student)}
                  <div className="flex gap-2">
                    <Button
                      variant={student.boarded ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStudentStatus(student.id, "boarded")}
                      disabled={!tripActive}
                      className="gap-1"
                    >
                      <UserCheck className="h-3 w-3" />
                      Board
                    </Button>
                    <Button
                      variant={student.dropped ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStudentStatus(student.id, "dropped")}
                      disabled={!tripActive || !student.boarded}
                      className="gap-1"
                    >
                      <UserX className="h-3 w-3" />
                      Drop
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trip Summary */}
        {tripActive && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="h-3 w-3 bg-success rounded-full mx-auto animate-pulse"></div>
                <p className="text-sm font-medium">GPS Tracking Active</p>
                <p className="text-xs text-muted-foreground">
                  Parents can see your live location
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;