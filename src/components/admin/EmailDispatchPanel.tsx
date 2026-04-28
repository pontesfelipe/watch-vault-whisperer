import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Send, Users, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface UserOption {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface GroupOption {
  id: string;
  name: string;
  member_count: number;
}

type RecipientType = "user" | "group";

export function EmailDispatchPanel() {
  const [recipientType, setRecipientType] = useState<RecipientType>("user");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupMemberMap, setGroupMemberMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, errors: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, groupsRes, membersRes] = await Promise.all([
        supabase.from("profiles" as any).select("id, email, full_name").order("email"),
        supabase.from("user_groups" as any).select("id, name").order("name"),
        supabase.from("user_group_members" as any).select("group_id, user_id"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (membersRes.error) throw membersRes.error;

      const profiles: UserOption[] = ((profilesRes.data as any[]) || []).map((p: any) => ({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
      }));
      setUsers(profiles);

      const map = new Map<string, string[]>();
      ((membersRes.data as any[]) || []).forEach((row: any) => {
        const arr = map.get(row.group_id) || [];
        arr.push(row.user_id);
        map.set(row.group_id, arr);
      });
      setGroupMemberMap(map);

      const groupList: GroupOption[] = ((groupsRes.data as any[]) || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        member_count: (map.get(g.id) || []).length,
      }));
      setGroups(groupList);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load users and groups");
    } finally {
      setLoading(false);
    }
  };

  const sendToUser = async (user: UserOption) => {
    if (!user.email) return false;
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "custom-message",
        recipientEmail: user.email,
        idempotencyKey: `admin-dispatch-custom-${user.user_id}-${Date.now()}`,
        templateData: {
          userName: user.full_name || undefined,
          subject: customSubject,
          messageBody: customBody,
        },
      },
    });
    return !error;
  };

  const handleSend = async () => {
    if (!customSubject.trim() || !customBody.trim()) {
      toast.error("Fill in both subject and message");
      return;
    }
    if (customSubject.length > 200) {
      toast.error("Subject must be 200 characters or fewer");
      return;
    }
    if (customBody.length > 5000) {
      toast.error("Message must be 5000 characters or fewer");
      return;
    }

    setSending(true);
    try {
      if (recipientType === "user") {
        if (!selectedUserId) {
          toast.error("Select a user");
          setSending(false);
          return;
        }
        const user = users.find((u) => u.user_id === selectedUserId);
        if (!user?.email) {
          toast.error("User has no email on file");
          setSending(false);
          return;
        }
        const ok = await sendToUser(user);
        if (ok) toast.success("Email sent", { description: `To: ${user.email}` });
        else toast.error("Failed to send email");
      } else {
        if (!selectedGroupId) {
          toast.error("Select a group");
          setSending(false);
          return;
        }
        const memberIds = groupMemberMap.get(selectedGroupId) || [];
        const recipients = users.filter((u) => memberIds.includes(u.user_id) && u.email);
        if (recipients.length === 0) {
          toast.error("No users with email in this group");
          setSending(false);
          return;
        }

        setProgress({ sent: 0, total: recipients.length, errors: 0 });
        let sent = 0;
        let errors = 0;
        for (const u of recipients) {
          const ok = await sendToUser(u);
          if (ok) sent++;
          else errors++;
          setProgress({ sent: sent + errors, total: recipients.length, errors });
          await new Promise((r) => setTimeout(r, 300));
        }

        if (errors === 0) {
          toast.success(`Sent ${sent} email${sent > 1 ? "s" : ""}`);
        } else {
          toast.warning(`Sent ${sent}, ${errors} failed`);
        }
        setProgress({ sent: 0, total: 0, errors: 0 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Send error");
    } finally {
      setSending(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Send Email
        </CardTitle>
        <CardDescription>
          Send a branded message to a single user or to every member of a group.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Emails are sent with the Sora Vault logo and branding.
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="e.g. Important update for your collection"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  maxLength={200}
                />
                <span className="text-xs text-muted-foreground">{customSubject.length}/200</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Message</Label>
                <Textarea
                  id="email-body"
                  placeholder="Write your message here. Use blank lines to separate paragraphs."
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={6}
                  maxLength={5000}
                />
                <span className="text-xs text-muted-foreground">{customBody.length}/5000</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-sm font-medium">Recipient</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={recipientType === "user" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("user")}
                  className="justify-start"
                >
                  <User className="h-4 w-4 mr-2" />
                  Single user
                </Button>
                <Button
                  variant={recipientType === "group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("group")}
                  className="justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Group
                </Button>
              </div>

              {recipientType === "user" ? (
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user…" />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      {users.filter((u) => u.email).map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          <div className="flex items-center gap-2">
                            <span>{u.full_name || "—"}</span>
                            <span className="text-xs text-muted-foreground">({u.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group…" />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <div className="flex items-center gap-2">
                            <span>{g.name}</span>
                            <Badge variant="secondary" className="text-xs">{g.member_count} member{g.member_count === 1 ? "" : "s"}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroup && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Will send {selectedGroup.member_count} email{selectedGroup.member_count === 1 ? "" : "s"} individually.
                    </div>
                  )}
                </div>
              )}
            </div>

            {progress.total > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Sending…</span>
                  <span>{progress.sent}/{progress.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                  />
                </div>
                {progress.errors > 0 && (
                  <p className="text-xs text-destructive mt-1">{progress.errors} error{progress.errors === 1 ? "" : "s"}</p>
                )}
              </div>
            )}

            <Button onClick={handleSend} disabled={sending} className="w-full" size="lg">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}