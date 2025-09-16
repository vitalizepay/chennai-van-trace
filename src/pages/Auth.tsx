import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Car, Users, Bus } from "lucide-react";
import ParentMobileAuth from "@/components/auth/ParentMobileAuth";
import DriverPasswordAuth from "@/components/auth/DriverPasswordAuth";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'parent' | 'driver'>('parent');
  const navigate = useNavigate();

  console.log('Auth component rendered, activeTab:', activeTab);

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
            <p className="text-sm text-muted-foreground">Select your login type</p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex w-full bg-muted rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('parent')}
                  className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 px-3 rounded-md transition-all ${
                    activeTab === 'parent' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="h-3 w-3" />
                  Parent
                </button>
                <button
                  onClick={() => setActiveTab('driver')}
                  className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 px-3 rounded-md transition-all ${
                    activeTab === 'driver' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Bus className="h-3 w-3" />
                  Driver
                </button>
              </div>

              {activeTab === 'parent' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2 mb-6">
                    <Badge variant="secondary" className="text-xs">
                      Mobile + Password
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Secure login with mobile number & password
                    </p>
                  </div>
                  <ParentMobileAuth onSuccess={handleAuthSuccess} />
                </div>
              )}

              {activeTab === 'driver' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2 mb-6">
                    <Badge variant="secondary" className="text-xs">
                      Mobile + Password
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Secure access for van drivers
                    </p>
                  </div>
                  <DriverPasswordAuth userType="driver" onSuccess={handleAuthSuccess} />
                </div>
              )}
            </div>

            {/* Footer Links */}
            <div className="mt-6 pt-4 border-t space-y-3">
              <div className="text-center">
                <button 
                  className="text-primary hover:underline text-xs"
                  onClick={() => navigate('/school-admin')}
                  type="button"
                >
                  Admin Login
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