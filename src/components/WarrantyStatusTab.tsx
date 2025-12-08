import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";

interface Watch {
  id: string;
  brand: string;
  model: string;
  warranty_date?: string | null;
}

interface WarrantyStatusTabProps {
  watches: Watch[];
}

type WarrantyStatus = "active" | "expiring" | "expired" | "none";

const getWarrantyStatus = (warrantyDate: string | null | undefined): { status: WarrantyStatus; daysRemaining: number | null } => {
  if (!warrantyDate) {
    return { status: "none", daysRemaining: null };
  }

  const today = new Date();
  const expiry = parseISO(warrantyDate);
  const daysRemaining = differenceInDays(expiry, today);

  if (daysRemaining < 0) {
    return { status: "expired", daysRemaining: Math.abs(daysRemaining) };
  } else if (daysRemaining <= 30) {
    return { status: "expiring", daysRemaining };
  } else {
    return { status: "active", daysRemaining };
  }
};

const getStatusBadge = (status: WarrantyStatus, daysRemaining: number | null) => {
  switch (status) {
    case "active":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Active ({daysRemaining} days)
        </Badge>
      );
    case "expiring":
      return (
        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
          <ShieldAlert className="h-3 w-3 mr-1" />
          Expiring Soon ({daysRemaining} days)
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="destructive">
          <ShieldX className="h-3 w-3 mr-1" />
          Expired ({daysRemaining} days ago)
        </Badge>
      );
    case "none":
      return (
        <Badge variant="secondary">
          <Shield className="h-3 w-3 mr-1" />
          No Warranty
        </Badge>
      );
  }
};

export function WarrantyStatusTab({ watches }: WarrantyStatusTabProps) {
  const sortedWatches = [...watches].sort((a, b) => {
    if (!a.warranty_date && !b.warranty_date) return 0;
    if (!a.warranty_date) return 1;
    if (!b.warranty_date) return -1;
    return new Date(a.warranty_date).getTime() - new Date(b.warranty_date).getTime();
  });

  const stats = {
    active: watches.filter(w => getWarrantyStatus(w.warranty_date).status === "active").length,
    expiring: watches.filter(w => getWarrantyStatus(w.warranty_date).status === "expiring").length,
    expired: watches.filter(w => getWarrantyStatus(w.warranty_date).status === "expired").length,
    none: watches.filter(w => getWarrantyStatus(w.warranty_date).status === "none").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-500">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-textMain mt-1">{stats.active}</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-500">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-medium">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-textMain mt-1">{stats.expiring}</p>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldX className="h-5 w-5" />
            <span className="font-medium">Expired</span>
          </div>
          <p className="text-2xl font-bold text-textMain mt-1">{stats.expired}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-borderSubtle">
          <div className="flex items-center gap-2 text-textMuted">
            <Shield className="h-5 w-5" />
            <span className="font-medium">No Warranty</span>
          </div>
          <p className="text-2xl font-bold text-textMain mt-1">{stats.none}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Watch</TableHead>
            <TableHead>Warranty Expiration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedWatches.map((watch) => {
            const { status, daysRemaining } = getWarrantyStatus(watch.warranty_date);
            return (
              <TableRow key={watch.id}>
                <TableCell className="font-medium">
                  {watch.brand} {watch.model}
                </TableCell>
                <TableCell>
                  {watch.warranty_date 
                    ? format(parseISO(watch.warranty_date), "MMM d, yyyy")
                    : "—"
                  }
                </TableCell>
                <TableCell>
                  {getStatusBadge(status, daysRemaining)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
