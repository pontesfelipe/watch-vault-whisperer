import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, KeyRound, Eye, EyeOff, Info } from "lucide-react";
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
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

interface EditUserDialogProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: "admin" | "user";
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditUserDialog = ({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) => {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [role, setRole] = useState<"admin" | "user">(user.role);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Provider info (for disabling password reset for Google-only users)
  const [providerLoading, setProviderLoading] = useState(false);
  const [isGoogleOnlyUser, setIsGoogleOnlyUser] = useState<boolean | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  const providerLabel = useMemo(() => {
    if (!providers.length) return null;
    return providers
      .map((p) => (p === "google" ? "Google" : p === "email" ? "Email/Password" : p))
      .join(", ");
  }, [providers]);

  useEffect(() => {
    setFullName(user.full_name || "");
    setRole(user.role);
  }, [user.id, user.full_name, user.role]);

  useEffect(() => {
    const fetchProviders = async () => {
      if (!open) return;
      setProviderLoading(true);
      setIsGoogleOnlyUser(null);
      setProviders([]);

      try {
        const { data, error } = await supabase.functions.invoke("admin-user-providers", {
          body: { userEmail: user.email },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setProviders(Array.isArray(data?.providers) ? data.providers : []);
        setIsGoogleOnlyUser(!!data?.isGoogleOnly);
      } catch (err: any) {
        // If we can't fetch providers, we don't block admin actions.
        console.error("Failed to fetch user providers:", err);
        setIsGoogleOnlyUser(null);
      } finally {
        setProviderLoading(false);
      }
    };

    fetchProviders();
  }, [open, user.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile name
      if (fullName !== user.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() || null })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Update role if changed
      if (role !== user.role) {
        if (role === "admin") {
          const { error } = await (supabase as any)
            .from("user_roles")
            .insert({
              user_id: user.id,
              role: 'admin',
            });
          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from("user_roles")
            .delete()
            .eq('user_id', user.id)
            .eq('role', 'admin');
          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userEmail: user.email, newPassword }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Password reset successfully",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    try {
      // Call edge function to delete user (requires service role key)
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update information for {user.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>

          {/* Password Reset Section */}
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Reset Password</h4>
            </div>

            {providerLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking sign-in method…
              </div>
            ) : isGoogleOnlyUser ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">Password reset unavailable for Google-only accounts</p>
                    <p className="text-muted-foreground">
                      This user signs in with Google. To enable password sign-in, they must add Email/Password to their account.
                    </p>
                    {providerLabel && (
                      <p className="text-xs text-muted-foreground">Connected: {providerLabel}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {providerLabel && (
                  <p className="text-xs text-muted-foreground">Connected: {providerLabel}</p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleResetPassword}
                  disabled={resettingPassword || !newPassword || !confirmPassword}
                >
                  {resettingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the account for <strong>{user.email}</strong>? 
              This will permanently delete all their data including watches, wear entries, trips, events, and collections. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
