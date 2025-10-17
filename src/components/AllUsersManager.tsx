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
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  created_at: string;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  user_metadata: {
    full_name?: string;
    mobile?: string;
  };
  role?: string;
  full_name?: string;
  mobile?: string;
}

interface AllUsersManagerProps {
  language: "en" | "ta";
}

const AllUsersManager = ({ language }: AllUsersManagerProps) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([]);
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
      title: "All Users - Password Reset",
      description: "Reset passwords for all users in the system",
      search: "Search by name, email, phone...",
      resetPassword: "Reset Password",
      loading: "Loading users...",
      noUsers: "No users found",
      userDetails: "User Details",
      tempPassword: "Temporary Password",
      copyPassword: "Copy Password",
      close: "Close",
      passwordGenerated: "Password Reset Successfully",
      securityNote: "⚠️ Share this temporary password securely with the user.",
      success: "Password reset successful",
      error: "Failed to reset password",
      confirmed: "Confirmed",
      unconfirmed: "Not Confirmed",
      lastLogin: "Last Login",
      createdAt: "Created",
      refresh: "Refresh Users"
    },
    ta: {
      title: "அனைத்து பயனர்கள் - கடவுச்சொல் மீட்டமைப்பு",
      description: "அமைப்பில் உள்ள அனைத்து பயனர்களுக்கும் கடவுச்சொற்களை மீட்டமைக்கவும்",
      search: "பெயர், மின்னஞ்சல், தொலைபேசி மூலம் தேடுங்கள்...",
      resetPassword: "கடவுச்சொல்லை மீட்டமை",
      loading: "பயனர்களை ஏற்றுகிறது...",
      noUsers: "பயனர்கள் இல்லை",
      userDetails: "பயனர் விவரங்கள்",
      tempPassword: "தற்காலிக கடவுச்சொல்",
      copyPassword: "கடவுச்சொல்லை நகலெடு",
      close: "மூடு",
      passwordGenerated: "கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது",
      securityNote: "⚠️ இந்த தற்காலிக கடவுச்சொல்லை பயனருடன் பாதுகாப்பாக பகிரவும்.",
      success: "கடவுச்சொல் மீட்டமைப்பு வெற்றிகரமானது",
      error: "கடவுச்சொல் மீட்டமைக்க முடியவில்லை",
      confirmed: "உறுதிப்படுத்தப்பட்டது",
      unconfirmed: "உறுதிப்படுத்தப்படவில்லை",
      lastLogin: "கடைசி உள்நுழைவு",
      createdAt: "உருவாக்கப்பட்டது",
      refresh: "பயனர்களை புதுப்பி"
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

      // Get user roles mapping
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      // Get profiles for additional info
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, mobile');

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      // Call edge function to get all auth users
      const { data, error } = await supabase.functions.invoke('list-all-users');

      if (error) throw error;

      const formattedUsers: AuthUser[] = (data?.users || []).map((user: any) => {
        const profile = profilesMap.get(user.id);
        const role = rolesMap.get(user.id);
        
        return {
          id: user.id,
          email: user.email || '',
          phone: user.phone,
          created_at: user.created_at,
          confirmed_at: user.confirmed_at,
          last_sign_in_at: user.last_sign_in_at,
          user_metadata: user.user_metadata || {},
          role: role,
          full_name: profile?.full_name || user.user_metadata?.full_name || 'No Name',
          mobile: profile?.mobile || user.user_metadata?.mobile || user.phone || ''
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
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.includes(searchTerm) ||
      user.phone?.includes(searchTerm) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const resetPassword = async (user: AuthUser) => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: user.id }
      });

      if (error) throw error;

      setPasswordInfo({
        password: data.tempPassword,
        userName: data.userInfo?.name || user.full_name || user.email,
        userEmail: data.userInfo?.email || user.email,
        userRole: data.userInfo?.role || getRoleLabel(user.role),
        userMobile: data.userInfo?.mobile || user.mobile || user.phone || ''
      });
      setShowPasswordDialog(true);

      toast({
        title: t.success,
        description: `Password reset for ${user.full_name || user.email}`,
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

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'super_admin': return <Shield className="h-4 w-4 text-red-600" />;
      case 'admin': return <School className="h-4 w-4 text-blue-600" />;
      case 'driver': return <Car className="h-4 w-4 text-yellow-600" />;
      case 'parent': return <Users className="h-4 w-4 text-purple-600" />;
      default: return <UserCheck className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'driver': return 'Driver';
      case 'parent': return 'Parent';
      default: return 'User';
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'driver': return 'secondary';
      case 'parent': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
            </div>
            <Button onClick={fetchAllUsers} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t.refresh}
            </Button>
          </div>
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
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{user.full_name}</h3>
                        {user.role && (
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {getRoleLabel(user.role)}
                          </Badge>
                        )}
                        {user.confirmed_at ? (
                          <Badge variant="outline" className="text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {t.confirmed}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1 text-orange-600">
                            <XCircle className="h-3 w-3" />
                            {t.unconfirmed}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.mobile && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {user.mobile}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t.createdAt}: {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetPassword(user)}
                    className="gap-2 shrink-0"
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
                <div className="flex items-center gap-2 flex-wrap">
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
              <div className="mt-2 p-4 bg-primary/5 border-2 border-primary/20 rounded-md font-mono text-lg select-all break-all">
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

export default AllUsersManager;
