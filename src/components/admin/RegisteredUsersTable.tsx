import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { Shield, User, Pencil, AlertCircle } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";

interface RegisteredUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: "admin" | "user";
}

export function RegisteredUsersTable() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles' as any)
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles as any[] || []).map(async (profile: any) => {
          const { data: roleData } = await supabase
            .from('user_roles' as any)
            .select('role')
            .eq('user_id', profile.id)
            .eq('role', 'admin')
            .maybeSingle();

          return {
            ...profile,
            role: roleData ? "admin" : "user",
          } as RegisteredUser;
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load registered users");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This shows users who have created accounts. Users in "Allowed Users" are pre-approved but may not have signed up yet.
        </AlertDescription>
      </Alert>
      
      <p className="text-sm text-muted-foreground">
        {users.length} {users.length === 1 ? "user" : "users"} registered
      </p>

      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No registered users yet
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          User
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(user)}
                      className="gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
}
