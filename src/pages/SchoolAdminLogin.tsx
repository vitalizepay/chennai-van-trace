import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, School } from "lucide-react";
import SchoolAdminAuth from "@/components/auth/SchoolAdminAuth";

const SchoolAdminLogin = () => {
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
              <School className="h-8 w-8 text-primary-foreground" />
            </div>
            <Badge variant="secondary" className="text-xs mx-auto">
              <Shield className="h-3 w-3 mr-1" />
              School Administrator
            </Badge>
            <CardTitle className="text-xl font-bold">Admin Login</CardTitle>
            <p className="text-sm text-muted-foreground">
              School administrative access
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <SchoolAdminAuth onSuccess={handleAuthSuccess} />
            
            <div className="pt-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mobile App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchoolAdminLogin;