import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/contexts/CollectionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, Pencil, Trash2, Save, X, Plus } from "lucide-react";

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

interface Watch {
  id: string;
  brand: string;
  model: string;
}

export default function WearLogsAdmin() {
  const { user, isAdmin, loading } = useAuth();
  const { selectedCollectionId } = useCollection();
  const navigate = useNavigate();
  const [wearLogs, setWearLogs] = useState<WearLog[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    watch_id: "",
    wear_date: format(new Date(), "yyyy-MM-dd"),
    days: "1",
    notes: "",
  });
  const [isTrip, setIsTrip] = useState(false);
  const [isEvent, setIsEvent] = useState(false);
  const [isWaterActivity, setIsWaterActivity] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchWearLogs();
      fetchWatches();

      // Set up realtime subscription for wear_entries
      const channel = supabase
        .channel('wear_entries_admin_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wear_entries'
          },
          () => {
            fetchWearLogs();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedMonth, isAdmin, selectedCollectionId]);

  const fetchWatches = async () => {
    try {
      const { data, error } = await supabase
        .from("watches")
        .select("id, brand, model")
        .order("brand", { ascending: true })
        .order("model", { ascending: true });

      if (error) throw error;
      setWatches(data || []);
    } catch (error) {
      console.error("Error fetching watches:", error);
      toast.error("Failed to fetch watches");
    }
  };

  const fetchWearLogs = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      let query = supabase
        .from("wear_entries")
        .select(`
          id,
          watch_id,
          wear_date,
          days,
          notes,
          created_at,
          updated_at,
          watches!inner (
            brand,
            model,
            collection_id
          )
        `)
        .gte("wear_date", format(startDate, "yyyy-MM-dd"))
        .lte("wear_date", format(endDate, "yyyy-MM-dd"));
      
      // Filter by collection if one is selected
      if (selectedCollectionId) {
        query = query.eq("watches.collection_id", selectedCollectionId);
      }
      
      const { data, error } = await query
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

  const handleAddEntry = async () => {
    if (!newEntry.watch_id) {
      toast.error("Please select a watch");
      return;
    }

    const days = parseFloat(newEntry.days);
    if (isNaN(days) || days < 0) {
      toast.error("Please enter a valid number for days");
      return;
    }

    setIsSaving(true);
    try {
      let tripId = null;
      let eventId = null;
      let waterUsageId = null;

      // Create trip if checkbox is checked
      if (isTrip) {
        const tripLocation = (document.getElementById("tripLocation") as HTMLInputElement)?.value;
        const tripPurpose = (document.getElementById("tripPurpose") as HTMLInputElement)?.value;

        if (tripLocation && tripPurpose) {
          const { data: tripData, error: tripError } = await supabase
            .from("trips")
            .insert({
              location: tripLocation,
              purpose: tripPurpose,
              start_date: newEntry.wear_date,
              days: Math.round(days * 2) / 2,
              user_id: user?.id,
            })
            .select()
            .single();

          if (tripError) throw tripError;
          tripId = tripData.id;
        }
      }

      // Create event if checkbox is checked
      if (isEvent) {
        const eventLocation = (document.getElementById("eventLocation") as HTMLInputElement)?.value;
        const eventPurpose = (document.getElementById("eventPurpose") as HTMLInputElement)?.value;

        if (eventLocation && eventPurpose) {
          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .insert({
              location: eventLocation,
              purpose: eventPurpose,
              start_date: newEntry.wear_date,
              days: Math.round(days * 2) / 2,
              user_id: user?.id,
            })
            .select()
            .single();

          if (eventError) throw eventError;
          eventId = eventData.id;
        }
      }

      // Create water usage if checkbox is checked
      if (isWaterActivity) {
        const waterActivityType = (document.getElementById("waterActivityType") as HTMLInputElement)?.value;
        const depthMeters = (document.getElementById("depthMeters") as HTMLInputElement)?.value;
        const durationMinutes = (document.getElementById("durationMinutes") as HTMLInputElement)?.value;
        const waterNotes = (document.getElementById("waterNotes") as HTMLInputElement)?.value;

        if (waterActivityType) {
          const { data: waterData, error: waterError } = await supabase
            .from("water_usage")
            .insert({
              watch_id: newEntry.watch_id,
              activity_type: waterActivityType,
              activity_date: newEntry.wear_date,
              depth_meters: depthMeters ? parseFloat(depthMeters) : null,
              duration_minutes: durationMinutes ? parseFloat(durationMinutes) : null,
              notes: waterNotes || null,
              user_id: user?.id,
            })
            .select()
            .single();

          if (waterError) throw waterError;
          waterUsageId = waterData.id;
        }
      }

      const { error } = await supabase
        .from("wear_entries")
        .insert({
          watch_id: newEntry.watch_id,
          wear_date: newEntry.wear_date,
          days: Math.round(days * 2) / 2, // Round to nearest 0.5
          notes: newEntry.notes || null,
          trip_id: tripId,
          event_id: eventId,
          water_usage_id: waterUsageId,
          user_id: user?.id,
        });

      if (error) throw error;

      toast.success("Wear entry added");
      setIsAddDialogOpen(false);
      setNewEntry({
        watch_id: "",
        wear_date: format(new Date(), "yyyy-MM-dd"),
        days: "1",
        notes: "",
      });
      setIsTrip(false);
      setIsEvent(false);
      setIsWaterActivity(false);
      fetchWearLogs();
    } catch (error) {
      console.error("Error adding wear entry:", error);
      toast.error("Failed to add wear entry");
    } finally {
      setIsSaving(false);
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

  // Filter wear logs based on search query
  const filteredWearLogs = wearLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    
    const watchName = log.watches 
      ? `${log.watches.brand} ${log.watches.model}`.toLowerCase()
      : "";
    
    return watchName.includes(searchQuery.toLowerCase());
  });

  // Monthly summary for current filters
  const monthEntriesCount = filteredWearLogs.length;
  const monthDaysTotal = filteredWearLogs.reduce((sum, l) => sum + (l.days || 0), 0);

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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Wear Entry Records</CardTitle>
                  <CardDescription>
                    View and edit all wear entries for the selected month
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Wear Entry</DialogTitle>
                        <DialogDescription>
                          Create a new wear log entry for a watch
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="watch">Watch</Label>
                          <Select
                            value={newEntry.watch_id}
                            onValueChange={(value) =>
                              setNewEntry({ ...newEntry, watch_id: value })
                            }
                          >
                            <SelectTrigger id="watch">
                              <SelectValue placeholder="Select a watch" />
                            </SelectTrigger>
                            <SelectContent>
                              {watches.map((watch) => (
                                <SelectItem key={watch.id} value={watch.id}>
                                  {watch.brand} {watch.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newEntry.wear_date}
                            onChange={(e) =>
                              setNewEntry({ ...newEntry, wear_date: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="days">Days</Label>
                          <Input
                            id="days"
                            type="number"
                            step="0.5"
                            min="0"
                            value={newEntry.days}
                            onChange={(e) =>
                              setNewEntry({ ...newEntry, days: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Input
                            id="notes"
                            value={newEntry.notes}
                            onChange={(e) =>
                              setNewEntry({ ...newEntry, notes: e.target.value })
                            }
                            placeholder="Add notes..."
                          />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isTrip"
                              checked={isTrip}
                              onChange={(e) => setIsTrip(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="isTrip" className="cursor-pointer">Link to Trip</Label>
                          </div>

                          {isTrip && (
                            <div className="space-y-2 pl-6">
                              <div className="space-y-2">
                                <Label htmlFor="tripLocation">Location</Label>
                                <Input
                                  id="tripLocation"
                                  placeholder="e.g., Tokyo, Japan"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tripPurpose">Purpose</Label>
                                <Input
                                  id="tripPurpose"
                                  placeholder="e.g., Business, Vacation"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isEvent"
                              checked={isEvent}
                              onChange={(e) => setIsEvent(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="isEvent" className="cursor-pointer">Link to Event</Label>
                          </div>

                          {isEvent && (
                            <div className="space-y-2 pl-6">
                              <div className="space-y-2">
                                <Label htmlFor="eventLocation">Location</Label>
                                <Input
                                  id="eventLocation"
                                  placeholder="e.g., Conference Center"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="eventPurpose">Purpose</Label>
                                <Input
                                  id="eventPurpose"
                                  placeholder="e.g., Wedding, Conference"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isWaterActivity"
                              checked={isWaterActivity}
                              onChange={(e) => setIsWaterActivity(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="isWaterActivity" className="cursor-pointer">Link to Water Activity</Label>
                          </div>

                          {isWaterActivity && (
                            <div className="space-y-2 pl-6">
                              <div className="space-y-2">
                                <Label htmlFor="waterActivityType">Activity Type</Label>
                                <Input
                                  id="waterActivityType"
                                  placeholder="e.g., Lake, Beach, Hot Tub"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                  <Label htmlFor="depthMeters">Depth (meters)</Label>
                                  <Input
                                    id="depthMeters"
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g., 10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="durationMinutes">Duration (min)</Label>
                                  <Input
                                    id="durationMinutes"
                                    type="number"
                                    placeholder="e.g., 45"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="waterNotes">Notes</Label>
                                <Input
                                  id="waterNotes"
                                  placeholder="Additional details..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddEntry} disabled={isSaving}>
                          {isSaving ? "Adding..." : "Add Entry"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by watch name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Month summary: {monthEntriesCount} entries, {monthDaysTotal.toFixed(1)}d
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredWearLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {wearLogs.length === 0 
                  ? "No wear entries found for this month"
                  : "No wear entries match your search"}
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
                    {filteredWearLogs.map((log) => {
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
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                      <TableCell className="text-center font-bold text-primary">
                        {filteredWearLogs.reduce((sum, log) => sum + log.days, 0).toFixed(1)}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
