import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Plus, RefreshCw, ShieldOff, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SuppressedRow {
  id: string;
  email: string;
  reason: string;
  created_at: string;
  metadata: any;
}

const REASON_COLORS: Record<string, string> = {
  unsubscribe: "bg-muted text-muted-foreground",
  bounce: "bg-destructive/15 text-destructive",
  complaint: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  manual: "bg-primary/15 text-primary",
};

export function EmailSuppressionsTab() {
  const [rows, setRows] = useState<SuppressedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("manual");
  const [adding, setAdding] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppressed_emails")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error("Failed to load suppression list");
    } else {
      setRows((data || []) as SuppressedRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setAdding(true);
    const { error } = await supabase
      .from("suppressed_emails")
      .insert({ email, reason: newReason });
    setAdding(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Email already suppressed" : "Failed to add");
      return;
    }
    toast.success(`${email} added to suppression list`);
    setNewEmail("");
    fetchRows();
  };

  const handleRemove = async (row: SuppressedRow) => {
    if (!confirm(`Remove ${row.email} from suppression list? They will start receiving emails again.`)) return;
    const { error } = await supabase
      .from("suppressed_emails")
      .delete()
      .eq("id", row.id);
    if (error) {
      toast.error("Failed to remove");
      return;
    }
    toast.success(`${row.email} removed — emails will resume`);
    setRows((r) => r.filter((x) => x.id !== row.id));
  };

  const filtered = rows.filter((r) => {
    if (reasonFilter !== "all" && r.reason !== reasonFilter) return false;
    if (search && !r.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5" />
              Email Suppression List
            </CardTitle>
            <CardDescription>
              Recipients on this list will not receive any emails. Includes unsubscribes, bounces, and complaints.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Total: {rows.length}</Badge>
          {Object.entries(counts).map(([reason, count]) => (
            <Badge key={reason} variant="outline" className="capitalize">
              {reason}: {count}
            </Badge>
          ))}
        </div>

        <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
          <Label className="text-sm font-medium">Manually block an email</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Select value={newReason} onValueChange={setNewReason}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual block</SelectItem>
                <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={adding || !newEmail}>
              {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Block
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reasons</SelectItem>
              <SelectItem value="unsubscribe">Unsubscribed</SelectItem>
              <SelectItem value="bounce">Bounced</SelectItem>
              <SelectItem value="complaint">Complaint</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Suppressed at</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {rows.length === 0 ? "No suppressed emails yet." : "No matches."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">{row.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`capitalize ${REASON_COLORS[row.reason] || ""}`}>
                        {row.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(row.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(row)}
                        aria-label={`Remove ${row.email} from suppression list`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}