import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil } from "lucide-react";

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
}

interface PersonalNotesTableProps {
  watches: Watch[];
  onEdit: (watch: Watch) => void;
}

export function PersonalNotesTable({ watches, onEdit }: PersonalNotesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead>Model</TableHead>
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
