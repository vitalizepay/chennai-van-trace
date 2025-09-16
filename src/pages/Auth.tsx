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

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'parent' | 'driver' | 'admin'>('parent');
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
                <TabsTrigger value="parent" className="gap-2">
                  <Users className="h-4 w-4" />
                  Parent
                </TabsTrigger>
                <TabsTrigger value="driver" className="gap-2">
                  <Bus className="h-4 w-4" />
                  Driver
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
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

              <TabsContent value="admin" className="space-y-4">
                <div className="text-center space-y-2 mb-6">
                  <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 border-red-200">
                    <Shield className="h-3 w-3 mr-1" />
                    VitalizePay Super Admin + 2FA
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Highest security access with mobile + password + TOTP
                  </p>
                </div>
                <SuperAdminAuth onSuccess={handleAuthSuccess} />
              </TabsContent>
            </Tabs>

            {/* Footer Links */}
            <div className="mt-6 pt-4 border-t">
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