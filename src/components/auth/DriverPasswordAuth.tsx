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
  
  const { signInWithMobilePassword, resetPassword, getUserByMobile } = useAuth();

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
    const { error } = await signInWithMobilePassword(mobile, password, 'driver');
    
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
          <Label htmlFor="mobile">Mobile Number (Username)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile"
              type="tel"
              placeholder="Your 10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="pl-10"
              maxLength={10}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">Your mobile number is your username</p>
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
        <div className="flex justify-center gap-4">
          <Button
            type="button"
            variant="ghost" 
            size="sm"
            className="text-primary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔄 Driver Forgot Password clicked, mobile:', mobile);
              if (!mobile?.trim()) {
                console.log('❌ No mobile number provided');
                toast({
                  title: "Enter Mobile Number",
                  description: "Please enter your mobile number first",
                  variant: "destructive",
                });
                return;
              }

              // Clean mobile number
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
              (async () => {
                try {
                  console.log('📞 Calling resetPassword with cleaned mobile:', cleanMobile);
                  const result = await resetPassword(cleanMobile);
                  console.log('📋 Driver resetPassword result:', result);
                  if (result.success && result.tempPassword) {
                    console.log('✅ Driver password reset successful');
                    toast({
                      title: "Password Reset Successful",
                      description: `Your temporary password is: ${result.tempPassword}. Please use this to login.`,
                      duration: 15000,
                      action: (
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(result.tempPassword).catch(() => {
                              // Fallback if clipboard fails
                              const textArea = document.createElement('textarea');
                              textArea.value = result.tempPassword;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                            });
                            toast({ title: "Copied!", description: "Password copied to clipboard" });
                          }}
                        >
                          Copy
                        </Button>
                      ),
                    });
                  } else {
                    console.log('❌ Driver password reset failed:', result.error);
                    toast({
                      title: "Reset Failed",
                      description: result.error || "Could not reset password. Please check your mobile number.",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error('💥 Driver Forgot Password error:', error);
                  toast({
                    title: "Reset Error",
                    description: "An unexpected error occurred while resetting password",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              })();
            }}
            disabled={loading}
          >
            Forgot Password?
          </Button>
          
          <Button
            type="button" 
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={async () => {
              console.log('🔄 Driver Forgot Username clicked, mobile:', mobile);
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
              try {
                console.log('📞 Calling getUserByMobile with cleaned mobile:', cleanMobile);
                const result = await getUserByMobile(cleanMobile);
                console.log('📋 Driver getUserByMobile result:', result);
                if (result.success && result.user) {
                  console.log('✅ Driver username lookup successful');
                  toast({
                    title: "Account Found",
                    description: `Account found: ${result.user.full_name} (Mobile: ${result.user.mobile})`,
                  });
                } else {
                  console.log('❌ Driver username lookup failed:', result.error);
                  toast({
                    title: "No Account Found",
                    description: result.error || "No account found with this mobile number",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('💥 Driver Forgot Username error:', error);
                toast({
                  title: "Lookup Error",
                  description: "An unexpected error occurred while looking up account",
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Forgot Username?
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>No username needed!</strong> Just use your mobile number and password</p>
          <p>
            {userType === 'driver' 
              ? "Driver accounts are managed by school administration"
              : "Admin accounts have additional security requirements"
            }
          </p>
        </div>
      </div>
    </form>
  );
};

export default DriverPasswordAuth;