import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, School, Car, Users, Shield, Phone, Mail, Loader2 } from "lucide-react";

interface UserCreationManagerProps {
  language: "en" | "ta";
}

const UserCreationManager = ({ language }: UserCreationManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<Array<{id: string, name: string}>>([]);
  const [vans, setVans] = useState<Array<{id: string, van_number: string, route_name: string}>>([]);
  const [formData, setFormData] = useState({
    userType: 'admin' as 'admin' | 'driver' | 'parent' | 'super_admin',
    email: '',
    mobile: '',
    fullName: '',
    schoolId: '',
    vanAssigned: '',
    routeAssigned: '',
    licenseNumber: '',
    childrenCount: '1'
  });
  const [students, setStudents] = useState<Array<{
    fullName: string;
    grade: string;
    pickupStop: string;
    medicalInfo: string;
  }>>([{ fullName: '', grade: '', pickupStop: '', medicalInfo: '' }]);

  const texts = {
    en: {
      title: "User Creation & Management",
      createUser: "Create New User",
      userType: "User Type",
      admin: "School Admin",
      driver: "Van Driver", 
      parent: "Parent",
      superAdmin: "Super Admin",
      email: "Email Address",
      mobile: "Mobile Number",
      fullName: "Full Name",
      school: "Select School",
      vanAssigned: "Van Number (Driver)",
      routeAssigned: "Route Name (Driver)",
      licenseNumber: "License Number (Driver)",
      childrenCount: "Number of Children (Parent)",
      studentDetails: "Student Details",
      studentName: "Student Name",
      studentGrade: "Grade/Class",
      pickupStop: "Pickup Stop",
      medicalInfo: "Medical Info (Optional)",
      addStudent: "Add Another Student",
      removeStudent: "Remove Student",
      assignVan: "Assign Van (Parent)",
      createAccount: "Create Account",
      creating: "Creating Account...",
      success: "User created successfully",
      error: "Failed to create user",
      testCredentials: "Test User Credentials",
      loginInstructions: "Login Instructions"
    },
    ta: {
      title: "பயனர் உருவாக்கம் மற்றும் நிர்வாகம்",
      createUser: "புதிய பயனர் உருவாக்கவும்",
      userType: "பயனர் வகை",
      admin: "பள்ளி நிர்வாகி",
      driver: "வேன் ஓட்டுநர்",
      parent: "பெற்றோர்",
      superAdmin: "சூப்பர் நிர்வாகி",
      email: "மின்னஞ்சல் முகவரி",
      mobile: "மொபைல் எண்",
      fullName: "முழு பெயர்",
      school: "பள்ளியைத் தேர்ந்தெடுக்கவும்",
      vanAssigned: "வேன் எண் (ஓட்டுநர்)",
      routeAssigned: "பாதை பெயர் (ஓட்டுநர்)",
      licenseNumber: "உரிம எண் (ஓட்டுநர்)",
      childrenCount: "குழந்தைகளின் எண்ணிக்கை (பெற்றோர்)",
      studentDetails: "மாணவர் விவரங்கள்",
      studentName: "மாணவர் பெயர்",
      studentGrade: "வகுப்பு",
      pickupStop: "பிக்கப் ஸ்டாப்",
      medicalInfo: "மருத்துவ தகவல் (விருப்பமானது)",
      addStudent: "மற்றொரு மாணவரைச் சேர்க்கவும்",
      removeStudent: "மாணவரை அகற்று",
      assignVan: "வேன் ஒதுக்கீடு (பெற்றோர்)",
      createAccount: "கணக்கை உருவாக்கவும்",
      creating: "கணக்கை உருவாக்குகிறது...",
      success: "பயனர் வெற்றிகரமாக உருவாக்கப்பட்டார்",
      error: "பயனர் உருவாக்க முடியவில்லை",
      testCredentials: "சோதனை பயனர் விவரங்கள்",
      loginInstructions: "உள்நுழைவு வழிமுறைகள்"
    }
  };

  const t = texts[language];

  // Fetch schools and vans on component mount
  useState(() => {
    const fetchData = async () => {
      const [schoolsData, vansData] = await Promise.all([
        supabase.from('schools').select('id, name').eq('status', 'active').order('name'),
        supabase.from('vans').select('id, van_number, route_name').eq('status', 'active').order('van_number')
      ]);
      
      if (schoolsData.data) setSchools(schoolsData.data);
      if (vansData.data) setVans(vansData.data);
    };
    fetchData();
  });

  const addStudent = () => {
    setStudents([...students, { fullName: '', grade: '', pickupStop: '', medicalInfo: '' }]);
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: string, value: string) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.mobile || !formData.fullName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    if (formData.userType !== 'super_admin' && !formData.schoolId) {
      toast({
        title: "School Required",
        description: "Please select a school for this user",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // First create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: 'password123', // Default password
        email_confirm: true,
        user_metadata: {
          full_name: formData.fullName,
          mobile: formData.mobile,
          role: formData.userType
        }
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: formData.email,
          full_name: formData.fullName,
          mobile: formData.mobile,
          status: 'approved'
        });

      if (profileError) throw profileError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: formData.userType,
          school_id: formData.userType === 'super_admin' ? null : formData.schoolId
        });

      if (roleError) throw roleError;

      // Create specific details based on user type
      if (formData.userType === 'driver') {
        const { error: driverError } = await supabase
          .from('driver_details')
          .insert({
            user_id: userId,
            license_number: formData.licenseNumber,
            van_assigned: formData.vanAssigned,
            route_assigned: formData.routeAssigned
          });

        if (driverError) throw driverError;
      } else if (formData.userType === 'parent') {
        // Validate student information
        const validStudents = students.filter(student => 
          student.fullName.trim() && student.grade.trim() && student.pickupStop.trim()
        );
        
        if (validStudents.length === 0) {
          throw new Error("Please provide at least one student with name, grade, and pickup stop");
        }

        const { error: parentError } = await supabase
          .from('parent_details')
          .insert({
            user_id: userId,
            children_count: validStudents.length
          });

        if (parentError) throw parentError;

        // Create students for this parent
        const studentsToCreate = validStudents.map(student => ({
          full_name: student.fullName.trim(),
          grade: student.grade.trim(), 
          pickup_stop: student.pickupStop.trim(),
          medical_info: student.medicalInfo.trim() || null,
          emergency_contact: formData.mobile, // Use parent mobile as emergency contact
          parent_id: userId,
          school_id: formData.schoolId,
          van_id: formData.vanAssigned || null,
          status: 'active',
          boarded: false,
          dropped: false
        }));

        const { error: studentsError } = await supabase
          .from('students')
          .insert(studentsToCreate);

        if (studentsError) throw studentsError;
      }

      toast({
        title: t.success,
        description: `${formData.fullName} (${formData.userType}) created successfully`,
        className: "bg-success text-success-foreground"
      });

      // Reset form
      setFormData({
        userType: 'admin',
        email: '',
        mobile: '',
        fullName: '',
        schoolId: '',
        vanAssigned: '',
        routeAssigned: '',
        licenseNumber: '',
        childrenCount: '1'
      });
      setStudents([{ fullName: '', grade: '', pickupStop: '', medicalInfo: '' }]);

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: t.error,
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserIcon = (type: string) => {
    switch (type) {
      case 'admin': return <School className="h-4 w-4" />;
      case 'driver': return <Car className="h-4 w-4" />;
      case 'parent': return <Users className="h-4 w-4" />;
      case 'super_admin': return <Shield className="h-4 w-4" />;
      default: return <UserPlus className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="space-y-4">
            <TabsList>
              <TabsTrigger value="create">{t.createUser}</TabsTrigger>
              <TabsTrigger value="credentials">{t.testCredentials}</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="userType">{t.userType}</Label>
                  <Select value={formData.userType} onValueChange={(value: any) => setFormData({...formData, userType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          {getUserIcon('admin')}
                          {t.admin}
                        </div>
                      </SelectItem>
                      <SelectItem value="driver">
                        <div className="flex items-center gap-2">
                          {getUserIcon('driver')}
                          {t.driver}
                        </div>
                      </SelectItem>
                      <SelectItem value="parent">
                        <div className="flex items-center gap-2">
                          {getUserIcon('parent')}
                          {t.parent}
                        </div>
                      </SelectItem>
                      <SelectItem value="super_admin">
                        <div className="flex items-center gap-2">
                          {getUserIcon('super_admin')}
                          {t.superAdmin}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="user@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <Label htmlFor="mobile">{t.mobile}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
                      placeholder="Enter 10-digit mobile number"
                      className="pl-10"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                {/* School Selection (except for super_admin) */}
                {formData.userType !== 'super_admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="school">{t.school}</Label>
                    <Select value={formData.schoolId} onValueChange={(value) => setFormData({...formData, schoolId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
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
                )}

                {/* Driver-specific fields */}
                {formData.userType === 'driver' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">{t.licenseNumber}</Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                        placeholder="Enter license number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vanAssigned">{t.vanAssigned}</Label>
                      <Input
                        id="vanAssigned"
                        value={formData.vanAssigned}
                        onChange={(e) => setFormData({...formData, vanAssigned: e.target.value})}
                        placeholder="e.g., VAN-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routeAssigned">{t.routeAssigned}</Label>
                      <Input
                        id="routeAssigned"
                        value={formData.routeAssigned}
                        onChange={(e) => setFormData({...formData, routeAssigned: e.target.value})}
                        placeholder="e.g., Anna Nagar Route"
                      />
                    </div>
                  </>
                )}

                {/* Parent-specific fields */}
                {formData.userType === 'parent' && (
                  <div className="col-span-2 space-y-4">
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {t.studentDetails}
                      </h3>
                      
                      {/* Van Assignment for Parent */}
                      <div className="mb-4">
                        <Label htmlFor="vanAssigned">{t.assignVan}</Label>
                        <Select value={formData.vanAssigned} onValueChange={(value) => setFormData({...formData, vanAssigned: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a van for students" />
                          </SelectTrigger>
                          <SelectContent>
                            {vans.map((van) => (
                              <SelectItem key={van.id} value={van.id}>
                                {van.van_number} - {van.route_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        {students.map((student, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium">Student {index + 1}</h4>
                              {students.length > 1 && (
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => removeStudent(index)}
                                  className="text-destructive"
                                >
                                  {t.removeStudent}
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>{t.studentName} *</Label>
                                <Input
                                  value={student.fullName}
                                  onChange={(e) => updateStudent(index, 'fullName', e.target.value)}
                                  placeholder="Enter student's full name"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>{t.studentGrade} *</Label>
                                <Input
                                  value={student.grade}
                                  onChange={(e) => updateStudent(index, 'grade', e.target.value)}
                                  placeholder="e.g., 5th Grade, Class 10"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>{t.pickupStop} *</Label>
                                <Input
                                  value={student.pickupStop}
                                  onChange={(e) => updateStudent(index, 'pickupStop', e.target.value)}
                                  placeholder="e.g., Anna Nagar, T. Nagar"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>{t.medicalInfo}</Label>
                                <Input
                                  value={student.medicalInfo}
                                  onChange={(e) => updateStudent(index, 'medicalInfo', e.target.value)}
                                  placeholder="Any medical conditions or allergies"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={addStudent}
                          className="w-full gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          {t.addStudent}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreateUser} 
                className="w-full gap-2" 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.creating}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {t.createAccount}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{t.loginInstructions}</h3>
                  <p className="text-sm text-muted-foreground">All users created through this system use default credentials</p>
                </div>
                
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Default Password
                        </Badge>
                        <p className="text-sm">
                          <strong>Password:</strong> <code className="bg-muted px-2 py-1 rounded">password123</code>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Users can login with their mobile number and this password
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <Badge variant="outline" className="gap-1">
                          <Phone className="h-3 w-3" />
                          Login Methods
                        </Badge>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Admin: Email + Password OR Mobile + Password</li>
                          <li>• Driver: Mobile + Password</li>
                          <li>• Parent: Mobile + Password</li>
                          <li>• Super Admin: Mobile + Password</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCreationManager;