import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, Pencil, Trash2, Save, X } from "lucide-react";

interface WearLog {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  watches: {
    brand: string;
    model: string;
  } | null;
}

interface EditingEntry {
  id: string;
  days: string;
  notes: string;
}

export default function WearLogsAdmin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [wearLogs, setWearLogs] = useState<WearLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchWearLogs();
    }
  }, [selectedMonth, isAdmin]);

  const fetchWearLogs = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      const { data, error } = await supabase
        .from("wear_entries")
        .select(`
          id,
          watch_id,
          wear_date,
          days,
          notes,
          created_at,
          updated_at,
          watches (
            brand,
            model
          )
        `)
        .gte("wear_date", format(startDate, "yyyy-MM-dd"))
        .lte("wear_date", format(endDate, "yyyy-MM-dd"))
        .order("wear_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWearLogs(data || []);
    } catch (error) {
      console.error("Error fetching wear logs:", error);
      toast.error("Failed to fetch wear logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (log: WearLog) => {
    setEditingEntry({
      id: log.id,
      days: log.days.toString(),
      notes: log.notes || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const days = parseFloat(editingEntry.days);
    if (isNaN(days) || days < 0) {
      toast.error("Please enter a valid number for days");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("wear_entries")
        .update({
          days: Math.round(days * 2) / 2, // Round to nearest 0.5
          notes: editingEntry.notes || null,
        })
        .eq("id", editingEntry.id);

      if (error) throw error;

      toast.success("Wear entry updated");
      setEditingEntry(null);
      fetchWearLogs();
    } catch (error) {
      console.error("Error updating wear entry:", error);
      toast.error("Failed to update wear entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wear entry?")) return;

    try {
      const { error } = await supabase
        .from("wear_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Wear entry deleted");
      fetchWearLogs();
    } catch (error) {
      console.error("Error deleting wear entry:", error);
      toast.error("Failed to delete wear entry");
    }
  };

  // Generate month options for the past 2 years
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy"),
      });
    }
    return options;
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Wear Logs Admin</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Wear Entry Records</CardTitle>
                <CardDescription>
                  View and edit all wear entries for the selected month
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Month:</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : wearLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No wear entries found for this month
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Watch</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wearLogs.map((log) => {
                      const isEditing = editingEntry?.id === log.id;
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {format(new Date(log.wear_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {log.watches ? (
                              <span className="font-medium">
                                {log.watches.brand} {log.watches.model}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Watch deleted
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editingEntry.days}
                                onChange={(e) =>
                                  setEditingEntry({
                                    ...editingEntry,
                                    days: e.target.value,
                                  })
                                }
                                className="w-20 text-center"
                                step="0.5"
                                min="0"
                              />
                            ) : (
                              <span className="font-semibold text-primary">
                                {log.days.toFixed(1)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingEntry.notes}
                                onChange={(e) =>
                                  setEditingEntry({
                                    ...editingEntry,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Add notes..."
                                className="max-w-xs"
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {log.notes || "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(log.updated_at), "MMM d, h:mm a")}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={isSaving}
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={isSaving}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(log)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(log.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
