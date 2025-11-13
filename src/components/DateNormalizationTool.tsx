import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, Loader2, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NormalizationResult {
  success: boolean;
  totalProcessed: number;
  updatedCount: number;
  errorCount: number;
  updates: Array<{
    id: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
  errors: Array<{
    id: string;
    value: string | null;
    error: string;
  }>;
}

export function DateNormalizationTool({ onComplete }: { onComplete?: () => void }) {
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [result, setResult] = useState<NormalizationResult | null>(null);

  const handleNormalize = async () => {
    setIsNormalizing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('normalize-purchase-dates');

      if (error) {
        console.error('Error normalizing dates:', error);
        toast.error('Failed to normalize dates');
        return;
      }

      const result = data as NormalizationResult;
      setResult(result);

      if (result.success) {
        if (result.updatedCount > 0) {
          toast.success(`Successfully normalized ${result.updatedCount} date(s)`);
          onComplete?.();
        } else {
          toast.info('All dates are already in the correct format');
        }
      } else {
        toast.error('Date normalization completed with errors');
      }
    } catch (err) {
      console.error('Error calling normalization function:', err);
      toast.error('Failed to normalize dates');
    } finally {
      setIsNormalizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Date Normalization Tool
        </CardTitle>
        <CardDescription>
          One-time cleanup to convert all purchase dates to ISO format (YYYY-MM-DD)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            This will normalize all "when_bought" dates to ISO format. Dates like "March-24" will
            become "2024-03-01", preserving month/year precision.
          </p>
        </div>

        <Button
          onClick={handleNormalize}
          disabled={isNormalizing}
          className="w-full"
        >
          {isNormalizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Normalizing Dates...
            </>
          ) : (
            <>
              <Wrench className="mr-2 h-4 w-4" />
              Normalize All Dates
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success && result.errorCount === 0 ? "default" : "destructive"}>
            {result.success && result.errorCount === 0 ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success && result.errorCount === 0
                ? "Normalization Complete"
                : "Completed with Issues"}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="text-sm">
                <p>Total watches processed: {result.totalProcessed}</p>
                <p>Dates updated: {result.updatedCount}</p>
                {result.errorCount > 0 && <p>Errors: {result.errorCount}</p>}
              </div>

              {result.updates.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <p className="font-semibold mb-2">Updated dates:</p>
                  <div className="space-y-1 text-xs">
                    {result.updates.slice(0, 10).map((update) => (
                      <div key={update.id} className="pl-2 border-l-2 border-border">
                        "{update.oldValue}" → "{update.newValue}"
                      </div>
                    ))}
                    {result.updates.length > 10 && (
                      <p className="text-muted-foreground">
                        ...and {result.updates.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <p className="font-semibold mb-2">Errors:</p>
                  <div className="space-y-1 text-xs">
                    {result.errors.map((error) => (
                      <div key={error.id} className="pl-2 border-l-2 border-destructive">
                        {error.value}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
