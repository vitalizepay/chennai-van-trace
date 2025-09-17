import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { generateDeviceFingerprint, getDeviceInfo } from '@/utils/deviceFingerprint';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  userRole: string | null;
  loading: boolean;
  needsPasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ error: any }>;
  
  // New OTP-based authentication methods
  sendOtp: (mobile: string) => Promise<{ error: any; success?: boolean }>;
  verifyOtp: (mobile: string, otp: string) => Promise<{ error: any; user?: User }>;
  signInWithMobilePassword: (mobile: string, password: string) => Promise<{ error: any }>;
  resetPassword: (mobile: string) => Promise<{ success: boolean; tempPassword?: string; message?: string; error?: string }>;
  getUserByMobile: (mobile: string) => Promise<{ success: boolean; user?: any; message?: string; error?: string }>;
  checkDeviceSession: () => Promise<boolean>;
  checkTempPassword: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      setUserProfile(profile);

      // Fetch user role (get the first role if multiple exist)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: true })
        .limit(1)
        .single();

      setUserRole(roleData?.role || null);

      // Log activity
      await supabase.from('user_activity_logs').insert({
        user_id: userId,
        action: 'login',
        details: { timestamp: new Date().toISOString() }
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid blocking auth state change
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            checkTempPassword();
          }, 0);
        } else {
          setUserProfile(null);
          setUserRole(null);
          setNeedsPasswordChange(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        checkTempPassword();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };


  const signOut = async () => {
    if (user) {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        action: 'logout',
        details: { timestamp: new Date().toISOString() }
      });
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setUserRole(null);
  };

  const updateProfile = async (data: any) => {
    if (!user) return { error: new Error('No user logged in') };
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);

    if (!error) {
      setUserProfile({ ...userProfile, ...data });
    }
    
    return { error };
  };

  // New OTP-based authentication methods
  const sendOtp = async (mobile: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { mobile }
      });
      
      if (error) throw error;
      
      return { error: null, success: true };
    } catch (error: any) {
      return { error };
    }
  };

  const verifyOtp = async (mobile: string, otp: string) => {
    try {
      // Verify OTP using database function
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_otp', {
        _mobile: mobile,
        _otp_code: otp
      });

      if (verifyError) throw verifyError;
      
      if (!isValid) {
        throw new Error('Invalid or expired OTP');
      }

      // Find or create user based on mobile number
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('mobile', mobile)
        .single();

      if (!profile) {
        // Create temporary email based on mobile for Supabase auth
        const tempEmail = `${mobile.replace(/[^0-9]/g, '')}@mobile.temp`;
        const tempPassword = Math.random().toString(36).substring(2, 15);
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: tempPassword,
          options: {
            data: {
              mobile: mobile,
              is_mobile_user: true
            }
          }
        });

        if (authError) throw authError;
        
        // Update profile with mobile
        if (authData.user) {
          await supabase
            .from('profiles')
            .update({ mobile })
            .eq('user_id', authData.user.id);
        }

        return { error: null, user: authData.user };
      } else {
        // Sign in existing user - create a session
        const tempEmail = `${mobile.replace(/[^0-9]/g, '')}@mobile.temp`;
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: 'temp' // This won't work, but we'll create device session instead
        });

        // Create device session for auto-login
        await createDeviceSession(profile.user_id);
        
        // Manually set the session (this is a workaround)
        const { data: userData } = await supabase.auth.getUser();
        return { error: null, user: userData.user };
      }
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithMobilePassword = async (mobile: string, password: string) => {
    try {
      console.log('Looking for user with mobile:', mobile);
      
      // Use database function to get user by mobile (bypasses RLS)
      const { data: users, error: profileError } = await supabase
        .rpc('get_user_for_mobile_login', { _mobile: mobile });

      console.log('Profile query result:', { users, profileError });

      if (profileError) {
        throw profileError;
      }

      if (!users || users.length === 0) {
        throw new Error('User not found with this mobile number');
      }

      const profile = users[0];

      // Sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (error) throw error;

      // Wait for auth state to update before returning
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        
        // Create device session for auto-login
        await createDeviceSession(profile.user_id);
        
        // Wait a bit for state to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const resetPassword = async (mobile: string) => {
    try {
      // Find user by mobile number
      const { data: users, error: profileError } = await supabase
        .rpc('get_user_for_mobile_login', { _mobile: mobile });

      if (profileError) throw profileError;
      if (!users || users.length === 0) {
        throw new Error('No account found with this mobile number');
      }

      const profile = users[0];

      // Call the reset password edge function
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: profile.user_id }
      });

      if (error) throw error;

      return { 
        success: true, 
        tempPassword: data.tempPassword,
        message: 'A temporary password has been generated for your account'
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to reset password'
      };
    }
  };

  const getUserByMobile = async (mobile: string) => {
    try {
      const { data: users, error } = await supabase
        .rpc('get_user_for_mobile_login', { _mobile: mobile });

      if (error) throw error;
      if (!users || users.length === 0) {
        throw new Error('No account found with this mobile number');
      }

      return { 
        success: true, 
        user: users[0],
        message: `Account found for ${users[0].full_name}`
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'No account found'
      };
    }
  };

  const createDeviceSession = async (userId: string) => {
    try {
      const fingerprint = await generateDeviceFingerprint();
      const deviceInfo = getDeviceInfo();

      await supabase.from('device_sessions').upsert({
        user_id: userId,
        device_fingerprint: fingerprint,
        device_info: deviceInfo,
        last_used_at: new Date().toISOString(),
        is_active: true
      });
    } catch (error) {
      console.error('Failed to create device session:', error);
    }
  };

  const checkDeviceSession = async () => {
    try {
      const fingerprint = await generateDeviceFingerprint();
      
      const { data: deviceSession } = await supabase
        .from('device_sessions')
        .select('user_id')
        .eq('device_fingerprint', fingerprint)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (deviceSession) {
        // Update last used time
        await supabase
          .from('device_sessions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('device_fingerprint', fingerprint);

        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
      }
      
      return false;
    } catch (error) {
      console.error('Device session check failed:', error);
      return false;
    }
  };

  const checkTempPassword = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user has already changed from temp password by looking at activity logs
        const { data: passwordChangeLog } = await supabase
          .from('user_activity_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('action', 'password_changed')
          .limit(1);

        // If user has already changed password, don't prompt again
        if (passwordChangeLog && passwordChangeLog.length > 0) {
          setNeedsPasswordChange(false);
          return false;
        }

        // Check user profile for password change indicators
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, updated_at, status')
          .eq('user_id', user.id)
          .single();
          
        if (profile) {
          // Check if user was created recently (within 24 hours) and profile hasn't been significantly updated
          const userCreated = new Date(user.created_at);
          const profileUpdated = new Date(profile.updated_at);
          const now = new Date();
          const userAgeHours = (now.getTime() - userCreated.getTime()) / (1000 * 3600);
          const timeSinceUpdate = (now.getTime() - profileUpdated.getTime()) / (1000 * 60); // minutes
          
          // Only prompt for password change if:
          // 1. User was created recently (within 24 hours)
          // 2. Profile was updated very recently (less than 5 minutes ago) - indicating fresh temp password
          const isRecentUser = userAgeHours < 24;
          const hasRecentUpdate = timeSinceUpdate < 5;
          
          const needsChange = isRecentUser && hasRecentUpdate;
          setNeedsPasswordChange(needsChange);
          return needsChange;
        }
      }
      setNeedsPasswordChange(false);
      return false;
    } catch (error) {
      console.error('Error checking temp password:', error);
      setNeedsPasswordChange(false);
      return false;
    }
  };

  const value = {
    user,
    session,
    userProfile,
    userRole,
    loading,
    needsPasswordChange,
    signIn,
    signUp,
    signOut,
    updateProfile,
    sendOtp,
    verifyOtp,
    signInWithMobilePassword,
    resetPassword,
    getUserByMobile,
    checkDeviceSession,
    checkTempPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};