import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Phone, Loader2 } from "lucide-react";

interface ParentMobileAuthProps {
  onSuccess: () => void;
}

const ParentMobileAuth = ({ onSuccess }: ParentMobileAuthProps) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInWithMobilePassword } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
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
      const { error } = await signInWithMobilePassword(mobile, password);
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid mobile number or password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome Back!",
          description: "Successfully logged in to School Van Tracker",
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Please contact your school administrator for password reset assistance.",
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Mobile Input */}
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

        {/* Password Input */}
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

        {/* Login Button */}
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

      {/* Forgot Password Link */}
      <div className="text-center">
        <Button
          variant="link"
          onClick={handleForgotPassword}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Forgot Password?
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
        <p>Enter your mobile number and password to login</p>
        <p>Contact your school administrator if you need help accessing your account</p>
      </div>
    </div>
  );
};

export default ParentMobileAuth;