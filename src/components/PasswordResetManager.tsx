import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  Key, 
  Search, 
  Shield,
  Phone,
  Mail,
  Users,
  School,
  Car,
  UserCheck,
  Copy,
  RefreshCw
} from "lucide-react";

interface User {
  user_id: string;
  email: string;
  full_name: string;
  mobile: string;
  status: string;
  role: string;
  school_name?: string;
}

interface PasswordResetManagerProps {
  language: "en" | "ta";
}

const PasswordResetManager = ({ language }: PasswordResetManagerProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<{
    password: string;
    userName: string;
    userEmail: string;
    userRole: string;
    userMobile?: string;
  } | null>(null);

  const texts = {
    en: {
      title: "Password Reset Manager",
      description: "Reset passwords for all user types",
      search: "Search users...",
      resetPassword: "Reset Password",
      loading: "Loading users...",
      noUsers: "No users found",
      userDetails: "User Details",
      tempPassword: "Temporary Password",
      copyPassword: "Copy Password",
      close: "Close",
      passwordGenerated: "Password Generated Successfully",
      securityNote: "⚠️ This password is temporary. Share it securely with the user.",
      success: "Password reset successful",
      error: "Failed to reset password"
    },
    ta: {
      title: "கடவுச்சொல் மீட்டமைப்பு மேலாளர்",
      description: "அனைத்து பயனர் வகைகளுக்கும் கடவுச்சொற்களை மீட்டமைக்கவும்",
      search: "பயனர்களைத் தேடுங்கள்...",
      resetPassword: "கடவுச்சொல்லை மீட்டமை",
      loading: "பயனர்களை ஏற்றுகிறது...",
      noUsers: "பயனர்கள் இல்லை",
      userDetails: "பயனர் விவரங்கள்",
      tempPassword: "தற்காலிக கடவுச்சொல்",
      copyPassword: "கடவுச்சொல்லை நகலெடு",
      close: "மூடு",
      passwordGenerated: "கடவுச்சொல் வெற்றிகரமாக உருவாக்கப்பட்டது",
      securityNote: "⚠️ இது தற்காலிக கடவுச்சொல். பயனருடன் பாதுகாப்பாக பகிரவும்.",
      success: "கடவுச்சொல் மீட்டமைப்பு வெற்றிகரமானது",
      error: "கடவுச்சொல் மீட்டமைக்க முடியவில்லை"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, school_id');

      if (rolesError) throw rolesError;

      const userIds = [...new Set(rolesData?.map(r => r.user_id))];

      // Get profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, mobile, status')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get school names
      const schoolIds = rolesData?.map(r => r.school_id).filter(id => id) || [];
      let schoolsMap = new Map();
      
      if (schoolIds.length > 0) {
        const { data: schools } = await supabase
          .from('schools')
          .select('id, name')
          .in('id', schoolIds);
        
        schoolsMap = new Map(schools?.map(s => [s.id, s.name]));
      }

      // Combine data
      const formattedUsers: User[] = (profiles || []).map((profile: any) => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.user_id) || [];
        const primaryRole = userRoles.find(r => r.role === 'super_admin') ||
                           userRoles.find(r => r.role === 'admin') ||
                           userRoles.find(r => r.role === 'driver') ||
                           userRoles.find(r => r.role === 'parent') ||
                           userRoles[0];
        
        const schoolId = primaryRole?.school_id;
        const schoolName = schoolId ? schoolsMap.get(schoolId) : undefined;

        return {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          mobile: profile.mobile,
          status: profile.status,
          role: primaryRole?.role || 'user',
          school_name: schoolName
        };
      });

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile.includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const resetPassword = async (user: User) => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: user.user_id }
      });

      if (error) throw error;

      setPasswordInfo({
        password: data.tempPassword,
        userName: data.userInfo?.name || user.full_name,
        userEmail: data.userInfo?.email || user.email,
        userRole: data.userInfo?.role || getRoleLabel(user.role),
        userMobile: data.userInfo?.mobile || user.mobile
      });
      setShowPasswordDialog(true);

      toast({
        title: t.success,
        description: `Password reset for ${getRoleLabel(user.role)}: ${user.full_name}`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: t.error,
        description: error.message || t.error,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Shield className="h-4 w-4" />;
      case 'admin': return <School className="h-4 w-4" />;
      case 'driver': return <Car className="h-4 w-4" />;
      case 'parent': return <Users className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'driver': return 'Driver';
      case 'parent': return 'Parent';
      default: return 'User';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'driver': return 'secondary';
      case 'parent': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users List */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t.loading}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">{t.noUsers}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.full_name}</h3>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {user.mobile}
                      </div>
                      {user.school_name && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <School className="h-3 w-3" />
                          {user.school_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetPassword(user)}
                    className="gap-2"
                  >
                    <Key className="h-3 w-3" />
                    {t.resetPassword}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t.passwordGenerated}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <Label className="text-sm font-medium">{t.userDetails}</Label>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <strong>Name:</strong> {passwordInfo?.userName}
                  {passwordInfo?.userRole && (
                    <Badge variant={
                      passwordInfo.userRole === 'Super Admin' ? 'destructive' :
                      passwordInfo.userRole === 'Admin' ? 'default' :
                      passwordInfo.userRole === 'Driver' ? 'secondary' : 'outline'
                    }>
                      {passwordInfo.userRole}
                    </Badge>
                  )}
                </div>
                <div><strong>Email:</strong> {passwordInfo?.userEmail}</div>
                {passwordInfo?.userMobile && (
                  <div><strong>Mobile:</strong> {passwordInfo.userMobile}</div>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t.tempPassword}
              </Label>
              <div className="mt-2 p-4 bg-primary/5 border-2 border-primary/20 rounded-md font-mono text-lg select-all">
                {passwordInfo?.password}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t.securityNote}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => copyToClipboard(passwordInfo?.password || '')}
                className="flex-1 gap-2"
              >
                <Copy className="h-4 w-4" />
                {t.copyPassword}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1"
              >
                {t.close}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PasswordResetManager;
