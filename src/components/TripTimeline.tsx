import { Trip } from "@/types/watch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Palmtree, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePasscode } from "@/contexts/PasscodeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TripTimelineProps {
  trips: Trip[];
  limit?: number;
  type: "trip" | "event";
  watches: { id: string; brand: string; model: string }[];
  onUpdate: () => void;
}

export const TripTimeline = ({ trips, limit, type, watches, onUpdate }: TripTimelineProps) => {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  
  // Get available years from trips
  const availableYears = Array.from(
    new Set(trips.map(trip => {
      const date = new Date(trip.startDate);
      return date.getFullYear();
    }))
  ).sort((a, b) => b - a);
  
  // Filter trips by year
  const filteredTrips = selectedYear === "all" 
    ? trips 
    : trips.filter(trip => {
        const date = new Date(trip.startDate);
        return date.getFullYear().toString() === selectedYear;
      });
  
  const displayTrips = limit ? filteredTrips.slice(0, limit) : filteredTrips;
  const { isVerified, requestVerification } = usePasscode();
  const [showLocation, setShowLocation] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    startDate: "",
    watchModel: "",
    days: "1",
    purpose: "",
  });

  const handleToggleLocation = () => {
    if (!showLocation) {
      if (isVerified) {
        setShowLocation(true);
      } else {
        requestVerification(() => {
          setShowLocation(true);
        });
      }
    } else {
      setShowLocation(false);
    }
  };

  // Auto-show location if already verified
  useEffect(() => {
    if (isVerified) {
      setShowLocation(true);
    }
  }, [isVerified]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setLoading(true);
    try {
      const table = type === "trip" ? "trips" : "events";
      const { error } = await supabase.from(table).delete().eq("id", deleteId);
      
      if (error) throw error;
      
      toast.success(`${type === "trip" ? "Trip" : "Event"} deleted successfully`);
      setDeleteId(null);
      onUpdate();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditItem(trip);
    setFormData({
      location: trip.location,
      startDate: trip.startDate,
      watchModel: trip.watch,
      days: trip.days.toString(),
      purpose: trip.purpose,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    setLoading(true);
    try {
      const table = type === "trip" ? "trips" : "events";
      const { error } = await supabase.from(table).update({
        location: formData.location,
        start_date: formData.startDate,
        watch_model: formData.watchModel,
        days: parseFloat(formData.days),
        purpose: formData.purpose,
      }).eq("id", editItem.id);
      
      if (error) throw error;
      
      toast.success(`${type === "trip" ? "Trip" : "Event"} updated successfully`);
      setEditItem(null);
      onUpdate();
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      toast.error(`Failed to update ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {trips.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Year:</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLocation}
              className="gap-2 text-xs"
            >
              {showLocation ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Locations
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Locations
                </>
              )}
            </Button>
          </div>
        )}
        {displayTrips.map((trip, index) => (
          <Card key={index} className="border-border bg-card p-6 hover:shadow-[var(--shadow-luxury)] transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {trip.purpose === "Vacation" ? (
                  <Palmtree className="w-5 h-5 text-primary" />
                ) : (
                  <Briefcase className="w-5 h-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      {showLocation ? trip.location : "••••••"}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{trip.startDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={trip.purpose === "Vacation" ? "default" : "secondary"}>
                      {trip.purpose}
                    </Badge>
                    {isVerified && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(trip)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(trip.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{trip.watch}</span>
                    <span className="mx-2">•</span>
                    <span>{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {type === "trip" ? "Trip" : "Event"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {type === "trip" ? "trip" : "event"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {type === "trip" ? "Trip" : "Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-startDate">{type === "trip" ? "Start Date" : "Date"}</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-watchModel">Watch</Label>
              <Select
                value={formData.watchModel}
                onValueChange={(value) => setFormData({ ...formData, watchModel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select watch" />
                </SelectTrigger>
                <SelectContent>
                  {watches.map((watch) => (
                    <SelectItem key={watch.id} value={`${watch.brand} ${watch.model}`}>
                      {watch.brand} {watch.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-days">{type === "trip" ? "Days" : "Duration (days)"}</Label>
              <Input
                id="edit-days"
                type="number"
                step="0.5"
                min="0.5"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-purpose">{type === "trip" ? "Purpose" : "Purpose/Name"}</Label>
              {type === "trip" ? (
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => setFormData({ ...formData, purpose: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Vacation">Vacation</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="edit-purpose"
                  value={formData.purpose}
                  placeholder="e.g., Wedding, Gala, Conference"
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
