import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { formatPurchaseDateForDisplay, parsePurchaseDate } from "@/lib/date";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  why_bought?: string;
  when_bought?: string;
  what_i_like?: string;
  what_i_dont_like?: string;
  created_at: string;
  sentiment?: string;
  sentiment_analyzed_at?: string;
}

interface PersonalNotesTableProps {
  watches: Watch[];
  onEdit: (watch: Watch) => void;
}

const getSentimentVariant = (sentiment?: string): "default" | "secondary" | "destructive" | "outline" => {
  if (!sentiment) return "outline";
  const s = sentiment.toLowerCase();
  if (s.includes("highly positive")) return "default";
  if (s.includes("positive")) return "secondary";
  if (s.includes("negative")) return "destructive";
  return "outline";
};

export function PersonalNotesTable({ watches, onEdit }: PersonalNotesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Why I bought</TableHead>
            <TableHead>When I bought</TableHead>
            <TableHead>What I like</TableHead>
            <TableHead>What I don't like</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {watches.map((watch) => (
            <TableRow key={watch.id}>
              <TableCell className="font-medium">{watch.brand}</TableCell>
              <TableCell>{watch.model}</TableCell>
              <TableCell>
                {watch.sentiment ? (
                  <Badge variant={getSentimentVariant(watch.sentiment)}>
                    {watch.sentiment}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Not analyzed</span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="truncate">{watch.why_bought || "-"}</div>
              </TableCell>
              <TableCell>{watch.when_bought ? (() => { const p = parsePurchaseDate(watch.when_bought, watch.created_at); return formatPurchaseDateForDisplay(p.date, p.precision); })() : "-"}</TableCell>
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
                  onClick={() => onEdit(watch)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
