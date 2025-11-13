import { useState, useEffect } from "react";
import { usePasscode } from "@/contexts/PasscodeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EditPersonalNotesDialog } from "@/components/EditPersonalNotesDialog";

interface Watch {
  id: string;
  brand: string;
  model: string;
  why_bought?: string;
  when_bought?: string;
  what_i_like?: string;
  what_i_dont_like?: string;
}

export default function PersonalNotes() {
  const { isVerified, requestVerification } = usePasscode();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);

  const fetchWatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("watches")
        .select("id, brand, model, why_bought, when_bought, what_i_like, what_i_dont_like")
        .order("brand", { ascending: true });

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
              This section contains personal notes about your watches. Enter the passcode to access.
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
          <CardTitle>Personal Watch Notes</CardTitle>
          <CardDescription>
            Your private thoughts and memories about each watch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : watches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No watches found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Why I bought</TableHead>
                    <TableHead>When I bought</TableHead>
                    <TableHead>What I like</TableHead>
                    <TableHead>What I don't like about this watch</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watches.map((watch) => (
                    <TableRow key={watch.id}>
                      <TableCell className="font-medium">{watch.brand}</TableCell>
                      <TableCell>{watch.model}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate">{watch.why_bought || "-"}</div>
                      </TableCell>
                      <TableCell>{watch.when_bought || "-"}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate">{watch.what_i_like || "-"}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate">{watch.what_i_dont_like || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingWatch(watch)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingWatch && (
        <EditPersonalNotesDialog
          watch={editingWatch}
          onSuccess={() => {
            fetchWatches();
            setEditingWatch(null);
          }}
          onClose={() => setEditingWatch(null)}
        />
      )}
    </div>
  );
}
