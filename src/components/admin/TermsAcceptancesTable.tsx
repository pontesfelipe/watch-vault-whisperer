import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface TermsAcceptance {
  id: string;
  email: string;
  accepted_terms: boolean;
  accepted_privacy: boolean;
  terms_version: string;
  privacy_version: string;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const TermsAcceptancesTable = () => {
  const [acceptances, setAcceptances] = useState<TermsAcceptance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAcceptances = async () => {
    setLoading(true);
    const { data, error } = await ((supabase as any)
      .from("terms_acceptances")
      .select("*")
      .order("accepted_at", { ascending: false }));

    if (error) {
      console.error("Error fetching acceptances:", error);
    } else {
      setAcceptances(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAcceptances();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Terms & Privacy Acceptances</CardTitle>
          <CardDescription>Loading acceptance records...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Privacy Acceptances</CardTitle>
        <CardDescription>
          View all user acceptances of Terms & Conditions and Privacy Policy (Total: {acceptances.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {acceptances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No acceptance records found.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Privacy</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Accepted At</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acceptances.map((acceptance) => (
                  <TableRow key={acceptance.id}>
                    <TableCell className="font-medium">{acceptance.email}</TableCell>
                    <TableCell>
                      {acceptance.accepted_terms ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Accepted
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Accepted
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {acceptance.accepted_privacy ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Accepted
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Accepted
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>Terms: {acceptance.terms_version}</div>
                        <div>Privacy: {acceptance.privacy_version}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(acceptance.accepted_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {acceptance.user_agent || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
