import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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
import { ProfileSettingsCard } from "@/components/ProfileSettingsCard";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id, selfDelete: true }
      });

      if (error) throw error;

      toast.success("Account deleted successfully");
      await signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account email</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          <ProfileSettingsCard />

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This includes all your watches, 
                    wear entries, trips, events, collections, and preferences. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you absolutely sure you want to delete your account? This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All your watches and their photos</li>
                  <li>All wear entries and history</li>
                  <li>All trips, events, and water usage records</li>
                  <li>Your collections and preferences</li>
                  <li>Your wishlist items</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete My Account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Settings;
