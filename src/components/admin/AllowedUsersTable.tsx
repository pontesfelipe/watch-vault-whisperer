import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddAllowedUserDialog } from "./AddAllowedUserDialog";
import { format } from "date-fns";

interface AllowedUser {
  id: string;
  email: string;
  added_at: string;
  notes: string | null;
}

export function AllowedUsersTable() {
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAllowedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('allowed_users' as any)
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      setAllowedUsers((data as any as AllowedUser[]) || []);
    } catch (error) {
      console.error("Error fetching allowed users:", error);
      toast.error("Failed to load allowed users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllowedUsers();
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove access for ${email}? This will also delete all their data if they have an account.`)) return;

    try {
      // Check if user exists in profiles by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profile) {
        // User exists - delete via edge function which handles all data cleanup
        const { error: deleteError } = await supabase.functions.invoke('delete-user', {
          body: { userId: profile.id, selfDelete: false }
        });

        if (deleteError) throw deleteError;
        toast.success("User and all their data deleted");
      } else {
        // No user account - just remove from allowed_users
        const { error } = await supabase
          .from('allowed_users' as any)
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success("User access removed");
      }

      fetchAllowedUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to remove user");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {allowedUsers.length} {allowedUsers.length === 1 ? "user" : "users"} allowed
        </p>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Email
        </Button>
      </div>

      {allowedUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No allowed users yet. Add an email to grant access.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allowedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{format(new Date(user.added_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.email)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddAllowedUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchAllowedUsers}
      />
    </div>
  );
}
