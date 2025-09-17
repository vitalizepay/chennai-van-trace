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
  const { signInWithMobilePassword, resetPassword, getUserByMobile } = useAuth();

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
      const { error } = await signInWithMobilePassword(mobile, password, 'parent');
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

  const handleForgotPassword = async () => {
    console.log('🔄 Parent handleForgotPassword called, mobile:', mobile);
    if (!mobile?.trim()) {
      console.log('❌ No mobile number provided');
      toast({
        title: "Enter Mobile Number",
        description: "Please enter your mobile number first to reset password",
        variant: "destructive",
      });
      return;
    }

    // Clean mobile number - remove +91 prefix if present and validate
    const cleanMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '');
    console.log('🔧 Cleaned mobile number:', cleanMobile);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      console.log('❌ Invalid mobile number format');
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number starting with 6-9",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('📞 Calling resetPassword with cleaned mobile:', cleanMobile);
      const result = await resetPassword(cleanMobile);
      console.log('📋 Parent resetPassword result:', result);
      if (result.success && result.tempPassword) {
        console.log('✅ Password reset successful, showing toast');
        toast({
          title: "Password Reset Successful",
          description: `Your temporary password is: ${result.tempPassword}. Please use this to login and change your password.`,
          duration: 15000,
          action: (
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(result.tempPassword);
                toast({ title: "Copied!", description: "Password copied to clipboard" });
              }}
            >
              Copy
            </Button>
          ),
        });
      } else {
        console.log('❌ Password reset failed:', result.error);
        toast({
          title: "Reset Failed", 
          description: result.error || "Could not reset password. Please check your mobile number.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 handleForgotPassword error:', error);
      toast({
        title: "Reset Error",
        description: "An unexpected error occurred while resetting password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Mobile Input */}
        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number (Username)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile"
              type="tel"
              placeholder="Your 10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className="pl-10"
              maxLength={10}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">Your mobile number is your username</p>
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

      <div className="text-center space-y-2">
        <Button
          type="button"
          variant="link"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleForgotPassword();
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
          disabled={loading}
        >
          Forgot Password?
        </Button>
        
          <Button
            type="button"
            variant="link"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔄 Parent Forgot Username clicked, mobile:', mobile);
              if (!mobile?.trim()) {
                console.log('❌ No mobile number provided for username lookup');
                toast({
                  title: "Enter Mobile Number", 
                  description: "Please enter your mobile number first",
                  variant: "destructive",
                });
                return;
              }

              // Clean mobile number
              const cleanMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '');
              console.log('🔧 Cleaned mobile for username lookup:', cleanMobile);
              if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
                console.log('❌ Invalid mobile number for username lookup');
                toast({
                  title: "Invalid Mobile Number",
                  description: "Please enter a valid 10-digit mobile number starting with 6-9",
                  variant: "destructive",
                });
                return;
              }

              setLoading(true);
              (async () => {
                try {
                  console.log('📞 Calling getUserByMobile with cleaned mobile:', cleanMobile);
                  const result = await getUserByMobile(cleanMobile);
                  console.log('📋 Parent getUserByMobile result:', result);
                  if (result.success && result.user) {
                    console.log('✅ Username lookup successful');
                    toast({
                      title: "Account Found",
                      description: `Your account: ${result.user.full_name} (Mobile: ${result.user.mobile})`,
                    });
                  } else {
                    console.log('❌ Username lookup failed:', result.error);
                    toast({
                      title: "No Account Found",
                      description: result.error || "No account found with this mobile number",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error('💥 Parent Forgot Username error:', error);
                  toast({
                    title: "Lookup Error",
                    description: "An unexpected error occurred while looking up account",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              })();
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            Forgot Username?
          </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
        <p><strong>No username needed!</strong> Just use your mobile number and password</p>
        <p>Contact your school administrator if you need help accessing your account</p>
      </div>
    </div>
  );
};

export default ParentMobileAuth;