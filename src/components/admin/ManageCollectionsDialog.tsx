import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface Collection {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  email: string;
}

export const ManageCollectionsDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<"owner" | "editor" | "viewer">("viewer");

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [collectionsRes, usersRes] = await Promise.all([
        supabase.from('collections' as any).select('id, name'),
        supabase.from('profiles' as any).select('id, email')
      ]);

      if (collectionsRes.error) throw collectionsRes.error;
      if (usersRes.error) throw usersRes.error;

      setCollections((collectionsRes.data as any) || []);
      setUsers((usersRes.data as any) || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCollection || !selectedUser) {
      toast.error("Please select both collection and user");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_collections' as any)
        .upsert({
          user_id: selectedUser,
          collection_id: selectedCollection,
          role: selectedRole,
        } as any, {
          onConflict: 'user_id,collection_id'
        });

      if (error) throw error;

      toast.success("Collection access granted!");
      setOpen(false);
      setSelectedCollection("");
      setSelectedUser("");
      setSelectedRole("viewer");
    } catch (error: any) {
      console.error("Error granting access:", error);
      toast.error("Failed to grant collection access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Users className="w-4 h-4" />
          Manage Collections
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Share Collection Access</DialogTitle>
            <DialogDescription>
              Grant users access to collections
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger id="collection">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Access Level</Label>
              <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer (Read only)</SelectItem>
                  <SelectItem value="editor">Editor (Can edit)</SelectItem>
                  <SelectItem value="owner">Owner (Full control)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Granting..." : "Grant Access"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
