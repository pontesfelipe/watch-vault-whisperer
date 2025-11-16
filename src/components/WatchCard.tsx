import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Watch as WatchIcon, Calendar, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { usePasscode } from "@/contexts/PasscodeContext";
import { useAuth } from "@/contexts/AuthContext";
import { EditWatchDialog } from "@/components/EditWatchDialog";
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

interface WatchCardProps {
  watch: {
    id: string;
    brand: string;
    model: string;
    dial_color: string;
    type: string;
    cost: number;
    case_size?: string;
    lug_to_lug_size?: string;
    caseback_material?: string;
    movement?: string;
    has_sapphire?: boolean;
    average_resale_price?: number;
    warranty_date?: string;
    warranty_card_url?: string;
    when_bought?: string;
    rarity?: string;
    historical_significance?: string;
    available_for_trade?: boolean;
  };
  totalDays: number;
  onDelete: () => void;
}

export const WatchCard = ({ watch, totalDays, onDelete }: WatchCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { requestVerification, isVerified } = usePasscode();
  const [showCost, setShowCost] = useState(isAdmin);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

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

  // Auto-show cost if already verified or if admin
  useEffect(() => {
    if (isVerified || isAdmin) {
      setShowCost(true);
    }
  }, [isVerified, isAdmin]);

  const handleDeleteClick = () => {
    if (!isVerified) {
      requestVerification(() => {
        setShowDeleteDialog(true);
      });
    } else {
      setShowDeleteDialog(true);
    }
  };

  const handleDelete = async () => {
    try {
      // Delete related data first
      await supabase.from("wear_entries").delete().eq("watch_id", watch.id);
      await supabase.from("water_usage").delete().eq("watch_id", watch.id);
      await supabase.from("watch_specs").delete().eq("watch_id", watch.id);
      
      // Delete the watch
      const { error } = await supabase.from("watches").delete().eq("id", watch.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Watch and all related data removed from collection",
      });

      setShowDeleteDialog(false);
      onDelete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete watch",
        variant: "destructive",
      });
    }
  };

  const handleFetchPrice = async () => {
    setIsFetchingPrice(true);
    try {
      // Extract year from when_bought
      let year: number | undefined;
      if (watch.when_bought) {
        const yearMatch = watch.when_bought.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }

      const { data, error } = await supabase.functions.invoke('fetch-watch-price', {
        body: { 
          brand: watch.brand, 
          model: watch.model,
          watchId: watch.id,
          dialColor: watch.dial_color,
          year
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Price Updated",
        description: `Market price: $${data.price.toLocaleString()} (${data.confidence} confidence)`,
      });

      // Refresh the page to show updated price
      onDelete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch market price",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPrice(false);
    }
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
            <span className="text-muted-foreground">Rarity</span>
            <Badge variant={
              watch.rarity === 'grail' ? 'default' :
              watch.rarity === 'very_rare' ? 'destructive' :
              watch.rarity === 'rare' ? 'secondary' : 'outline'
            } className="text-xs capitalize">
              {watch.rarity ? watch.rarity.replace('_', ' ') : 'common'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Historical</span>
            <Badge variant={
              watch.historical_significance === 'historically_significant' ? 'default' :
              watch.historical_significance === 'notable' ? 'secondary' : 'outline'
            } className="text-xs capitalize">
              {watch.historical_significance ? watch.historical_significance.replace('_', ' ') : 'regular'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trade/Sell</span>
            <Badge variant={watch.available_for_trade ? 'default' : 'outline'} className="text-xs">
              {watch.available_for_trade ? 'Available' : 'Not Available'}
            </Badge>
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
          
          {watch.average_resale_price ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resale Value</span>
              <div className="flex items-center gap-2">
                {showCost ? (
                  <span className="font-medium text-foreground">${watch.average_resale_price.toLocaleString()}</span>
                ) : (
                  <span className="font-medium text-muted-foreground">••••••</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleFetchPrice}
                  disabled={isFetchingPrice}
                  title="Update market price"
                >
                  <RefreshCw className={`w-3 h-3 text-muted-foreground ${isFetchingPrice ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resale Value</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleFetchPrice}
                disabled={isFetchingPrice}
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingPrice ? 'animate-spin' : ''}`} />
                {isFetchingPrice ? 'Fetching...' : 'Get Price'}
              </Button>
            </div>
          )}
          
          {watch.warranty_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Warranty</span>
              <span className={`font-medium text-xs ${new Date(watch.warranty_date) < new Date() ? 'text-destructive' : 'text-green-500'}`}>
                {new Date(watch.warranty_date) < new Date() ? 'Expired' : 'Valid'}
              </span>
            </div>
          )}
          
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

          <EditWatchDialog watch={watch} onSuccess={onDelete} />

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDeleteClick}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
