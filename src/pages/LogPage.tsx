import { useState, useEffect } from "react";
import { NewAppLayout } from "@/components/NewAppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Check, Plus, Watch, X, Sparkles, ImagePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WatchOption {
  id: string;
  brand: string;
  model: string;
  dialColor: string;
  imageUrl: string | null;
}

interface Tag {
  id: string;
  name: string;
  category: string | null;
}

export default function LogPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedWatch, setSelectedWatch] = useState<WatchOption | null>(null);
  const [watches, setWatches] = useState<WatchOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wearDate, setWearDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedWatch, setIdentifiedWatch] = useState<any>(null);
  const [intent, setIntent] = useState<"have" | "want" | null>(null);

  useEffect(() => {
    if (user) {
      fetchWatches();
      fetchTags();
    }
  }, [user]);

  useEffect(() => {
    // Handle state passed from search
    const state = location.state as any;
    if (state?.watchName) {
      setSearchQuery(state.watchName);
    }
    if (state?.addNew) {
      setShowPhotoCapture(true);
    }
  }, [location.state]);

  const fetchWatches = async () => {
    try {
      const { data } = await supabase
        .from("watches")
        .select("id, brand, model, dial_color, ai_image_url")
        .eq("user_id", user?.id)
        .eq("status", "In Collection")
        .order("brand");

      if (data) {
        setWatches(
          data.map((w) => ({
            id: w.id,
            brand: w.brand,
            model: w.model,
            dialColor: w.dial_color,
            imageUrl: w.ai_image_url,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching watches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    const { data } = await supabase.from("tags").select("*").order("usage_count", { ascending: false });
    if (data) {
      setAvailableTags(data);
    }
  };

  const filteredWatches = watches.filter(
    (w) =>
      w.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.id === tag.id)
        ? prev.filter((t) => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  const addCustomTag = async () => {
    if (!customTag.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: customTag.trim() })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Tag already exists, find it
          const { data: existing } = await supabase
            .from("tags")
            .select("*")
            .eq("name", customTag.trim())
            .single();
          if (existing) {
            toggleTag(existing);
          }
        } else {
          throw error;
        }
      } else if (data) {
        setAvailableTags((prev) => [data, ...prev]);
        toggleTag(data);
      }
      setCustomTag("");
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setCapturedPhoto(base64);
      setIsIdentifying(true);

      try {
        const { data, error } = await supabase.functions.invoke("identify-watch-from-photo", {
          body: { image: base64 },
        });

        if (error) throw error;
        setIdentifiedWatch(data);
        toast.success(`Identified: ${data.brand} ${data.model}`, {
          description: `Confidence: ${data.confidence}`,
        });
      } catch (error: any) {
        console.error("Error identifying watch:", error);
        toast.error("Could not identify watch. Please enter details manually.");
      } finally {
        setIsIdentifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedWatch && !identifiedWatch) {
      toast.error("Please select or identify a watch");
      return;
    }

    setIsSubmitting(true);

    try {
      let watchId = selectedWatch?.id;

      // If it's a new watch (from photo identification)
      if (identifiedWatch && !selectedWatch) {
        if (intent === "have") {
          // Add to collection
          const { data: newWatch, error: watchError } = await supabase
            .from("watches")
            .insert({
              user_id: user?.id,
              brand: identifiedWatch.brand,
              model: identifiedWatch.model,
              dial_color: identifiedWatch.dial_color,
              type: identifiedWatch.type,
              status: "In Collection",
            })
            .select()
            .single();

          if (watchError) throw watchError;
          watchId = newWatch.id;
        } else if (intent === "want") {
          // Add to wishlist
          await supabase.from("wishlist").insert({
            user_id: user?.id,
            brand: identifiedWatch.brand,
            model: identifiedWatch.model,
            dial_colors: identifiedWatch.dial_color,
          });
          toast.success("Added to wishlist!");
          navigate("/profile");
          return;
        }
      }

      if (!watchId) {
        toast.error("Please select a watch or specify your intent");
        return;
      }

      // Create wear entry
      const { data: wearEntry, error: wearError } = await supabase
        .from("wear_entries")
        .insert({
          user_id: user?.id,
          watch_id: watchId,
          wear_date: wearDate,
          days: 1,
        })
        .select()
        .single();

      if (wearError) throw wearError;

      // Add tags
      if (selectedTags.length > 0 && wearEntry) {
        const tagInserts = selectedTags.map((tag) => ({
          wear_entry_id: wearEntry.id,
          tag_id: tag.id,
        }));
        await supabase.from("wear_entry_tags").insert(tagInserts);
      }

      toast.success("Wrist check logged!");
      navigate("/home");
    } catch (error) {
      console.error("Error logging wear:", error);
      toast.error("Failed to log wear entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NewAppLayout showSearch={false}>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Wrist Check</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(wearDate), "EEEE, MMMM d")}
          </p>
        </div>

        {/* Date Picker (subtle) */}
        <div className="flex justify-center">
          <Input
            type="date"
            value={wearDate}
            onChange={(e) => setWearDate(e.target.value)}
            className="w-auto text-center border-0 bg-muted/50 rounded-full px-4"
          />
        </div>

        {/* Watch Selection */}
        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collection">My Collection</TabsTrigger>
            <TabsTrigger value="new">New Watch</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-4 space-y-4">
            {/* Search */}
            <Input
              placeholder="Search your watches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl"
            />

            {/* Watch Grid */}
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredWatches.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {filteredWatches.map((watch) => (
                  <motion.div
                    key={watch.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedWatch(selectedWatch?.id === watch.id ? null : watch)}
                  >
                    <Card
                      className={`overflow-hidden cursor-pointer transition-all ${
                        selectedWatch?.id === watch.id
                          ? "ring-2 ring-primary"
                          : "hover:shadow-md"
                      }`}
                    >
                      <AspectRatio ratio={1}>
                        {watch.imageUrl ? (
                          <img
                            src={watch.imageUrl}
                            alt={`${watch.brand} ${watch.model}`}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Watch className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {selectedWatch?.id === watch.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </AspectRatio>
                      <CardContent className="p-2">
                        <p className="text-[10px] font-medium text-foreground truncate">
                          {watch.brand}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {watch.model}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Watch className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No watches in collection</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowPhotoCapture(true)}
                >
                  Add Your First Watch
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4 space-y-4">
            {/* Photo Capture */}
            <Card className="overflow-hidden">
              {capturedPhoto ? (
                <div className="relative">
                  <AspectRatio ratio={4 / 3}>
                    <img
                      src={capturedPhoto}
                      alt="Captured watch"
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setCapturedPhoto(null);
                      setIdentifiedWatch(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {isIdentifying && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="h-8 w-8 animate-pulse text-primary mx-auto" />
                        <p className="mt-2 text-sm">Identifying watch...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />
                  <AspectRatio ratio={4 / 3}>
                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Camera className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">Take a Photo</p>
                        <p className="text-sm text-muted-foreground">
                          AI will identify your watch
                        </p>
                      </div>
                    </div>
                  </AspectRatio>
                </label>
              )}
            </Card>

            {/* Identified Watch Details */}
            <AnimatePresence>
              {identifiedWatch && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">AI Identified</span>
                      <Badge variant="outline" className="ml-auto">
                        {identifiedWatch.confidence}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold">
                      {identifiedWatch.brand} {identifiedWatch.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {identifiedWatch.dial_color} • {identifiedWatch.type}
                    </p>

                    {/* Intent Selection */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        variant={intent === "have" ? "default" : "outline"}
                        onClick={() => setIntent("have")}
                        className="h-auto py-3 flex-col"
                      >
                        <span className="font-medium">I Have It</span>
                        <span className="text-xs opacity-70">Add to collection</span>
                      </Button>
                      <Button
                        variant={intent === "want" ? "default" : "outline"}
                        onClick={() => setIntent("want")}
                        className="h-auto py-3 flex-col"
                      >
                        <span className="font-medium">I Want It</span>
                        <span className="text-xs opacity-70">Add to wishlist</span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* Tags Section */}
        {(selectedWatch || (identifiedWatch && intent === "have")) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-medium text-foreground">Add Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.some((t) => t.id === tag.id) ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleTag(tag)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                className="flex-1 rounded-full"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="pt-4 pb-20">
          <Button
            className="w-full h-12 rounded-xl text-lg"
            disabled={(!selectedWatch && !identifiedWatch) || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Logging..." : "Log Wrist Check"}
          </Button>
        </div>
      </div>
    </NewAppLayout>
  );
}
