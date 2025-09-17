import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  Check, 
  X, 
  Eye, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Activity,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar
} from "lucide-react";

interface User {
  user_id: string;
  email: string;
  full_name: string;
  mobile: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  role: string | null;
  all_roles?: string[];
  parent_details?: any;
  driver_details?: any;
  activity_logs?: any[];
}

interface UserManagementProps {
  language: "en" | "ta";
}

const UserManagement = ({ language }: UserManagementProps) => {
  const { userRole, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolData, setSchoolData] = useState<{ id: string; name: string } | null>(null);
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    role: 'parent' as 'parent' | 'driver',
    // Driver specific fields
    licenseNumber: '',
    experienceYears: '',
    vanAssigned: '',
    routeAssigned: '',
    // Parent specific fields
    childrenCount: '1',
    address: '',
    emergencyContact: '',
    mobile: ''
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordUser, setPasswordUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const texts = {
    en: {
      title: "User Management",
      userManagement: "User Management",
      userMonitoring: "User Monitoring",
      pendingApprovals: "Pending Approvals",
      activeUsers: "Active Users",
      searchPlaceholder: "Search users...",
      filterByStatus: "Filter by Status",
      filterByRole: "Filter by Role",
      allStatuses: "All Statuses",
      allRoles: "All Roles",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      suspended: "Suspended",
      parent: "Parent",
      driver: "Driver",
      admin: "Admin",
      approve: "Approve",
      reject: "Reject",
      suspend: "Suspend",
      activate: "Activate",
      viewDetails: "View Details",
      setPassword: "Set Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      passwordRequirements: "Password must be at least 8 characters long with uppercase, lowercase, number, and special character",
      updatePassword: "Update Password",
      passwordMismatch: "Passwords do not match",
      passwordTooWeak: "Password does not meet requirements",
      userDetails: "User Details",
      personalInfo: "Personal Information",
      roleInfo: "Role Information",
      activityLog: "Activity Log",
      registeredOn: "Registered on",
      lastActive: "Last active",
      noUsers: "No users found",
      phone: "Phone",
      address: "Address",
      children: "Children",
      emergencyContact: "Emergency Contact",
      licenseNumber: "License Number",
      licenseExpiry: "License Expiry",
      experience: "Experience",
      vanAssigned: "Van Assigned",
      routeAssigned: "Route Assigned"
    },
    ta: {
      title: "பயனர் மேலாண்மை",
      userManagement: "பயனர் மேலாண்மை",
      userMonitoring: "பயனர் கண்காணிப்பு",
      pendingApprovals: "நிலுவையில் உள்ள ஒப்புதல்கள்",
      activeUsers: "செயலில் உள்ள பயனர்கள்",
      searchPlaceholder: "பயனர்களைத் தேடுங்கள்...",
      filterByStatus: "நிலையின் அடிப்படையில் வடிகட்டு",
      filterByRole: "பாத்திரத்தின் அடிப்படையில் வடிகட்டு",
      allStatuses: "அனைத்து நிலைகள்",
      allRoles: "அனைத்து பாத்திரங்கள்",
      pending: "நிலுவை",
      approved: "ஒப்புதல்",
      rejected: "நிராகரிக்கப்பட்டது",
      suspended: "இடைநிறுத்தம்",
      parent: "பெற்றோர்",
      driver: "ஓட்டுனர்",
      admin: "நிர்வாகி",
      approve: "ஒப்புதல்",
      reject: "நிராகரி",
      suspend: "இடைநிறுத்து",
      activate: "செயல்படுத்து",
      viewDetails: "விவரங்களைப் பார்க்கவும்",
      setPassword: "கடவுச்சொல் அமைக்கவும்",
      newPassword: "புதிய கடவுச்சொல்",
      confirmPassword: "கடவுச்சொல் உறுதிப்படுத்தவும்",
      passwordRequirements: "கடவுச்சொல் குறைந்தது 8 எழுத்துகள், பெரிய-சிறிய எழுத்துகள், எண் மற்றும் சிறப்பு எழுத்து இருக்க வேண்டும்",
      updatePassword: "கடவுச்சொல் புதுப்பிக்கவும்",
      passwordMismatch: "கடவுச்சொற்கள் பொருந்தவில்லை",
      passwordTooWeak: "கடவுச்சொல் தேவைகளை பூர்த்தி செய்யவில்லை",
      userDetails: "பயனர் விவரங்கள்",
      personalInfo: "தனிப்பட்ட தகவல்",
      roleInfo: "பாத்திர தகவல்",
      activityLog: "செயல்பாட்டு பதிவு",
      registeredOn: "பதிவு செய்யப்பட்ட தேதி",
      lastActive: "கடைசியாக செயலில்",
      noUsers: "பயனர்கள் இல்லை",
      phone: "தொலைபேசி",
      address: "முகவரி",
      children: "குழந்தைகள்",
      emergencyContact: "அவசர தொடர்பு",
      licenseNumber: "உரிம எண்",
      licenseExpiry: "உரிமம் காலாவதி",
      experience: "அனுபவம்",
      vanAssigned: "ஒதுக்கப்பட்ட வேன்",
      routeAssigned: "ஒதுக்கப்பட்ட பாதை"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First get current admin's school assignment
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('school_id')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) throw roleError;

      let schoolId = roleData?.school_id;
      setCurrentSchoolId(schoolId);

      // If user is super admin, they can see all schools
      if (userRole === 'super_admin') {
        schoolId = null; // No school filtering for super admin
      }

      // Get school details if school is assigned
      if (schoolId) {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('id, name')
          .eq('id', schoolId)
          .single();
        
        if (schoolError) throw schoolError;
        setSchoolData(school);
      }
      
      // Fetch profiles - filter by school if not super admin
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, email, full_name, mobile, status, created_at');

      const { data: profilesData, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;

      // Fetch roles - filter by school if not super admin
      let rolesQuery = supabase
        .from('user_roles')
        .select('user_id, role, school_id');
      
      if (schoolId && userRole !== 'super_admin') {
        rolesQuery = rolesQuery.eq('school_id', schoolId);
      }

      const { data: rolesData, error: rolesError } = await rolesQuery;

      if (rolesError) throw rolesError;

      // Fetch parent details
      const { data: parentData, error: parentError } = await supabase
        .from('parent_details')
        .select('*');

      if (parentError) throw parentError;

      // Fetch driver details
      const { data: driverData, error: driverError } = await supabase
        .from('driver_details')
        .select('*');

      if (driverError) throw driverError;

      // Fetch activity logs
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_logs')
        .select('user_id, action, created_at, details')
        .order('created_at', { ascending: false });

      if (activityError) throw activityError;

      // Get user IDs that have roles in this school (or all if super admin)
      const schoolUserIds = rolesData?.map(role => role.user_id) || [];

      // Filter profiles to only include users with roles in this school
      const schoolProfiles = userRole === 'super_admin' 
        ? profilesData 
        : profilesData?.filter(profile => schoolUserIds.includes(profile.user_id)) || [];

      // Combine all data
      const formattedUsers = schoolProfiles?.map((profile: any) => {
        const userRoles = rolesData?.filter(role => role.user_id === profile.user_id) || [];
        const parentDetails = parentData?.find(parent => parent.user_id === profile.user_id) || null;
        const driverDetails = driverData?.find(driver => driver.user_id === profile.user_id) || null;
        const activityLogs = activityData?.filter(log => log.user_id === profile.user_id) || [];

        return {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          mobile: profile.mobile,
          status: profile.status,
          created_at: profile.created_at,
          role: userRoles[0]?.role || null,
          all_roles: userRoles.map(r => r.role),
          parent_details: parentDetails,
          driver_details: driverDetails,
          activity_logs: activityLogs
        };
      }) || [];

      // Filter out super admin users if current user is not super admin
      const filteredUsers = userRole === 'super_admin' 
        ? formattedUsers 
        : formattedUsers.filter(user => !user.all_roles.includes('super_admin'));

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserStatus = async (userId: string, newStatus: 'pending' | 'approved' | 'rejected' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      await supabase.from('user_activity_logs').insert({
        user_id: userId,
        action: `status_changed_to_${newStatus}`,
        details: { 
          changed_at: new Date().toISOString(),
          changed_by: 'admin' 
        }
      });

      await fetchUsers();
      
      toast({
        title: "Status Updated",
        description: `User status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'driver' | 'parent') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: role,
          school_id: currentSchoolId, // Assign to current admin's school
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      await fetchUsers();
      
      toast({
        title: "Role Assigned",
        description: `User assigned as ${role}`,
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    }
  };


  const setCustomPassword = async () => {
    if (!passwordUser || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: t.passwordMismatch,
        variant: "destructive",
      });
      return;
    }

    // Password validation
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (newPassword.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast({
        title: "Weak Password",
        description: t.passwordTooWeak,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: { 
          userId: passwordUser.id,
          customPassword: newPassword
        }
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: `Password updated successfully for ${passwordUser.name}`,
      });

      setShowPasswordDialog(false);
      setPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
      await fetchUsers();
    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const createUser = async () => {
    try {
      // Get current user for created_by field
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Call edge function to create user with admin privileges
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          userData: {
            ...newUser,
            createdBy: currentUser?.id,
            schoolId: currentSchoolId // Pass the admin's school ID
          }
        }
      });

      if (error) throw error;

      // Reset form
      setNewUser({
        email: '',
        fullName: '',
        phone: '',
        password: '',
        role: 'parent',
        licenseNumber: '',
        experienceYears: '',
        vanAssigned: '',
        routeAssigned: '',
        childrenCount: '1',
        address: '',
        emergencyContact: '',
        mobile: ''
      });

      setShowCreateDialog(false);
      await fetchUsers();

      toast({
        title: "User Created",
        description: `${newUser.role} account created successfully`,
      });

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-secondary text-secondary-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'suspended': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'driver': return 'bg-driver text-driver-foreground';
      case 'parent': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const activeCount = users.filter(u => u.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* School Header */}
      {schoolData && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              <span className="font-semibold text-lg">{schoolData.name}</span>
              <Badge variant="outline" className="text-xs">School Administration</Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">{t.pendingApprovals}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{activeCount}</div>
              <p className="text-sm text-muted-foreground">{t.activeUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder={t.filterByStatus} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="approved">{t.approved}</SelectItem>
                <SelectItem value="rejected">{t.rejected}</SelectItem>
                <SelectItem value="suspended">{t.suspended}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <SelectValue placeholder={t.filterByRole} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allRoles}</SelectItem>
                <SelectItem value="parent">{t.parent}</SelectItem>
                <SelectItem value="driver">{t.driver}</SelectItem>
                <SelectItem value="admin">{t.admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.userManagement}
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Users className="h-4 w-4" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.noUsers}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{user.full_name}</h4>
                    <Badge className={getStatusColor(user.status)}>
                      {t[user.status as keyof typeof t] || user.status}
                    </Badge>
                    {user.role && (
                      <Badge className={getRoleColor(user.role)}>
                        {t[user.role as keyof typeof t] || user.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    {user.mobile && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.mobile}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => {
                          updateUserStatus(user.user_id, 'approved');
                          if (!user.role && user.parent_details) {
                            assignRole(user.user_id, 'parent');
                          } else if (!user.role && user.driver_details) {
                            assignRole(user.user_id, 'driver');
                          }
                        }}
                      >
                        <Check className="h-3 w-3" />
                        {t.approve}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="gap-1"
                        onClick={() => updateUserStatus(user.user_id, 'rejected')}
                      >
                        <X className="h-3 w-3" />
                        {t.reject}
                      </Button>
                    </>
                  )}

                  {user.status === 'approved' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => updateUserStatus(user.user_id, 'suspended')}
                    >
                      <UserX className="h-3 w-3" />
                      {t.suspend}
                    </Button>
                  )}

                  {user.status === 'suspended' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => updateUserStatus(user.user_id, 'approved')}
                    >
                      <UserCheck className="h-3 w-3" />
                      {t.activate}
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => {
                      setPasswordUser({ 
                        id: user.user_id, 
                        name: user.full_name, 
                        email: user.email 
                      });
                      setShowPasswordDialog(true);
                    }}
                  >
                    🔑
                    {t.setPassword}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-3 w-3" />
                        {t.viewDetails}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t.userDetails}</DialogTitle>
                      </DialogHeader>
                      
                      {selectedUser && (
                        <Tabs defaultValue="personal" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="personal">{t.personalInfo}</TabsTrigger>
                            <TabsTrigger value="role">{t.roleInfo}</TabsTrigger>
                            <TabsTrigger value="activity">{t.activityLog}</TabsTrigger>
                          </TabsList>

                          <TabsContent value="personal" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Name</label>
                                <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Email</label>
                                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t.phone}</label>
                                <p className="text-sm text-muted-foreground">{selectedUser.mobile || 'Not provided'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Badge className={getStatusColor(selectedUser.status)}>
                                  {selectedUser.status}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t.registeredOn}</label>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(selectedUser.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="role" className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Current Role</label>
                              <div className="mt-1 flex items-center gap-3">
                                <Badge className={getRoleColor(selectedUser.role)}>
                                  {selectedUser.role || 'No role assigned'}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Assign Role</label>
                              <div className="mt-2 flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                                  onClick={() => assignRole(selectedUser.user_id, 'admin')}
                                  className="gap-1"
                                >
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={selectedUser.role === 'driver' ? 'default' : 'outline'}
                                  onClick={() => assignRole(selectedUser.user_id, 'driver')}
                                  className="gap-1"
                                >
                                  <Car className="h-3 w-3" />
                                  Driver
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={selectedUser.role === 'parent' ? 'default' : 'outline'}
                                  onClick={() => assignRole(selectedUser.user_id, 'parent')}
                                  className="gap-1"
                                >
                                  <Users className="h-3 w-3" />
                                  Parent
                                </Button>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Password Management</label>
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    Password reset is available in Super Admin Dashboard
                                  </p>
                                </div>
                            </div>

                            {selectedUser.parent_details && (
                              <div className="space-y-3">
                                <h4 className="font-medium">Parent Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">{t.children}</label>
                                    <p className="text-sm text-muted-foreground">{selectedUser.parent_details.children_count}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">{t.emergencyContact}</label>
                                    <p className="text-sm text-muted-foreground">{selectedUser.parent_details.emergency_contact || 'Not provided'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium">{t.address}</label>
                                    <p className="text-sm text-muted-foreground">{selectedUser.parent_details.address || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedUser.driver_details && (
                              <div className="space-y-3">
                                <h4 className="font-medium">Driver Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">{t.licenseNumber}</label>
                                    <p className="text-sm text-muted-foreground">{selectedUser.driver_details.license_number}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">{t.licenseExpiry}</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedUser.driver_details.license_expiry ? 
                                        new Date(selectedUser.driver_details.license_expiry).toLocaleDateString() : 
                                        'Not provided'
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">{t.experience}</label>
                                    <p className="text-sm text-muted-foreground">{selectedUser.driver_details.experience_years} years</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">{t.vanAssigned}</label>
                                    <p className="text-sm text-muted-foreground">{selectedUser.driver_details.van_assigned || 'Not assigned'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium">{t.routeAssigned}</label>
                                    <p className="text-sm text-muted-foreground">{selectedUser.driver_details.route_assigned || 'Not assigned'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="activity" className="space-y-4">
                            <div className="space-y-2">
                              {selectedUser.activity_logs && selectedUser.activity_logs.length > 0 ? (
                                selectedUser.activity_logs.slice(0, 10).map((log: any, index: number) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                    <Activity className="h-4 w-4 text-primary mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(log.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No activity recorded
                                </p>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number</label>
            <Input
              value={newUser.phone}
              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              placeholder="+919876543210"
            />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={newUser.role} onValueChange={(value: 'parent' | 'driver') => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role-specific fields */}
            {newUser.role === 'driver' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Driver Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">License Number</label>
                    <Input
                      value={newUser.licenseNumber}
                      onChange={(e) => setNewUser({...newUser, licenseNumber: e.target.value})}
                      placeholder="DL123456789"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Experience (Years)</label>
                    <Input
                      type="number"
                      value={newUser.experienceYears}
                      onChange={(e) => setNewUser({...newUser, experienceYears: e.target.value})}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Van Assigned</label>
                    <Input
                      value={newUser.vanAssigned}
                      onChange={(e) => setNewUser({...newUser, vanAssigned: e.target.value})}
                      placeholder="VAN001"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Route Assigned</label>
                    <Input
                      value={newUser.routeAssigned}
                      onChange={(e) => setNewUser({...newUser, routeAssigned: e.target.value})}
                      placeholder="Route A"
                    />
                  </div>
                </div>
              </div>
            )}

            {newUser.role === 'parent' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Parent Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Children</label>
                    <Input
                      type="number"
                      value={newUser.childrenCount}
                      onChange={(e) => setNewUser({...newUser, childrenCount: e.target.value})}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emergency Contact</label>
                    <Input
                      value={newUser.emergencyContact}
                      onChange={(e) => setNewUser({...newUser, emergencyContact: e.target.value})}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={newUser.address}
                    onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={createUser}
                disabled={!newUser.email || !newUser.fullName || !newUser.password}
              >
                Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.setPassword}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {passwordUser && `Set custom password for ${passwordUser.name}`}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.newPassword}</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.confirmPassword}</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              {t.passwordRequirements}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={setCustomPassword}
                className="flex-1"
              >
                {t.updatePassword}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;