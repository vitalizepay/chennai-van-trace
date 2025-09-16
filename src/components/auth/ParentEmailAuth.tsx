import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, User, Loader2 } from "lucide-react";

interface ParentEmailAuthProps {
  onSuccess: () => void;
}

const ParentEmailAuth = ({ onSuccess }: ParentEmailAuthProps) => {
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loginValue = loginMethod === 'email' ? email : username;
    
    if (!loginValue || !password) {
      toast({
        title: "Missing Information",
        description: `Please enter both ${loginMethod} and password`,
        variant: "destructive",
      });
      return;
    }

    // Basic email validation if using email
    if (loginMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For username login, we'll use the username as email for now
      // In a real system, you'd need to look up the email by username first
      const loginEmail = loginMethod === 'email' ? email : `${username}@parent.local`;
      
      const { error } = await signIn(loginEmail, password);
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || `Invalid ${loginMethod} or password`,
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
      {/* Login Method Toggle */}
      <div className="flex bg-muted rounded-lg p-1">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
            loginMethod === 'email'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('username')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
            loginMethod === 'username'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4" />
          Username
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email/Username Input */}
        <div className="space-y-2">
          <Label htmlFor="login-input">
            {loginMethod === 'email' ? 'Email Address' : 'Username'}
          </Label>
          <div className="relative">
            {loginMethod === 'email' ? (
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            ) : (
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              id="login-input"
              type={loginMethod === 'email' ? 'email' : 'text'}
              placeholder={
                loginMethod === 'email' 
                  ? 'Enter your email address' 
                  : 'Enter your username'
              }
              value={loginMethod === 'email' ? email : username}
              onChange={(e) => {
                if (loginMethod === 'email') {
                  setEmail(e.target.value);
                } else {
                  setUsername(e.target.value);
                }
              }}
              className="pl-10"
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
            `Sign In with ${loginMethod === 'email' ? 'Email' : 'Username'}`
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
        <p>Parents can login using either email or username</p>
        <p>Contact your school administrator if you need help accessing your account</p>
      </div>
    </div>
  );
};

export default ParentEmailAuth;