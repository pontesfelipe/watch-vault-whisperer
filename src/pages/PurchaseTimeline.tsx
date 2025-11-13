import { useState, useEffect } from "react";
import { usePasscode } from "@/contexts/PasscodeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  when_bought?: string;
  why_bought?: string;
  image_url?: string;
  created_at: string;
}

export default function PurchaseTimeline() {
  const { isVerified, requestVerification } = usePasscode();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("watches")
        .select("id, brand, model, cost, when_bought, why_bought, image_url, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setWatches((data as any) || []);
    } catch (error) {
      console.error("Error fetching watches:", error);
      toast.error("Failed to load watches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVerified) {
      fetchWatches();
    }
  }, [isVerified]);

  const handleUnlock = () => {
    requestVerification(() => {
      fetchWatches();
    });
  };

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle>Protected Content</CardTitle>
            <CardDescription>
              This timeline contains your watch purchase history. Enter the passcode to access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleUnlock}>
              <Lock className="mr-2 h-4 w-4" />
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Purchase Timeline
          </CardTitle>
          <CardDescription>
            Your watch collection journey over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : watches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No watches found</div>
          ) : (
            <div className="space-y-8">
              {watches.map((watch, index) => (
                <div key={watch.id} className="relative">
                  {/* Timeline connector */}
                  {index !== watches.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  {/* Timeline item */}
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Watch details */}
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {watch.brand} {watch.model}
                              </h3>
                              {watch.when_bought && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {watch.when_bought}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="h-4 w-4" />
                              {watch.cost.toLocaleString()}
                            </div>

                            {watch.why_bought && (
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-1">Why I bought it</p>
                                <p className="text-sm text-muted-foreground">{watch.why_bought}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
