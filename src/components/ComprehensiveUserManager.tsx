import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Key, Loader2, Copy, CheckCircle2 } from "lucide-react";

interface ComprehensiveUserManagerProps {
  language: "en" | "ta";
}

interface School {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  mobile: string | null;
  status: string;
  role: string;
  school_name?: string;
}

const ComprehensiveUserManager = ({ language }: ComprehensiveUserManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    role: "parent",
    fullName: "",
    email: "",
    phone: "",
    schoolId: "",
    // Driver specific
    licenseNumber: "",
    experienceYears: "",
    // Parent specific
    address: "",
    emergencyContact: "",
    childrenCount: "1",
  });

  const texts = {
    en: {
      title: "User Management System",
      description: "Create and manage users for all roles",
      createUser: "Create New User",
      allUsers: "All Users",
      role: "Role",
      admin: "Admin",
      parent: "Parent",
      driver: "Driver",
      fullName: "Full Name",
      email: "Email",
      phone: "Mobile Number",
      school: "School",
      selectSchool: "Select School",
      licenseNumber: "License Number",
      experienceYears: "Experience (Years)",
      address: "Address",
      emergencyContact: "Emergency Contact",
      childrenCount: "Number of Children",
      creating: "Creating...",
      create: "Create User",
      resetPassword: "Reset Password",
      resetting: "Resetting...",
      tempPasswordTitle: "Temporary Password",
      tempPasswordDesc: "Share this password with the user. They should change it on first login.",
      copyPassword: "Copy Password",
      copied: "Copied!",
      close: "Close",
      loading: "Loading...",
      noUsers: "No users found",
      userCreated: "User created successfully",
      passwordReset: "Password reset successfully",
      error: "An error occurred",
      name: "Name",
      mobile: "Mobile",
      status: "Status",
      actions: "Actions",
    },
    ta: {
      title: "பயனர் மேலாண்மை அமைப்பு",
      description: "அனைத்து பாத்திரங்களுக்கும் பயனர்களை உருவாக்கி நிர்வகிக்கவும்",
      createUser: "புதிய பயனரை உருவாக்கு",
      allUsers: "அனைத்து பயனர்கள்",
      role: "பாத்திரம்",
      admin: "நிர்வாகி",
      parent: "பெற்றோர்",
      driver: "ஓட்டுநர்",
      fullName: "முழு பெயர்",
      email: "மின்னஞ்சல்",
      phone: "கைபேசி எண்",
      school: "பள்ளி",
      selectSchool: "பள்ளியைத் தேர்ந்தெடுக்கவும்",
      licenseNumber: "உரிம எண்",
      experienceYears: "அனுபவம் (வருடங்கள்)",
      address: "முகவரி",
      emergencyContact: "அவசர தொடர்பு",
      childrenCount: "குழந்தைகளின் எண்ணிக்கை",
      creating: "உருவாக்குகிறது...",
      create: "பயனரை உருவாக்கு",
      resetPassword: "கடவுச்சொல்லை மீட்டமை",
      resetting: "மீட்டமைக்கிறது...",
      tempPasswordTitle: "தற்காலிக கடவுச்சொல்",
      tempPasswordDesc: "இந்த கடவுச்சொல்லை பயனருடன் பகிரவும். முதல் உள்நுழைவில் அவர்கள் மாற்ற வேண்டும்.",
      copyPassword: "கடவுச்சொல்லை நகலெடு",
      copied: "நகலெடுக்கப்பட்டது!",
      close: "மூடு",
      loading: "ஏற்றுகிறது...",
      noUsers: "பயனர்கள் இல்லை",
      userCreated: "பயனர் வெற்றிகரமாக உருவாக்கப்பட்டது",
      passwordReset: "கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது",
      error: "பிழை ஏற்பட்டது",
      name: "பெயர்",
      mobile: "கைபேசி",
      status: "நிலை",
      actions: "செயல்கள்",
    },
  };

  const t = texts[language];

  useEffect(() => {
    fetchSchools();
    fetchUsers();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          user_id,
          full_name,
          email,
          mobile,
          status,
          user_roles (
            role,
            schools (name)
          )
        `)
        .order("full_name");

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map((user: any) => ({
        id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        mobile: user.mobile,
        status: user.status,
        role: user.user_roles?.[0]?.role || "unknown",
        school_name: user.user_roles?.[0]?.schools?.name || "",
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error("Not authenticated");
      }

      const userData = {
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        schoolId: formData.schoolId || null,
        createdBy: session.session.user.id,
        // Driver specific
        ...(formData.role === "driver" && {
          licenseNumber: formData.licenseNumber,
          experienceYears: formData.experienceYears,
        }),
        // Parent specific
        ...(formData.role === "parent" && {
          address: formData.address,
          emergencyContact: formData.emergencyContact || formData.phone,
          childrenCount: formData.childrenCount,
        }),
      };

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { userData },
      });

      if (error) throw error;

      if (data.success) {
        setTempPassword(data.tempPassword);
        setSelectedUser({
          id: data.user.id,
          email: formData.email,
          full_name: formData.fullName,
          mobile: formData.phone,
          status: "approved",
          role: formData.role,
        });
        setShowPasswordDialog(true);

        // Reset form
        setFormData({
          role: "parent",
          fullName: "",
          email: "",
          phone: "",
          schoolId: "",
          licenseNumber: "",
          experienceYears: "",
          address: "",
          emergencyContact: "",
          childrenCount: "1",
        });

        fetchUsers();

        toast({
          title: t.userCreated,
          description: `${formData.fullName} has been created`,
        });
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data.success) {
        setTempPassword(data.tempPassword);
        setSelectedUser(user);
        setShowPasswordDialog(true);

        toast({
          title: t.passwordReset,
          description: `Password reset for ${user.full_name}`,
        });
      }
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(tempPassword);
    toast({
      title: t.copied,
      description: "Password copied to clipboard",
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "default",
      parent: "secondary",
      driver: "outline",
    };
    return <Badge variant={variants[role] || "outline"}>{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">
            <UserPlus className="h-4 w-4 mr-2" />
            {t.createUser}
          </TabsTrigger>
          <TabsTrigger value="list">
            <Users className="h-4 w-4 mr-2" />
            {t.allUsers}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">{t.role}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">{t.parent}</SelectItem>
                    <SelectItem value="driver">{t.driver}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">{t.school}</Label>
                  <Select
                    value={formData.schoolId}
                    onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectSchool} />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.role === "driver" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">{t.licenseNumber}</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="DL1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">{t.experienceYears}</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                </div>
              )}

              {formData.role === "parent" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">{t.address}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, City"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">{t.emergencyContact}</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="9876543210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="childrenCount">{t.childrenCount}</Label>
                      <Input
                        id="childrenCount"
                        type="number"
                        value={formData.childrenCount}
                        onChange={(e) => setFormData({ ...formData, childrenCount: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateUser}
                disabled={loading || !formData.fullName || !formData.email || !formData.phone}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.creating}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t.create}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">{t.loading}</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t.noUsers}</div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{user.full_name}</h4>
                              {getRoleBadge(user.role)}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.mobile && (
                              <p className="text-sm text-muted-foreground">{user.mobile}</p>
                            )}
                            {user.school_name && (
                              <p className="text-sm text-muted-foreground">{user.school_name}</p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleResetPassword(user)}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.resetting}
                              </>
                            ) : (
                              <>
                                <Key className="mr-2 h-4 w-4" />
                                {t.resetPassword}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t.tempPasswordTitle}
            </DialogTitle>
            <DialogDescription>{t.tempPasswordDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm">
                  <strong>{t.name}:</strong> {selectedUser.full_name}
                </p>
                <p className="text-sm">
                  <strong>{t.email}:</strong> {selectedUser.email}
                </p>
                {selectedUser.mobile && (
                  <p className="text-sm">
                    <strong>{t.mobile}:</strong> {selectedUser.mobile}
                  </p>
                )}
                <p className="text-sm">
                  <strong>{t.role}:</strong> {selectedUser.role}
                </p>
              </div>
            )}
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="font-mono text-lg font-bold text-center">{tempPassword}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                {t.copyPassword}
              </Button>
              <Button onClick={() => setShowPasswordDialog(false)} variant="outline" className="flex-1">
                {t.close}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComprehensiveUserManager;
