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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Send, Users, User, Loader2, CheckCircle2, AlertCircle, Eye, History, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserOption { user_id: string; full_name: string | null; email: string | null; }
interface GroupOption { id: string; name: string; member_count: number; }
interface TemplateInfo { name: string; displayName: string; previewData: Record<string, any>; }
interface LogRow {
  id: string; template_name: string; recipient_email: string;
  status: string; error_message: string | null; created_at: string;
}

type RecipientType = "user" | "group";

export function EmailDispatchPanel() {
  const [recipientType, setRecipientType] = useState<RecipientType>("user");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom-message");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [groupMemberMap, setGroupMemberMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, errors: 0 });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [history, setHistory] = useState<LogRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => { fetchData(); fetchTemplates(); fetchHistory(); }, []);

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
        user_id: p.id, full_name: p.full_name, email: p.email,
      }));
      setUsers(profiles);
      const map = new Map<string, string[]>();
      ((membersRes.data as any[]) || []).forEach((row: any) => {
        const arr = map.get(row.group_id) || []; arr.push(row.user_id); map.set(row.group_id, arr);
      });
      setGroupMemberMap(map);
      setGroups(((groupsRes.data as any[]) || []).map((g: any) => ({
        id: g.id, name: g.name, member_count: (map.get(g.id) || []).length,
      })));
    } catch (err: any) {
      console.error(err); toast.error("Failed to load users and groups");
    } finally { setLoading(false); }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase.functions.invoke("admin-preview-email", {
      body: { listTemplates: true },
    });
    if (error) { console.error(error); return; }
    if (data?.templates) setTemplates(data.templates);
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("email_send_log" as any)
      .select("id, template_name, recipient_email, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) console.error(error);
    else setHistory((data as any[]) || []);
    setHistoryLoading(false);
  };

  const buildTemplateData = (user?: UserOption) => {
    if (selectedTemplate === "custom-message") {
      return {
        userName: user?.full_name || undefined,
        subject: customSubject,
        messageBody: customBody,
      };
    }
    if (selectedTemplate === "welcome") {
      return { firstName: user?.full_name?.split(" ")[0] || undefined };
    }
    return {};
  };

  const handlePreview = async () => {
    setPreviewLoading(true); setPreviewOpen(true);
    try {
      const sampleUser = users.find(u => u.user_id === selectedUserId) || users[0];
      const { data, error } = await supabase.functions.invoke("admin-preview-email", {
        body: { templateName: selectedTemplate, templateData: buildTemplateData(sampleUser) },
      });
      if (error) throw error;
      setPreviewHtml(data?.html || ""); setPreviewSubject(data?.subject || "");
    } catch (err: any) {
      console.error(err); toast.error("Failed to load preview");
      setPreviewOpen(false);
    } finally { setPreviewLoading(false); }
  };

  const sendToUser = async (user: UserOption) => {
    if (!user.email) return false;
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: selectedTemplate,
        recipientEmail: user.email,
        idempotencyKey: `admin-dispatch-${selectedTemplate}-${user.user_id}-${Date.now()}`,
        templateData: buildTemplateData(user),
      },
    });
    return !error;
  };

  const handleSend = async () => {
    if (selectedTemplate === "custom-message") {
      if (!customSubject.trim() || !customBody.trim()) {
        toast.error("Fill in both subject and message"); return;
      }
      if (customSubject.length > 200) { toast.error("Subject must be 200 characters or fewer"); return; }
      if (customBody.length > 5000) { toast.error("Message must be 5000 characters or fewer"); return; }
    }

    setSending(true);
    try {
      if (recipientType === "user") {
        if (!selectedUserId) { toast.error("Select a user"); setSending(false); return; }
        const user = users.find((u) => u.user_id === selectedUserId);
        if (!user?.email) { toast.error("User has no email on file"); setSending(false); return; }
        const ok = await sendToUser(user);
        if (ok) toast.success("Email sent", { description: `To: ${user.email}` });
        else toast.error("Failed to send email");
      } else {
        if (!selectedGroupId) { toast.error("Select a group"); setSending(false); return; }
        const memberIds = groupMemberMap.get(selectedGroupId) || [];
        const recipients = users.filter((u) => memberIds.includes(u.user_id) && u.email);
        if (recipients.length === 0) { toast.error("No users with email in this group"); setSending(false); return; }
        setProgress({ sent: 0, total: recipients.length, errors: 0 });
        let sent = 0, errors = 0;
        for (const u of recipients) {
          const ok = await sendToUser(u);
          if (ok) sent++; else errors++;
          setProgress({ sent: sent + errors, total: recipients.length, errors });
          await new Promise((r) => setTimeout(r, 300));
        }
        if (errors === 0) toast.success(`Sent ${sent} email${sent > 1 ? "s" : ""}`);
        else toast.warning(`Sent ${sent}, ${errors} failed`);
        setProgress({ sent: 0, total: 0, errors: 0 });
      }
      fetchHistory();
    } catch (err) {
      console.error(err); toast.error("Send error");
    } finally { setSending(false); }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const isCustom = selectedTemplate === "custom-message";

  const statusBadge = (status: string) => {
    const variant: any = status === "sent" ? "default"
      : status === "failed" || status === "bounced" || status === "complained" || status === "dlq" ? "destructive"
      : status === "suppressed" ? "secondary" : "outline";
    return <Badge variant={variant} className="text-xs capitalize">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" /> Email Dispatch
        </CardTitle>
        <CardDescription>
          Send branded emails to users or groups. Pick a template, preview, and review history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compose">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose"><Send className="h-4 w-4 mr-2" />Compose</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />History</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger><SelectValue placeholder="Pick a template…" /></SelectTrigger>
                    <SelectContent className="z-[60]">
                      {templates.map((t) => (
                        <SelectItem key={t.name} value={t.name}>{t.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isCustom && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Branded with the Sora Vault logo and styling.
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-subject">Subject</Label>
                      <Input id="email-subject" placeholder="e.g. Important update for your collection"
                        value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} maxLength={200} />
                      <span className="text-xs text-muted-foreground">{customSubject.length}/200</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-body">Message</Label>
                      <Textarea id="email-body" placeholder="Write your message here. Use blank lines to separate paragraphs."
                        value={customBody} onChange={(e) => setCustomBody(e.target.value)} rows={6} maxLength={5000} />
                      <span className="text-xs text-muted-foreground">{customBody.length}/5000</span>
                    </div>
                  </div>
                )}

                {!isCustom && (
                  <div className="p-4 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                    This is a predefined template. Use Preview to see exactly what recipients will receive.
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Recipient</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={recipientType === "user" ? "default" : "outline"} size="sm"
                      onClick={() => setRecipientType("user")} className="justify-start">
                      <User className="h-4 w-4 mr-2" />Single user
                    </Button>
                    <Button variant={recipientType === "group" ? "default" : "outline"} size="sm"
                      onClick={() => { setRecipientType("group"); fetchData(); }} className="justify-start">
                      <Users className="h-4 w-4 mr-2" />Group
                    </Button>
                  </div>

                  {recipientType === "user" ? (
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger><SelectValue placeholder="Select a user…" /></SelectTrigger>
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
                      <div className="flex items-center justify-between">
                        <Label>Group</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                          Refresh
                        </Button>
                      </div>
                      <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger><SelectValue placeholder={groups.length === 0 ? "No groups yet — create one in User Groups" : "Select a group…"} /></SelectTrigger>
                        <SelectContent className="z-[60]">
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              <div className="flex items-center gap-2">
                                <span>{g.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {g.member_count} member{g.member_count === 1 ? "" : "s"}
                                </Badge>
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
                      <span>Sending…</span><span>{progress.sent}/{progress.total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(progress.sent / progress.total) * 100}%` }} />
                    </div>
                    {progress.errors > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        {progress.errors} error{progress.errors === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handlePreview} disabled={previewLoading} size="lg">
                    {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                    Preview
                  </Button>
                  <Button onClick={handleSend} disabled={sending} size="lg">
                    {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                      : <><Send className="h-4 w-4 mr-2" />Send Email</>}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Last 100 sends across all templates.</p>
              <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={historyLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No emails sent yet.</div>
            ) : (
              <div className="border rounded-lg divide-y max-h-[480px] overflow-y-auto">
                {history.map((row) => (
                  <div key={row.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{row.recipient_email}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{row.template_name}</span>
                        <span>·</span>
                        <span>{format(new Date(row.created_at), "MMM d, HH:mm")}</span>
                      </div>
                      {row.error_message && (
                        <div className="text-xs text-destructive mt-1 truncate">{row.error_message}</div>
                      )}
                    </div>
                    {statusBadge(row.status)}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Email preview</DialogTitle>
              <DialogDescription className="truncate">
                Subject: <span className="font-medium text-foreground">{previewSubject || "—"}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden border rounded-lg bg-white">
              {previewLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <iframe title="Email preview" srcDoc={previewHtml}
                  className="w-full h-[65vh] bg-white" sandbox="" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
