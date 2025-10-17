import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  School,
  Key,
  Plus,
  Building,
  AlertTriangle,
  Trash2
} from "lucide-react";

interface School {
  id: string;
  name: string;
  location: string;
  address: string;
  status: "active" | "inactive";
}

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  mobile: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  role: string;
  school_id?: string;
  school_name?: string;
  school_location?: string;
  activity_logs?: any[];
}

interface SuperAdminUserManagementProps {
  language: "en" | "ta";
}

const SuperAdminUserManagement = ({ language }: SuperAdminUserManagementProps) => {
  const { user, userRole } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<{
    password: string;
    userName: string;
    userEmail: string;
    userRole?: string;
    userMobile?: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    mobile: '',
    school_id: ''
  });

  const texts = {
    en: {
      title: "Admin User Management",
      schoolAdmins: "School Administrators",
      createAdmin: "Create School Admin",
      pendingAdmins: "Pending Admins",
      activeAdmins: "Active Admins",
      searchPlaceholder: "Search administrators...",
      filterByStatus: "Filter by Status",
      filterBySchool: "Filter by School",
      allStatuses: "All Statuses",
      allSchools: "All Schools",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      suspended: "Suspended",
      approve: "Approve",
      reject: "Reject",
      suspend: "Suspend",
      activate: "Activate",
      viewDetails: "View Details",
      userDetails: "Administrator Details",
      personalInfo: "Personal Information",
      schoolInfo: "School Information",
      activityLog: "Activity Log",
      registeredOn: "Registered on",
      lastActive: "Last active",
      noUsers: "No administrators found",
      phone: "Phone",
      email: "Email",
      fullName: "Full Name",
      school: "Assigned School",
      selectSchool: "Select School",
      createAdminTitle: "Create School Administrator",
      createAdminDesc: "Create a new administrator and assign them to a specific school.",
      basicInfo: "Basic Information",
      schoolAssignment: "School Assignment",
      cancel: "Cancel",
      create: "Create Administrator",
      adminCreated: "Administrator created successfully",
      hierarchy: "User Hierarchy",
      hierarchyDesc: "Super Admin → School Admin → Parents & Drivers",
      unassigned: "Unassigned"
    },
    ta: {
      title: "நிர்வாக பயனர் மேலாண்மை",
      schoolAdmins: "பள்ளி நிர்வாகிகள்",
      createAdmin: "பள்ளி நிர்வாகியை உருவாக்கவும்",
      pendingAdmins: "நிலுவையில் உள்ள நிர்வாகிகள்",
      activeAdmins: "செயலில் உள்ள நிர்வாகிகள்",
      searchPlaceholder: "நிர்வாகிகளைத் தேடுங்கள்...",
      filterByStatus: "நிலையின் அடிப்படையில் வடிகட்டு",
      filterBySchool: "பள்ளியின் அடிப்படையில் வடிகட்டு",
      allStatuses: "அனைத்து நிலைகள்",
      allSchools: "அனைத்து பள்ளிகள்",
      pending: "நிலுவை",
      approved: "ஒப்புதல்",
      rejected: "நிராகரிக்கப்பட்டது",
      suspended: "இடைநிறுத்தம்",
      approve: "ஒப்புதல்",
      reject: "நிராகரி",
      suspend: "இடைநிறுத்து",
      activate: "செயல்படுத்து",
      viewDetails: "விவரங்களைப் பார்க்கவும்",
      userDetails: "நிர்வாகி விவரங்கள்",
      personalInfo: "தனிப்பட்ட தகவல்",
      schoolInfo: "பள்ளி தகவல்",
      activityLog: "செயல்பாட்டு பதிவு",
      registeredOn: "பதிவு செய்யப்பட்ட தேதி",
      lastActive: "கடைசியாக செயலில்",
      noUsers: "நிர்வாகிகள் இல்லை",
      phone: "தொலைபேசி",
      email: "மின்னஞ்சல்",
      fullName: "முழு பெயர்",
      school: "ஒதுக்கப்பட்ட பள்ளி",
      selectSchool: "பள்ளியைத் தேர்ந்தெடுக்கவும்",
      createAdminTitle: "பள்ளி நிர்வாகியை உருவாக்கவும்",
      createAdminDesc: "புதிய நிர்வாகியை உருவாக்கி குறிப்பிட்ட பள்ளிக்கு ஒதுக்கவும்.",
      basicInfo: "அடிப்படை தகவல்",
      schoolAssignment: "பள்ளி ஒதுக்கீடு",
      cancel: "ரத்து செய்",
      create: "நிர்வாகியை உருவாக்கவும்",
      adminCreated: "நிர்வாகி வெற்றிகரமாக உருவாக்கப்பட்டது",
      hierarchy: "பயனர் படிநிலை",
      hierarchyDesc: "சூப்பர் நிர்வாகி → பள்ளி நிர்வாகி → பெற்றோர்கள் & ஓட்டுநர்கள்",
      unassigned: "ஒதுக்கப்படவில்லை"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [adminUsers, searchTerm, statusFilter, schoolFilter]);

  const fetchData = async () => {
    await Promise.all([fetchAdminUsers(), fetchSchools()]);
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, location, address, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setSchools((data || []) as School[]);
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schools",
        variant: "destructive",
      });
    }
  };

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      
      // Determine which roles to fetch based on current user's role
      let rolesToFetch: ('admin' | 'super_admin')[] = [];
      if (userRole === 'super_admin') {
        // Super admins can see both admin and super_admin users
        rolesToFetch = ['admin', 'super_admin'];
      } else {
        // Regular admins can only see other admin users (not super_admin)
        rolesToFetch = ['admin'];
      }
      
      // Get users with appropriate roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, school_id')
        .in('role', rolesToFetch);

      if (rolesError) {
        console.error('Error fetching admin roles:', rolesError);
        throw rolesError;
      }

      if (!adminRoles || adminRoles.length === 0) {
        console.log('No admin roles found');
        setAdminUsers([]);
        return;
      }

      // Get user IDs for admin users
      const adminUserIds = adminRoles.map(role => role.user_id);

      // Fetch profiles for admin users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, mobile, status, created_at')
        .in('user_id', adminUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get school IDs that are assigned to admins
      const schoolIds = adminRoles
        .map(role => role.school_id)
        .filter(id => id !== null);

      // Fetch school details if there are any assigned schools
      let schoolsData: any[] = [];
      if (schoolIds.length > 0) {
        const { data: schools, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name, location')
          .in('id', schoolIds);

        if (schoolsError) {
          console.error('Error fetching schools:', schoolsError);
          // Don't throw here, just log and continue without school data
        } else {
          schoolsData = schools || [];
        }
      }

      // Combine all the data
      const formattedUsers = (profiles || []).map((profile: any) => {
        const userRole = adminRoles.find(role => role.user_id === profile.user_id);
        const school = schoolsData.find(s => s.id === userRole?.school_id);

        return {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          mobile: profile.mobile,
          status: profile.status,
          created_at: profile.created_at,
          role: userRole?.role || 'admin',
          school_id: userRole?.school_id || null,
          school_name: school?.name || t.unassigned,
          school_location: school?.location || '',
          activity_logs: []
        };
      });

      console.log('Formatted admin users:', formattedUsers);
      setAdminUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch administrators",
        variant: "destructive",
      });
      setAdminUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = adminUsers;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (schoolFilter !== "all") {
      filtered = filtered.filter(user => user.school_id === schoolFilter);
    }

    setFilteredUsers(filtered);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      mobile: '',
      school_id: 'none'
    });
  };

  const handleCreate = async () => {
    try {
      if (!formData.email || !formData.mobile || !formData.full_name) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Use the edge function to create the user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          userData: {
            email: formData.email,
            fullName: formData.full_name,
            phone: formData.mobile,
            role: 'admin',
            createdBy: user?.id || null,
            schoolId: formData.school_id === "none" || !formData.school_id ? null : formData.school_id
          }
        }
      });

      if (error) throw error;

      const tempPassword = data?.tempPassword;

      // Show password in dialog for easy copying
      setPasswordInfo({
        password: tempPassword,
        userName: formData.full_name,
        userEmail: formData.email
      });
      setShowPasswordDialog(true);

      setShowCreateDialog(false);
      resetForm();
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (userId: string, userName: string, userEmail: string, userRole: string = 'Admin') => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId }
      });

      if (error) throw error;

      // Show password in dialog with user type information
      setPasswordInfo({
        password: data.tempPassword,
        userName: data.userInfo?.name || userName,
        userEmail: data.userInfo?.email || userEmail,
        userRole: data.userInfo?.role || userRole,
        userMobile: data.userInfo?.mobile
      });
      setShowPasswordDialog(true);

      toast({
        title: "Password Reset Successful",
        description: `Password reset for ${data.userInfo?.role || userRole}: ${userName}`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
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
      // Fallback for older browsers
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

  const confirmDelete = (user: AdminUser) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Use the edge function to delete the user
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.user_id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${userToDelete.full_name} has been deleted successfully`,
      });

      setShowDeleteDialog(false);
      setUserToDelete(null);
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'pending' | 'approved' | 'rejected' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchAdminUsers();
      
      toast({
        title: "Status Updated",
        description: `Administrator status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update administrator status",
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

  const pendingCount = adminUsers.filter(u => u.status === 'pending').length;
  const activeCount = adminUsers.filter(u => u.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Hierarchy Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">{t.hierarchy}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t.hierarchyDesc}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">Super Admin (You)</Badge>
            <span>→</span>
            <Badge variant="outline" className="text-xs">School Admins</Badge>
            <span>→</span>
            <Badge variant="outline" className="text-xs">Parents & Drivers</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{t.title}</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              {t.createAdmin}
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">{t.pendingAdmins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{activeCount}</div>
              <p className="text-sm text-muted-foreground">{t.activeAdmins}</p>
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
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="approved">{t.approved}</SelectItem>
                <SelectItem value="rejected">{t.rejected}</SelectItem>
                <SelectItem value="suspended">{t.suspended}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t.filterBySchool} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allSchools}</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.schoolAdmins}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t.noUsers}</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-4 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{user.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {user.mobile}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-3 w-3" />
                      {user.school_name}
                      {user.school_location && ` (${user.school_location})`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(user.status)}>
                    {t[user.status as keyof typeof t]}
                  </Badge>
                  <div className="flex gap-1">
                    {user.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateUserStatus(user.user_id, 'approved')}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateUserStatus(user.user_id, 'rejected')}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {user.status === 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => updateUserStatus(user.user_id, 'suspended')}>
                        <UserX className="h-3 w-3" />
                      </Button>
                    )}
                    {user.status === 'suspended' && (
                      <Button size="sm" variant="outline" onClick={() => updateUserStatus(user.user_id, 'approved')}>
                        <UserCheck className="h-3 w-3" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => resetPassword(user.user_id, user.full_name, user.email, user.role)}
                      title="Reset Password"
                    >
                      🔑
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => confirmDelete(user)}
                      title="Delete User"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.createAdminTitle}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{t.createAdminDesc}</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t.basicInfo}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.email} *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="admin@school.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.fullName} *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.phone} *</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  placeholder="+919876543210"
                />
              </div>
            </div>

            {/* School Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t.schoolAssignment}</h3>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.school}</Label>
                <Select 
                  value={formData.school_id} 
                  onValueChange={(value) => setFormData({...formData, school_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectSchool} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No School Assignment</SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{school.name}</p>
                            <p className="text-xs text-muted-foreground">{school.location}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleCreate}>
                {t.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Display Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Generated Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <Label className="text-sm font-medium">User Details</Label>
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
                Temporary Password
              </Label>
              <div className="mt-2 p-4 bg-primary/5 border-2 border-primary/20 rounded-md font-mono text-lg select-all">
                {passwordInfo?.password}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ This password is temporary. Please share it securely with the user.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => copyToClipboard(passwordInfo?.password || '')}
                className="flex-1 gap-2"
              >
                📋 Copy Password
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-md">
              <p className="text-sm">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              {userToDelete && (
                <div className="mt-3 space-y-1 text-sm">
                  <div><strong>Name:</strong> {userToDelete.full_name}</div>
                  <div><strong>Email:</strong> {userToDelete.email}</div>
                  <div><strong>Role:</strong> {userToDelete.role}</div>
                  {userToDelete.school_name && (
                    <div><strong>School:</strong> {userToDelete.school_name}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={deleteUser}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminUserManagement;