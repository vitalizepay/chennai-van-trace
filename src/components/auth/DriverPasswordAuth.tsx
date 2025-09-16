import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";

interface DriverPasswordAuthProps {
  userType: 'driver' | 'admin';
  onSuccess: () => void;
}

const DriverPasswordAuth = ({ userType, onSuccess }: DriverPasswordAuthProps) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signInWithMobilePassword } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobile.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both mobile number and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signInWithMobilePassword(mobile, password);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login Successful!",
        description: `Welcome ${userType === 'driver' ? 'Driver' : 'Admin'}!`,
      });
      onSuccess();
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile"
              type="tel"
              placeholder="+91 98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing In..." : `Login as ${userType === 'driver' ? 'Driver' : 'Admin'}`}
      </Button>

      <div className="text-center space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => {
            toast({
              title: "Contact Admin",
              description: "Please contact your administrator to reset your password",
            });
          }}
        >
          Forgot Password?
        </Button>
        
        <p className="text-xs text-muted-foreground">
          {userType === 'driver' 
            ? "Driver accounts are managed by school administration"
            : "Admin accounts have additional security requirements"
          }
        </p>
      </div>
    </form>
  );
};

export default DriverPasswordAuth;