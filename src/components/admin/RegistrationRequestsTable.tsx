import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X } from "lucide-react";

interface RegistrationRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  status: string;
}

export function RegistrationRequestsTable() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await ((supabase as any)
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false }));

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load registration requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: RegistrationRequest) => {
    try {
      // Add to allowed_users
      const { error: allowError } = await ((supabase as any)
        .from('allowed_users')
        .insert({
          email: request.email,
          notes: `${request.first_name} ${request.last_name}`,
        }));

      if (allowError) {
        if (allowError.code === '23505') {
          toast.error("This email is already in the allowed users list");
          return;
        }
        throw allowError;
      }

      // Update request status
      const { error: updateError } = await ((supabase as any)
        .from('registration_requests')
        .update({ status: 'approved' })
        .eq('id', request.id));

      if (updateError) throw updateError;

      toast.success(`Approved registration request for ${request.email}`);
      fetchRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error(error.message || "Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await ((supabase as any)
        .from('registration_requests')
        .update({ status: 'rejected' })
        .eq('id', id));

      if (error) throw error;

      toast.success("Registration request rejected");
      fetchRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {requests.length} {requests.length === 1 ? "request" : "requests"}
      </p>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No registration requests yet
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.first_name} {request.last_name}
                  </TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "default"
                          : request.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(request)}
                          className="gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
