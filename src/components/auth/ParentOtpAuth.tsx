import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Phone, Timer } from "lucide-react";

interface ParentOtpAuthProps {
  onSuccess: () => void;
}

const ParentOtpAuth = ({ onSuccess }: ParentOtpAuthProps) => {
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { sendOtp, verifyOtp, checkDeviceSession } = useAuth();

  useEffect(() => {
    // Check for existing device session on mount
    checkDeviceSession().then((hasSession) => {
      if (hasSession) {
        toast({
          title: "Welcome back!",
          description: "Auto-logged in from trusted device",
        });
        onSuccess();
      }
    });
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await sendOtp(mobile);
    
    if (error) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
      setStep('otp');
      setCountdown(300); // 5 minutes
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(mobile, otp);
    
    if (error) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
      setOtp('');
    } else {
      toast({
        title: "Login Successful!",
        description: "Welcome to School Van Tracker",
      });
      onSuccess();
    }
    
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    const { error } = await sendOtp(mobile);
    
    if (error) {
      toast({
        title: "Failed to resend OTP",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "OTP Resent",
        description: "A new code has been sent to your phone",
      });
      setCountdown(300);
      setOtp('');
    }
    
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'mobile') {
    return (
      <form onSubmit={handleSendOtp} className="space-y-6">
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
          <p className="text-xs text-muted-foreground">
            We'll send a 6-digit verification code to this number
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Verify Your Phone</h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to
          <br />
          <span className="font-medium">{mobile}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {countdown > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            Code expires in {formatTime(countdown)}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying..." : "Verify & Login"}
        </Button>

        <div className="flex justify-between text-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep('mobile')}
            disabled={loading}
          >
            Change Number
          </Button>
          
          <Button
            type="button"
            variant="ghost" 
            size="sm"
            onClick={handleResendOtp}
            disabled={loading || countdown > 0}
          >
            Resend OTP
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ParentOtpAuth;