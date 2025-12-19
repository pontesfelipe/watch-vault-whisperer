import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { Shield, User, Pencil, AlertCircle, Mail, Loader2 } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";

interface RegisteredUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: "admin" | "user";
  providers?: string[];
  providersLoading?: boolean;
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
            providers: undefined,
            providersLoading: true,
          } as RegisteredUser;
        })
      );

      setUsers(usersWithRoles);

      // Fetch providers for each user in the background
      usersWithRoles.forEach((user) => {
        fetchUserProviders(user.email);
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load registered users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProviders = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-providers", {
        body: { userEmail: email },
      });

      if (error || data?.error) {
        console.error("Failed to fetch providers for", email);
        setUsers((prev) =>
          prev.map((u) =>
            u.email === email ? { ...u, providers: [], providersLoading: false } : u
          )
        );
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.email === email
            ? { ...u, providers: data?.providers || [], providersLoading: false }
            : u
        )
      );
    } catch {
      setUsers((prev) =>
        prev.map((u) =>
          u.email === email ? { ...u, providers: [], providersLoading: false } : u
        )
      );
    }
  };

  const getProviderBadge = (provider: string) => {
    if (provider === "google") {
      return (
        <Badge key={provider} variant="secondary" className="gap-1 text-xs">
          <svg className="h-3 w-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Badge>
      );
    }
    if (provider === "email") {
      return (
        <Badge key={provider} variant="outline" className="gap-1 text-xs">
          <Mail className="h-3 w-3" />
          Email
        </Badge>
      );
    }
    return (
      <Badge key={provider} variant="outline" className="text-xs">
        {provider}
      </Badge>
    );
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
                <TableHead>Sign-in Methods</TableHead>
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
                    {user.providersLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : user.providers && user.providers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.providers.map((p) => getProviderBadge(p))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
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
