import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Phone, Shield, Loader2, Key } from "lucide-react";
import { authenticator } from "otplib";

interface SuperAdminAuthProps {
  onSuccess: () => void;
}

const SuperAdminAuth = ({ onSuccess }: SuperAdminAuthProps) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const { signInWithMobilePassword } = useAuth();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
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
        // Move to TOTP step for super admin
        setStep('totp');
        toast({
          title: "Credentials Verified",
          description: "Please enter your TOTP code to complete login",
        });
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

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totpCode || totpCode.length !== 6) {
      toast({
        title: "Invalid TOTP Code",
        description: "Please enter a valid 6-digit TOTP code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For now, we'll use a placeholder secret. In production, this should be stored securely per user
      const secret = 'JBSWY3DPEHPK3PXP'; // This would be unique per super admin user
      const isValid = authenticator.verify({
        token: totpCode,
        secret: secret,
      });

      if (isValid) {
        toast({
          title: "Login Successful",
          description: "Welcome back, Super Admin!",
        });
        onSuccess();
      } else {
        toast({
          title: "Invalid TOTP Code",
          description: "The TOTP code you entered is incorrect",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying your TOTP code",
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

  const handleBackToCredentials = () => {
    setStep('credentials');
    setTotpCode('');
  };

  if (step === 'totp') {
    return (
      <div className="space-y-4">
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardHeader className="text-center pb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-2">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg text-orange-800">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-orange-700">
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totp">TOTP Code</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="totp"
                    type="text"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBackToCredentials}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center">
          <p>Having trouble? Contact your system administrator</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin + 2FA
        </Badge>
      </div>

      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
              Verifying...
            </>
          ) : (
            "Continue to 2FA"
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
        <p>VitalizePay Super Admin access requires mobile + password + TOTP verification</p>
      </div>
    </div>
  );
};

export default SuperAdminAuth;