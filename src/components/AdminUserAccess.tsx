import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, RefreshCw } from "lucide-react";

interface UserAccessManagerProps {
  language: "en" | "ta";
}

const AdminUserAccess = ({ language }: UserAccessManagerProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const texts = {
    en: {
      title: "User Access Management",
      refresh: "Refresh Users",
      approve: "Approve",
      reject: "Reject", 
      status: "Status",
      userType: "Type",
      mobile: "Mobile",
      email: "Email",
      actions: "Actions",
      approved: "Approved",
      pending: "Pending",
      rejected: "Rejected"
    },
    ta: {
      title: "பயனர் அணுகல் நிர்வாகம்",
      refresh: "பயனர்களை புதுப்பிக்கவும்",
      approve: "ஒப்புதல்",
      reject: "நிராகரி",
      status: "நிலை", 
      userType: "வகை",
      mobile: "மொபைல்",
      email: "மின்னஞ்சல்",
      actions: "செயல்கள்",
      approved: "ஒப்புதல் அளிக்கப்பட்டது",
      pending: "நிலுவையில்",
      rejected: "நிராகரிக்கப்பட்டது"
    }
  };

  const t = texts[language];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role,
            school_id,
            schools (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `User ${status} successfully`,
        className: status === 'approved' ? "bg-success text-success-foreground" : undefined
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error", 
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">{t.approved}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t.rejected}</Badge>;
      default:
        return <Badge variant="secondary">{t.pending}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.title}
            </div>
            <Button onClick={fetchUsers} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.user_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.full_name}</h3>
                      {getStatusBadge(user.status)}
                      <Badge variant="outline">
                        {user.user_roles?.[0]?.role || 'No Role'}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span>{t.email}: {user.email}</span>
                      <span>{t.mobile}: {user.mobile || 'Not provided'}</span>
                      {user.user_roles?.[0]?.schools?.name && (
                        <span>School: {user.user_roles[0].schools.name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {user.status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => updateUserStatus(user.user_id, 'approved')}
                        className="gap-1"
                      >
                        <UserCheck className="h-4 w-4" />
                        {t.approve}
                      </Button>
                    )}
                    {user.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateUserStatus(user.user_id, 'rejected')}
                        className="gap-1"
                      >
                        <UserX className="h-4 w-4" />
                        {t.reject}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            
            {users.length === 0 && !loading && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserAccess;