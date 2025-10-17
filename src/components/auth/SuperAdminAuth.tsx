import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Phone, Shield, Loader2 } from "lucide-react";

interface SuperAdminAuthProps {
  onSuccess: () => void;
}

const SuperAdminAuth = ({ onSuccess }: SuperAdminAuthProps) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInWithMobilePassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobile || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both mobile number and password",
        variant: "destructive",
      });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('=== SUPER ADMIN LOGIN DEBUG ===');
      console.log('Mobile:', mobile);
      console.log('Password length:', password.length);
      console.log('Attempting login...');
      
      const { error } = await signInWithMobilePassword(mobile, password, 'super_admin');
      
      console.log('Login result:', { error });
      console.log('Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        details: error
      });
      
      if (error) {
        console.error('❌ Login error:', error);
        
        toast({
          title: "Login Failed",
          description: error.message || "Database error querying schema",
          variant: "destructive",
        });
      } else {
        console.log('✅ Login successful');
        toast({
          title: "Login Successful",
          description: "Welcome back, Super Admin!",
        });
        onSuccess();
      }
    } catch (err: any) {
      console.error('❌ Unexpected login error:', err);
      console.error('Error stack:', err?.stack);
      toast({
        title: "Login Error",
        description: err?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Please contact your system administrator for password reset assistance.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className="pl-10"
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={handleForgotPassword}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Forgot Password?
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center mt-4">
        <p>VitalizePay Super Admin access</p>
      </div>
    </div>
  );
};

export default SuperAdminAuth;