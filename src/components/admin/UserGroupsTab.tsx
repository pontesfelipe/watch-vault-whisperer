import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Users, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface ProfileLite {
  id: string;
  email: string;
  full_name: string | null;
}

interface MemberRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

export function UserGroupsTab() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#5A85C7");
  const [submitting, setSubmitting] = useState(false);

  const [manageGroup, setManageGroup] = useState<UserGroup | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileLite[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [memberLoading, setMemberLoading] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_groups" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const groupList = (data as any as UserGroup[]) || [];
      // Fetch member counts
      const counts = await Promise.all(
        groupList.map(async (g) => {
          const { count } = await supabase
            .from("user_group_members" as any)
            .select("*", { count: "exact", head: true })
            .eq("group_id", g.id);
          return { id: g.id, count: count ?? 0 };
        })
      );
      const countMap = new Map(counts.map((c) => [c.id, c.count]));
      setGroups(groupList.map((g) => ({ ...g, member_count: countMap.get(g.id) ?? 0 })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_groups" as any).insert({
        name: name.trim(),
        description: description.trim() || null,
        color,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Group created");
      setCreateOpen(false);
      setName("");
      setDescription("");
      setColor("#5A85C7");
      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (group: UserGroup) => {
    if (!confirm(`Delete group "${group.name}"? Members are removed but their accounts are not deleted.`)) return;
    try {
      const { error } = await supabase.from("user_groups" as any).delete().eq("id", group.id);
      if (error) throw error;
      toast.success("Group deleted");
      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete group");
    }
  };

  const openManage = async (group: UserGroup) => {
    setManageGroup(group);
    setSelectedToAdd(new Set());
    setMemberLoading(true);
    try {
      const [{ data: profiles, error: pErr }, { data: memberRows, error: mErr }] = await Promise.all([
        supabase.from("profiles" as any).select("id, email, full_name").order("email"),
        supabase.from("user_group_members" as any).select("user_id").eq("group_id", group.id),
      ]);
      if (pErr) throw pErr;
      if (mErr) throw mErr;

      const profileList = (profiles as any as ProfileLite[]) || [];
      setAllProfiles(profileList);
      const memberIds = new Set(((memberRows as any[]) || []).map((r) => r.user_id));
      const memberList: MemberRow[] = profileList
        .filter((p) => memberIds.has(p.id))
        .map((p) => ({ user_id: p.id, email: p.email, full_name: p.full_name }));
      setMembers(memberList);
    } catch (err: any) {
      toast.error(err.message || "Failed to load members");
    } finally {
      setMemberLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!manageGroup || selectedToAdd.size === 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = Array.from(selectedToAdd).map((uid) => ({
        group_id: manageGroup.id,
        user_id: uid,
        added_by: user?.id ?? null,
      }));
      const { error } = await supabase.from("user_group_members" as any).insert(rows);
      if (error) throw error;
      toast.success(`Added ${rows.length} member${rows.length > 1 ? "s" : ""}`);
      openManage(manageGroup);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || "Failed to add members");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!manageGroup) return;
    try {
      const { error } = await supabase
        .from("user_group_members" as any)
        .delete()
        .eq("group_id", manageGroup.id)
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Member removed");
      openManage(manageGroup);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  const memberIdSet = new Set(members.map((m) => m.user_id));
  const candidates = allProfiles.filter((p) => !memberIdSet.has(p.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Groups
            </CardTitle>
            <CardDescription>
              Organize users into groups for shared management and email broadcasts
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No groups yet. Create one to start organizing users.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: g.color || "#5A85C7" }}
                            aria-hidden
                          />
                          <span className="font-medium">{g.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-md">
                        {g.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{g.member_count ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openManage(g)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(g)}
                            aria-label={`Delete group ${g.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User Group</DialogTitle>
            <DialogDescription>
              Group users together to manage them and send emails as a batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">Name</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beta testers"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Description (optional)</Label>
              <Textarea
                id="group-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                rows={3}
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-color">Color</Label>
              <Input
                id="group-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 p-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage members dialog */}
      <Dialog open={!!manageGroup} onOpenChange={(o) => !o && setManageGroup(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage members — {manageGroup?.name}</DialogTitle>
            <DialogDescription>
              Add or remove users from this group.
            </DialogDescription>
          </DialogHeader>
          {memberLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div>
                <h4 className="text-sm font-semibold mb-2">Current members ({members.length})</h4>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  {members.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">No members yet.</p>
                  ) : (
                    members.map((m) => (
                      <div
                        key={m.user_id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-0"
                      >
                        <div className="text-sm min-w-0">
                          <div className="font-medium truncate">{m.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.user_id)}
                          aria-label={`Remove ${m.email}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Add users</h4>
                  <Button
                    size="sm"
                    onClick={handleAddMembers}
                    disabled={selectedToAdd.size === 0}
                  >
                    Add ({selectedToAdd.size})
                  </Button>
                </div>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  {candidates.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">All users are already members.</p>
                  ) : (
                    candidates.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={selectedToAdd.has(p.id)}
                          onCheckedChange={(checked) => {
                            const next = new Set(selectedToAdd);
                            if (checked) next.add(p.id);
                            else next.delete(p.id);
                            setSelectedToAdd(next);
                          }}
                        />
                        <div className="text-sm min-w-0">
                          <div className="font-medium truncate">{p.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageGroup(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}