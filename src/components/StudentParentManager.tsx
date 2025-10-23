import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Users, UserPlus, Search, Loader2 } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  grade: string | null;
  pickup_stop: string;
  parent_id: string | null;
  parent_name: string | null;
  parent_email: string | null;
  van_number: string | null;
  school_id: string;
}

interface Parent {
  user_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
}

const StudentParentManager = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all students with their parent info
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          grade,
          pickup_stop,
          parent_id,
          school_id,
          vans (van_number)
        `)
        .order('full_name');

      if (studentsError) throw studentsError;

      // Fetch parent profiles separately
      const { data: parentsData, error: parentsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', 
          studentsData
            ?.filter(s => s.parent_id)
            .map(s => s.parent_id) || []
        );

      if (parentsError) throw parentsError;

      // Map students with parent info
      const studentsWithParents = studentsData?.map(student => ({
        id: student.id,
        full_name: student.full_name,
        grade: student.grade,
        pickup_stop: student.pickup_stop,
        parent_id: student.parent_id,
        parent_name: parentsData?.find(p => p.user_id === student.parent_id)?.full_name || null,
        parent_email: parentsData?.find(p => p.user_id === student.parent_id)?.email || null,
        van_number: student.vans?.[0]?.van_number || null,
        school_id: student.school_id
      })) || [];

      setStudents(studentsWithParents);

      // Fetch all parent users
      const { data: allParentsData, error: allParentsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'parent');

      if (allParentsError) throw allParentsError;

      const parentIds = allParentsData?.map(r => r.user_id) || [];

      const { data: parentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, mobile')
        .in('user_id', parentIds);

      if (profilesError) throw profilesError;

      setParents(parentProfiles || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load students and parents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignParent = (student: Student) => {
    setSelectedStudent(student);
    setSelectedParentId(student.parent_id || "");
    setIsAssignDialogOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedStudent) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ parent_id: selectedParentId || null })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Parent assigned successfully"
      });

      setIsAssignDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error assigning parent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign parent",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student-Parent Management
            </CardTitle>
            <CardDescription>
              Assign parents to students for van tracking access
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student or parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Van</TableHead>
                <TableHead>Assigned Parent</TableHead>
                <TableHead>Parent Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.grade || "N/A"}</TableCell>
                    <TableCell>
                      {student.van_number ? (
                        <Badge variant="outline">{student.van_number}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No van</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.parent_name ? (
                        <span>{student.parent_name}</span>
                      ) : (
                        <Badge variant="destructive">No Parent</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.parent_email || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignParent(student)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {student.parent_id ? "Change" : "Assign"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Assign Parent Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Assign Parent to {selectedStudent?.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Parent</label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Parent (Unassign)</SelectItem>
                    {parents.map((parent) => (
                      <SelectItem key={parent.user_id} value={parent.user_id}>
                        {parent.full_name} ({parent.email})
                        {parent.mobile && ` - ${parent.mobile}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAssignment} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default StudentParentManager;
