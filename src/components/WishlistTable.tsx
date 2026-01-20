import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  brand: string;
  model: string;
  dial_colors: string;
  rank: number;
  notes?: string;
  is_ai_suggested: boolean;
}

interface WishlistTableProps {
  items: WishlistItem[];
  onDelete: () => void;
  showAISuggested?: boolean;
  showDeleteButton?: boolean;
}

export const WishlistTable = ({ items, onDelete, showAISuggested = false, showDeleteButton = true }: WishlistTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;

    console.log("Attempting to delete wishlist item:", deleteId);

    try {
      const { error, data } = await (supabase.from('wishlist' as any) as any)
        .delete()
        .eq("id", deleteId)
        .select();

      console.log("Delete result:", { error, data });

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Watch removed from wishlist",
      });

      setDeleteId(null);
      onDelete();
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      toast({
        title: "Error",
        description: "Failed to delete watch from wishlist",
        variant: "destructive",
      });
    }
  };

  // Since items are already pre-filtered by parent, just use all items passed in
  const filteredItems = items;

  const sortedItems = [...filteredItems].sort((a, b) => a.rank - b.rank);

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {showAISuggested 
          ? "No AI suggestions yet. Add your taste preferences to get personalized recommendations."
          : "Your wishlist is empty. Add some watches you'd like to own!"}
      </div>
    );
  }

  return (
    <>
      <div className="table-mobile-wrapper">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] sm:w-[80px]">Rank</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="hidden sm:table-cell">Dial Colors</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
              {showDeleteButton && <TableHead className="w-[60px] sm:w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {item.rank > 0 && item.rank <= 5 && (
                      <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500" />
                    )}
                    <span className="font-medium text-sm">{item.rank || "-"}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm">{item.brand}</TableCell>
                <TableCell className="text-sm">{item.model}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{item.dial_colors}</TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate text-sm">
                  {item.notes || "-"}
                </TableCell>
                {showDeleteButton && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this watch from your wishlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};