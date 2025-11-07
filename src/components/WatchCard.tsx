import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Watch as WatchIcon, Calendar, Eye, EyeOff, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { usePasscode } from "@/contexts/PasscodeContext";
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

interface WatchCardProps {
  watch: {
    id: string;
    brand: string;
    model: string;
    dial_color: string;
    type: string;
    cost: number;
  };
  totalDays: number;
  onDelete: () => void;
}

export const WatchCard = ({ watch, totalDays, onDelete }: WatchCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requestVerification, isVerified } = usePasscode();
  const [showCost, setShowCost] = useState(false);

  const handleToggleCost = () => {
    if (!showCost) {
      if (isVerified) {
        setShowCost(true);
      } else {
        requestVerification(() => {
          setShowCost(true);
        });
      }
    } else {
      setShowCost(false);
    }
  };

  // Auto-show cost if already verified
  useEffect(() => {
    if (isVerified) {
      setShowCost(true);
    }
  }, [isVerified]);

  const handleDelete = async () => {
    const { error } = await supabase.from("watches").delete().eq("id", watch.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete watch",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Watch removed from collection",
    });

    onDelete();
  };

  const costPerUse = totalDays > 0 ? watch.cost / totalDays : watch.cost;

  return (
    <Card className="group relative overflow-hidden border-border bg-card hover:shadow-[var(--shadow-luxury)] transition-all duration-300">
      <div className="absolute inset-0 bg-[var(--gradient-luxury)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <WatchIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">{watch.brand}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{watch.model}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {watch.type}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dial Color</span>
            <span className="font-medium text-foreground">{watch.dial_color}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cost</span>
            <div className="flex items-center gap-2">
              {showCost ? (
                <span className="font-medium text-foreground">${watch.cost.toLocaleString()}</span>
              ) : (
                <span className="font-medium text-muted-foreground">••••••</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleToggleCost}
              >
                {showCost ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cost/Day</span>
            <div className="flex items-center gap-2">
              {showCost ? (
                <span className="font-medium text-primary">${costPerUse.toFixed(0)}</span>
              ) : (
                <span className="font-medium text-muted-foreground">••••</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Days Worn</span>
            </div>
            <span className="text-2xl font-bold text-primary">{totalDays}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => navigate(`/watch/${watch.id}`)}
          >
            <Eye className="w-4 h-4" />
            Details
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Delete Watch</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to remove <span className="font-semibold">{watch.brand} {watch.model}</span> from your collection? This will also delete all wear entries.
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
    </Card>
  );
};
