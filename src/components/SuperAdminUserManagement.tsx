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
  Building
} from "lucide-react";

interface School {
  id: string;
  name: string;
  location: string;
  totalVans: number;
  activeVans: number;
  totalStudents: number;
  status: "active" | "inactive";
}

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  mobile: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  role: string | null;
  school_id?: string;
  school_name?: string;
  activity_logs?: any[];
  total_users_managed?: number;
}

interface SuperAdminUserManagementProps {
  language: "en" | "ta";
}

const SuperAdminUserManagement = ({ language }: SuperAdminUserManagementProps) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    fullName: '',
    mobile: '',
    password: '',
    schoolId: '',
    schoolName: ''
  });

  // Sample schools data - in real app this would come from database
  const [schools] = useState<School[]>([
    { id: "1", name: "St. Mary's High School", location: "Chennai Central", totalVans: 4, activeVans: 3, totalStudents: 150, status: "active" },
    { id: "2", name: "Gandhi Memorial School", location: "T. Nagar", totalVans: 6, activeVans: 5, totalStudents: 220, status: "active" },
    { id: "3", name: "Modern Public School", location: "Anna Nagar", totalVans: 3, activeVans: 2, totalStudents: 90, status: "active" },
    { id: "4", name: "Sacred Heart School", location: "Velachery", totalVans: 5, activeVans: 4, totalStudents: 180, status: "active" },
  ]);

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
      password: "Password (Temporary)",
      school: "Assigned School",
      selectSchool: "Select School",
      usersManaged: "Users Managed",
      createAdminTitle: "Create School Administrator",
      createAdminDesc: "Create a new administrator for a specific school. They will be able to manage parents and drivers for their school.",
      basicInfo: "Basic Information",
      schoolAssignment: "School Assignment",
      cancel: "Cancel",
      create: "Create Administrator",
      adminCreated: "Administrator created successfully",
      resetPassword: "Reset Password",
      manageUsers: "Manage Users",
      hierarchy: "User Hierarchy",
      hierarchyDesc: "Super Admin → School Admin → Parents & Drivers"
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
      password: "கடவுச்சொல் (தற்காலிக)",
      school: "ஒதுக்கப்பட்ட பள்ளி",
      selectSchool: "பள்ளியைத் தேர்ந்தெடுக்கவும்",
      usersManaged: "நிர்வகிக்கப்படும் பயனர்கள்",
      createAdminTitle: "பள்ளி நிர்வாகியை உருவாக்கவும்",
      createAdminDesc: "குறிப்பிட்ட பள்ளிக்கு புதிய நிர்வாகியை உருவாக்கவும். அவர்கள் தங்கள் பள்ளிக்கான பெற்றோர்கள் மற்றும் ஓட்டுநர்களை நிர்வகிக்க முடியும்.",
      basicInfo: "அடிப்படை தகவல்",
      schoolAssignment: "பள்ளி ஒதுக்கீடு",
      cancel: "ரத்து செய்",
      create: "நிர்வாகியை உருவாக்கவும்",
      adminCreated: "நிர்வாகி வெற்றிகரமாக உருவாக்கப்பட்டது",
      resetPassword: "கடவுச்சொல்லை மீட்டமை",
      manageUsers: "பயனர்களை நிர்வகிக்கவும்",
      hierarchy: "பயனர் படிநிலை",
      hierarchyDesc: "சூப்பர் நிர்வாகி → பள்ளி நிர்வாகி → பெற்றோர்கள் & ஓட்டுநர்கள்"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [adminUsers, searchTerm, statusFilter, schoolFilter]);

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles with admin role
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, mobile, status, created_at');

      if (profilesError) throw profilesError;

      // Fetch only admin roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      // Fetch activity logs for admin users
      const adminUserIds = rolesData?.map(role => role.user_id) || [];
      let activityData = [];
      
      if (adminUserIds.length > 0) {
        const { data: activityResult, error: activityError } = await supabase
          .from('user_activity_logs')
          .select('user_id, action, created_at, details')
          .in('user_id', adminUserIds)
          .order('created_at', { ascending: false });

        if (activityError) throw activityError;
        activityData = activityResult || [];
      }

      // Combine data and add mock school assignments
      const formattedUsers = profilesData?.filter((profile: any) => 
        rolesData?.some(role => role.user_id === profile.user_id)
      ).map((profile: any, index: number) => {
        const activityLogs = activityData?.filter(log => log.user_id === profile.user_id) || [];
        const assignedSchool = schools[index % schools.length]; // Mock assignment
        
        return {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          mobile: profile.mobile,
          status: profile.status,
          created_at: profile.created_at,
          role: 'admin',
          school_id: assignedSchool.id,
          school_name: assignedSchool.name,
          activity_logs: activityLogs,
          total_users_managed: Math.floor(Math.random() * 50) + 10 // Mock data
        };
      }) || [];

      setAdminUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch administrators",
        variant: "destructive",
      });
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
          changed_by: 'super_admin' 
        }
      });

      await fetchAdminUsers();
      
      toast({
        title: "Status Updated",
        description: `Administrator status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update administrator status",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Password Reset Successful",
          description: `Temporary password: ${data.tempPassword}`,
          duration: 10000,
        });
        
        await fetchAdminUsers();
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const createAdmin = async () => {
    try {
      if (!newAdmin.email || !newAdmin.fullName || !newAdmin.mobile || !newAdmin.password || !newAdmin.schoolId) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Get current user for created_by field
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Call edge function to create admin user with super admin privileges
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          userData: {
            email: newAdmin.email,
            fullName: newAdmin.fullName,
            mobile: newAdmin.mobile,
            password: newAdmin.password,
            role: 'admin',
            schoolId: newAdmin.schoolId,
            createdBy: currentUser?.id
          }
        }
      });

      if (error) throw error;

      // Reset form
      setNewAdmin({
        email: '',
        fullName: '',
        mobile: '',
        password: '',
        schoolId: '',
        schoolName: ''
      });

      setShowCreateDialog(false);
      await fetchAdminUsers();

      toast({
        title: t.adminCreated,
        description: `Administrator for ${newAdmin.schoolName} created successfully`,
      });

    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create administrator",
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

            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="flex-1">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  <SelectValue placeholder={t.filterBySchool} />
                </div>
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

      {/* Admin List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.schoolAdmins}
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t.createAdmin}
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
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.school_name}</p>
                    </div>
                    <Badge className={getStatusColor(user.status)}>
                      {t[user.status as keyof typeof t] || user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground ml-13">
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
                      <Users className="h-3 w-3" />
                      {user.total_users_managed} users
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updateUserStatus(user.user_id, 'approved')}
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
                            <TabsTrigger value="school">{t.schoolInfo}</TabsTrigger>
                            <TabsTrigger value="activity">{t.activityLog}</TabsTrigger>
                          </TabsList>

                          <TabsContent value="personal" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Name</Label>
                                <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Email</Label>
                                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">{t.phone}</Label>
                                <p className="text-sm text-muted-foreground">{selectedUser.mobile || 'Not provided'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <Badge className={getStatusColor(selectedUser.status)}>
                                  {selectedUser.status}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">{t.registeredOn}</Label>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(selectedUser.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">{t.usersManaged}</Label>
                                <p className="text-sm text-muted-foreground">{selectedUser.total_users_managed}</p>
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t">
                              <Label className="text-sm font-medium">Actions</Label>
                              <div className="mt-2 flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => resetPassword(selectedUser.user_id)}
                                  className="gap-1"
                                >
                                  <Key className="h-3 w-3" />
                                  {t.resetPassword}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-1"
                                >
                                  <Users className="h-3 w-3" />
                                  {t.manageUsers}
                                </Button>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="school" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">School Name</Label>
                                <p className="text-sm text-muted-foreground">{selectedUser.school_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">School ID</Label>
                                <p className="text-sm text-muted-foreground">{selectedUser.school_id}</p>
                              </div>
                            </div>
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

      {/* Create Admin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <Label className="text-sm font-medium">{t.email}</Label>
                  <Input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="admin@school.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.fullName}</Label>
                  <Input
                    value={newAdmin.fullName}
                    onChange={(e) => setNewAdmin({...newAdmin, fullName: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.phone}</Label>
                  <Input
                    value={newAdmin.mobile}
                    onChange={(e) => setNewAdmin({...newAdmin, mobile: e.target.value})}
                    placeholder="+919876543210"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.password}</Label>
                  <Input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    placeholder="Temporary password"
                  />
                </div>
              </div>
            </div>

            {/* School Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t.schoolAssignment}</h3>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.school}</Label>
                <Select 
                  value={newAdmin.schoolId} 
                  onValueChange={(value) => {
                    const school = schools.find(s => s.id === value);
                    setNewAdmin({
                      ...newAdmin, 
                      schoolId: value,
                      schoolName: school?.name || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectSchool} />
                  </SelectTrigger>
                  <SelectContent>
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
              <Button onClick={createAdmin}>
                {t.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminUserManagement;