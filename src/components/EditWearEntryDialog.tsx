import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2, MapPin, Flag, Droplets } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LocationAutocomplete } from "./LocationAutocomplete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
  notes?: string | null;
  trip_id?: string | null;
  event_id?: string | null;
  water_usage_id?: string | null;
}

interface EditWearEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: WearEntry[];
  watchName: string;
  onUpdate: () => void;
}

export const EditWearEntryDialog = ({ 
  open, 
  onOpenChange, 
  entries, 
  watchName,
  onUpdate 
}: EditWearEntryDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [wearDate, setWearDate] = useState("");
  const [days, setDays] = useState(1);
  const [notes, setNotes] = useState("");
  
  // Link state
  const [isTrip, setIsTrip] = useState(false);
  const [isEvent, setIsEvent] = useState(false);
  const [isWaterActivity, setIsWaterActivity] = useState(false);
  
  // Trip fields
  const [tripLocation, setTripLocation] = useState("");
  const [tripPurpose, setTripPurpose] = useState("");
  
  // Event fields
  const [eventLocation, setEventLocation] = useState("");
  const [eventPurpose, setEventPurpose] = useState("");
  
  // Water activity fields
  const [waterActivityType, setWaterActivityType] = useState("Lake");
  const [depthMeters, setDepthMeters] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [waterNotes, setWaterNotes] = useState("");

  // Load entry data when dialog opens
  useEffect(() => {
    const loadEntryData = async () => {
      if (entries.length === 0) return;
      
      const entry = entries[0];
      setWearDate(entry.wear_date);
      setDays(entry.days);
      setNotes(entry.notes || "");
      
      // Load trip data if exists
      if (entry.trip_id) {
        const { data: tripData } = await supabase
          .from("trips")
          .select("*")
          .eq("id", entry.trip_id)
          .single();
        
        if (tripData) {
          setIsTrip(true);
          setTripLocation(tripData.location);
          setTripPurpose(tripData.purpose);
        }
      } else {
        setIsTrip(false);
        setTripLocation("");
        setTripPurpose("");
      }
      
      // Load event data if exists
      if (entry.event_id) {
        const { data: eventData } = await supabase
          .from("events")
          .select("*")
          .eq("id", entry.event_id)
          .single();
        
        if (eventData) {
          setIsEvent(true);
          setEventLocation(eventData.location);
          setEventPurpose(eventData.purpose);
        }
      } else {
        setIsEvent(false);
        setEventLocation("");
        setEventPurpose("");
      }
      
      // Load water usage data if exists
      if (entry.water_usage_id) {
        const { data: waterData } = await supabase
          .from("water_usage")
          .select("*")
          .eq("id", entry.water_usage_id)
          .single();
        
        if (waterData) {
          setIsWaterActivity(true);
          setWaterActivityType(waterData.activity_type);
          setDepthMeters(waterData.depth_meters?.toString() || "");
          setDurationMinutes(waterData.duration_minutes?.toString() || "");
          setWaterNotes(waterData.notes || "");
        }
      } else {
        setIsWaterActivity(false);
        setWaterActivityType("Lake");
        setDepthMeters("");
        setDurationMinutes("");
        setWaterNotes("");
      }
    };
    
    if (open) {
      loadEntryData();
    }
  }, [open, entries]);

  const handleSave = async () => {
    if (!entries[0]) return;
    setLoading(true);
    try {
      const entry = entries[0];
      
      // Format date properly
      const dateObj = new Date(wearDate + 'T00:00:00');
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      let tripId = entry.trip_id;
      let eventId = entry.event_id;
      let waterUsageId = entry.water_usage_id;
      
      // Handle Trip
      if (isTrip) {
        if (tripId) {
          // Update existing trip
          await supabase
            .from("trips")
            .update({
              location: tripLocation,
              purpose: tripPurpose,
              start_date: formattedDate,
              days: days,
            })
            .eq("id", tripId);
        } else {
          // Create new trip
          const { data: tripData, error: tripError } = await supabase
            .from("trips")
            .insert({
              location: tripLocation,
              purpose: tripPurpose,
              start_date: formattedDate,
              days: days,
              watch_model: { [entry.watch_id]: days },
              user_id: user?.id,
            })
            .select()
            .single();
          
          if (tripError) throw tripError;
          tripId = tripData.id;
        }
      } else if (tripId) {
        // Delete trip if unchecked
        await supabase.from("trips").delete().eq("id", tripId);
        tripId = null;
      }
      
      // Handle Event
      if (isEvent) {
        if (eventId) {
          // Update existing event
          await supabase
            .from("events")
            .update({
              location: eventLocation,
              purpose: eventPurpose,
              start_date: formattedDate,
              days: days,
            })
            .eq("id", eventId);
        } else {
          // Create new event
          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .insert({
              location: eventLocation,
              purpose: eventPurpose,
              start_date: formattedDate,
              days: days,
              watch_model: { [entry.watch_id]: days },
              user_id: user?.id,
            })
            .select()
            .single();
          
          if (eventError) throw eventError;
          eventId = eventData.id;
        }
      } else if (eventId) {
        // Delete event if unchecked
        await supabase.from("events").delete().eq("id", eventId);
        eventId = null;
      }
      
      // Handle Water Activity
      if (isWaterActivity) {
        if (waterUsageId) {
          // Update existing water usage
          await supabase
            .from("water_usage")
            .update({
              activity_type: waterActivityType,
              activity_date: formattedDate,
              depth_meters: depthMeters ? parseFloat(depthMeters) : null,
              duration_minutes: durationMinutes ? parseFloat(durationMinutes) : null,
              notes: waterNotes || null,
            })
            .eq("id", waterUsageId);
        } else {
          // Create new water usage
          const { data: waterData, error: waterError } = await supabase
            .from("water_usage")
            .insert({
              activity_type: waterActivityType,
              activity_date: formattedDate,
              watch_id: entry.watch_id,
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
      } else if (waterUsageId) {
        // Delete water usage if unchecked
        await supabase.from("water_usage").delete().eq("id", waterUsageId);
        waterUsageId = null;
      }
      
      // Update wear entry
      const { error } = await supabase
        .from("wear_entries")
        .update({ 
          wear_date: formattedDate,
          days: days,
          notes: notes || null,
          trip_id: tripId,
          event_id: eventId,
          water_usage_id: waterUsageId,
        })
        .eq("id", entry.id);

      if (error) throw error;

      toast({
        title: "Entry updated",
        description: "Wear entry and linked activities have been updated.",
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entries[0]) return;

    try {
      const entry = entries[0];
      
      // Delete linked records
      if (entry.trip_id) {
        await supabase.from("trips").delete().eq("id", entry.trip_id);
      }
      if (entry.event_id) {
        await supabase.from("events").delete().eq("id", entry.event_id);
      }
      if (entry.water_usage_id) {
        await supabase.from("water_usage").delete().eq("id", entry.water_usage_id);
      }
      
      // Delete wear entry
      const { error } = await supabase
        .from("wear_entries")
        .delete()
        .eq("id", entry.id);

      if (error) throw error;

      toast({
        title: "Entry deleted",
        description: "Wear entry and linked activities have been deleted.",
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  if (entries.length === 0) return null;

  const entry = entries[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Wear Entry - {watchName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="date"
                value={wearDate}
                onChange={(e) => setWearDate(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>

          <div>
            <Label>Wear Duration</Label>
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => setDays(1)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  days === 1
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}
              >
                Full Day
              </button>
              <button
                type="button"
                onClick={() => setDays(0.5)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  days === 0.5
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}
              >
                Half Day
              </button>
            </div>
          </div>
          
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          {/* Trip Section */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trip"
                checked={isTrip}
                onCheckedChange={(checked) => setIsTrip(!!checked)}
              />
              <label htmlFor="trip" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <MapPin className="w-4 h-4" />
                Link to Trip
              </label>
            </div>
            
            {isTrip && (
              <div className="ml-6 space-y-3 bg-muted/30 p-4 rounded-lg">
                <div>
                  <Label>Trip Location</Label>
                  <LocationAutocomplete
                    value={tripLocation}
                    onChange={setTripLocation}
                    placeholder="Enter trip location..."
                  />
                </div>
                <div>
                  <Label>Trip Purpose</Label>
                  <Input
                    value={tripPurpose}
                    onChange={(e) => setTripPurpose(e.target.value)}
                    placeholder="e.g., Business, Vacation"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Event Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="event"
                checked={isEvent}
                onCheckedChange={(checked) => setIsEvent(!!checked)}
              />
              <label htmlFor="event" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Flag className="w-4 h-4" />
                Link to Event
              </label>
            </div>
            
            {isEvent && (
              <div className="ml-6 space-y-3 bg-muted/30 p-4 rounded-lg">
                <div>
                  <Label>Event Location</Label>
                  <LocationAutocomplete
                    value={eventLocation}
                    onChange={setEventLocation}
                    placeholder="Enter event location..."
                  />
                </div>
                <div>
                  <Label>Event Purpose</Label>
                  <Input
                    value={eventPurpose}
                    onChange={(e) => setEventPurpose(e.target.value)}
                    placeholder="e.g., Wedding, Conference"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Water Activity Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="water"
                checked={isWaterActivity}
                onCheckedChange={(checked) => setIsWaterActivity(!!checked)}
              />
              <label htmlFor="water" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Droplets className="w-4 h-4" />
                Link to Water Activity
              </label>
            </div>
            
            {isWaterActivity && (
              <div className="ml-6 space-y-3 bg-muted/30 p-4 rounded-lg">
                <div>
                  <Label>Activity Type</Label>
                  <Select value={waterActivityType} onValueChange={setWaterActivityType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lake">Lake</SelectItem>
                      <SelectItem value="Beach">Beach</SelectItem>
                      <SelectItem value="Hot Tub">Hot Tub</SelectItem>
                      <SelectItem value="Diving">Diving</SelectItem>
                      <SelectItem value="Water Sports">Water Sports</SelectItem>
                      <SelectItem value="Snorkeling">Snorkeling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Depth (meters)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={depthMeters}
                    onChange={(e) => setDepthMeters(e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="e.g., 30"
                  />
                </div>
                <div>
                  <Label>Water Activity Notes</Label>
                  <Textarea
                    value={waterNotes}
                    onChange={(e) => setWaterNotes(e.target.value)}
                    placeholder="Additional details about the water activity..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="ml-auto" disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Entry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this wear entry? This will also delete any associated trip, event, or water activity records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
