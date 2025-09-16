import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Car, Users, Shield, Bus } from "lucide-react";
import ParentMobileAuth from "@/components/auth/ParentMobileAuth";
import DriverPasswordAuth from "@/components/auth/DriverPasswordAuth";
import SuperAdminAuth from "@/components/auth/SuperAdminAuth";
import SchoolAdminAuth from "@/components/auth/SchoolAdminAuth";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'parent' | 'driver' | 'school-admin'>('parent');
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center mb-2">
              <Car className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">School Van Tracker</CardTitle>
            <p className="text-sm text-muted-foreground">Choose your login method</p>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="parent" className="gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  Parent
                </TabsTrigger>
                <TabsTrigger value="driver" className="gap-1 text-xs">
                  <Bus className="h-3 w-3" />
                  Driver
                </TabsTrigger>
                <TabsTrigger value="school-admin" className="gap-1 text-xs">
                  <Shield className="h-3 w-3" />
                  School Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="parent" className="space-y-4">
                <div className="text-center space-y-2 mb-6">
                  <Badge variant="secondary" className="text-xs">
                    Mobile + Password
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Secure login with mobile number & password
                  </p>
                </div>
                <ParentMobileAuth onSuccess={handleAuthSuccess} />
              </TabsContent>

              <TabsContent value="driver" className="space-y-4">
                <div className="text-center space-y-2 mb-6">
                  <Badge variant="secondary" className="text-xs">
                    Mobile + Password
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Secure access for van drivers
                  </p>
                </div>
                <DriverPasswordAuth userType="driver" onSuccess={handleAuthSuccess} />
              </TabsContent>

              <TabsContent value="school-admin" className="space-y-4">
                <div className="text-center space-y-2 mb-6">
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    School Admin
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Administrative access for school management
                  </p>
                </div>
                <SchoolAdminAuth onSuccess={handleAuthSuccess} />
              </TabsContent>

            </Tabs>

            {/* Footer Links */}
            <div className="mt-6 pt-4 border-t space-y-3">
              <div className="text-center">
                <button 
                  className="text-primary hover:underline text-sm font-medium"
                  onClick={() => navigate('/admin-portal')}
                  type="button"
                >
                  Admin Portal →
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <button 
                  className="text-primary hover:underline" 
                  onClick={() => navigate('/privacy')}
                  type="button"
                >
                  Privacy Policy
                </button>
                {" "}and Terms of Service
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;