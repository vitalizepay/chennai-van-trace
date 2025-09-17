import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  School, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Bus,
  Building
} from "lucide-react";

interface SchoolData {
  id: string;
  name: string;
  location: string;
  address: string;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'active' | 'inactive';
  total_vans: number;
  total_students: number;
  created_at: string;
}

interface SchoolManagementProps {
  language: "en" | "ta";
}

const SchoolManagement = ({ language }: SchoolManagementProps) => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolData | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    status: 'active' as 'active' | 'inactive'
  });

  const texts = {
    en: {
      title: "School Management",
      addSchool: "Add New School",
      editSchool: "Edit School",
      deleteSchool: "Delete School",
      schoolName: "School Name",
      location: "Location",
      address: "Full Address",
      contactEmail: "Contact Email",
      contactPhone: "Contact Phone",
      status: "Status",
      active: "Active",
      inactive: "Inactive",
      totalVans: "Total Vans",
      totalStudents: "Total Students",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      save: "Save Changes",
      create: "Create School",
      cancel: "Cancel",
      confirmDelete: "Are you sure you want to delete this school?",
      deleteWarning: "This action cannot be undone. All vans and associated data will be permanently removed.",
      noSchools: "No schools found",
      schoolCreated: "School created successfully",
      schoolUpdated: "School updated successfully",
      schoolDeleted: "School deleted successfully",
      error: "Error",
      createdOn: "Created on"
    },
    ta: {
      title: "பள்ளி மேலாண்மை",
      addSchool: "புதிய பள்ளியைச் சேர்க்கவும்",
      editSchool: "பள்ளியைத் திருத்தவும்",
      deleteSchool: "பள்ளியை நீக்கவும்",
      schoolName: "பள்ளி பெயர்",
      location: "இடம்",
      address: "முழு முகவரி",
      contactEmail: "தொடர்பு மின்னஞ்சல்",
      contactPhone: "தொடர்பு தொலைபேசி",
      status: "நிலை",
      active: "செயலில்",
      inactive: "செயலில் இல்லை",
      totalVans: "மொத்த வேன்கள்",
      totalStudents: "மொத்த மாணவர்கள்",
      actions: "செயல்கள்",
      edit: "திருத்து",
      delete: "நீக்கு",
      save: "மாற்றங்களைச் சேமிக்கவும்",
      create: "பள்ளியை உருவாக்கவும்",
      cancel: "ரத்து செய்",
      confirmDelete: "இந்த பள்ளியை நீக்க விரும்புகிறீர்களா?",
      deleteWarning: "இந்த செயலை செயல்தவிர்க்க முடியாது. அனைத்து வேன்கள் மற்றும் தொடர்புடைய தரவுகள் நிரந்தரமாக அகற்றப்படும்.",
      noSchools: "பள்ளிகள் இல்லை",
      schoolCreated: "பள்ளி வெற்றிகரமாக உருவாக்கப்பட்டது",
      schoolUpdated: "பள்ளி வெற்றிகரமாக புதுப்பிக்கப்பட்டது",
      schoolDeleted: "பள்ளி வெற்றிகரமாக நீக்கப்பட்டது",
      error: "பிழை",
      createdOn: "உருவாக்கப்பட்ட தேதி"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools((data || []) as SchoolData[]);
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      toast({
        title: t.error,
        description: "Failed to fetch schools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      address: '',
      contact_email: '',
      contact_phone: '',
      status: 'active'
    });
    setEditingSchool(null);
  };

  const handleCreate = async () => {
    console.log('handleCreate called with formData:', formData);
    try {
      if (!formData.name || !formData.location || !formData.address) {
        console.log('Validation failed:', { name: formData.name, location: formData.location, address: formData.address });
        toast({
          title: t.error,
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to insert school:', formData);
      const { error } = await supabase
        .from('schools')
        .insert([{
          name: formData.name,
          location: formData.location,
          address: formData.address,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          status: formData.status
        }]);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('School created successfully');
      toast({
        title: t.schoolCreated,
        description: `${formData.name} has been added successfully`,
      });

      setShowCreateDialog(false);
      resetForm();
      fetchSchools();
    } catch (error: any) {
      console.error('Error creating school:', error);
      toast({
        title: t.error,
        description: error.message || "Failed to create school",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (school: SchoolData) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      location: school.location,
      address: school.address,
      contact_email: school.contact_email || '',
      contact_phone: school.contact_phone || '',
      status: school.status
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingSchool) return;

    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: formData.name,
          location: formData.location,
          address: formData.address,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          status: formData.status
        })
        .eq('id', editingSchool.id);

      if (error) throw error;

      toast({
        title: t.schoolUpdated,
        description: `${formData.name} has been updated successfully`,
      });

      setShowEditDialog(false);
      setEditingSchool(null);
      resetForm();
      fetchSchools();
    } catch (error: any) {
      console.error('Error updating school:', error);
      toast({
        title: t.error,
        description: error.message || "Failed to update school",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (school: SchoolData) => {
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', school.id);

      if (error) throw error;

      toast({
        title: t.schoolDeleted,
        description: `${school.name} has been deleted successfully`,
      });

      setSchoolToDelete(null);
      fetchSchools();
    } catch (error: any) {
      console.error('Error deleting school:', error);
      toast({
        title: t.error,
        description: error.message || "Failed to delete school",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{t.title}</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          console.log('Create dialog state changed:', open);
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              console.log('Add school button clicked');
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="h-4 w-4" />
              {t.addSchool}
            </Button>
          </DialogTrigger>
          <SchoolFormDialog />
        </Dialog>
      </div>

      {/* Schools List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : schools.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <School className="h-12 w-12 mx-auto mb-2" />
                <p>{t.noSchools}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          schools.map((school) => (
            <Card key={school.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <School className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {school.location}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(school.status)}>
                    {t[school.status as keyof typeof t]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Address:</span>
                      <span className="text-muted-foreground">{school.address}</span>
                    </div>
                    {school.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span className="text-muted-foreground">{school.contact_email}</span>
                      </div>
                    )}
                    {school.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span className="text-muted-foreground">{school.contact_phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t.totalVans}:</span>
                      <span className="text-muted-foreground">{school.total_vans}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t.totalStudents}:</span>
                      <span className="text-muted-foreground">{school.total_students}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.createdOn}: {new Date(school.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Dialog open={showEditDialog} onOpenChange={(open) => {
                    console.log('Edit dialog state changed:', open);
                    setShowEditDialog(open);
                    if (!open) {
                      setEditingSchool(null);
                      resetForm();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleEdit(school)}>
                        <Edit className="h-3 w-3" />
                        {t.edit}
                      </Button>
                    </DialogTrigger>
                    <SchoolFormDialog isEdit />
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => setSchoolToDelete(school)}>
                        <Trash2 className="h-3 w-3" />
                        {t.delete}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.deleteSchool}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.confirmDelete}
                          <br />
                          <strong className="text-destructive">{school.name}</strong>
                          <br />
                          <br />
                          {t.deleteWarning}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSchoolToDelete(null)}>
                          {t.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(school)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t.delete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  function SchoolFormDialog({ isEdit = false }: { isEdit?: boolean }) {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            {isEdit ? t.editSchool : t.addSchool}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the school information below" : "Fill in the details to add a new school"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.schoolName} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter school name"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.location} *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Chennai Central"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t.address} *</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.contactEmail}</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                placeholder="admin@school.edu"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.contactPhone}</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                placeholder="+91-44-12345678"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                if (isEdit) {
                  setShowEditDialog(false);
                  setEditingSchool(null);
                } else {
                  setShowCreateDialog(false);
                }
                resetForm();
              }}
            >
              {t.cancel}
            </Button>
            <Button onClick={isEdit ? handleUpdate : handleCreate}>
              {isEdit ? t.save : t.create}
            </Button>
          </div>
        </div>
      </DialogContent>
    );
  }
};

export default SchoolManagement;