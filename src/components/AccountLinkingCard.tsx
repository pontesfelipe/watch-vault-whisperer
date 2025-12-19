import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link2, Unlink, Mail, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
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

interface LinkedProvider {
  provider: string;
  email?: string;
  created_at?: string;
}

export const AccountLinkingCard = () => {
  const { user } = useAuth();
  const [linkedProviders, setLinkedProviders] = useState<LinkedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [addingPassword, setAddingPassword] = useState(false);
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    if (user) {
      loadLinkedProviders();
    }
  }, [user]);

  const loadLinkedProviders = () => {
    if (!user?.identities) {
      setLoading(false);
      return;
    }

    const providers: LinkedProvider[] = user.identities.map((identity: any) => ({
      provider: identity.provider,
      email: identity.identity_data?.email,
      created_at: identity.created_at,
    }));

    setLinkedProviders(providers);
    setLoading(false);
  };

  const hasProvider = (provider: string) => {
    return linkedProviders.some((p) => p.provider === provider);
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/settings`,
        },
      });

      if (error) throw error;
      // User will be redirected to Google for auth
    } catch (error: any) {
      console.error("Error linking Google:", error);
      toast.error(error.message || "Failed to link Google account");
      setLinkingGoogle(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setAddingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password added successfully! You can now sign in with email and password.");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      
      // Refresh user to get updated identities
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        // Add email provider to the list if not already there
        if (!hasProvider("email")) {
          setLinkedProviders((prev) => [
            ...prev,
            { provider: "email", email: user?.email },
          ]);
        }
      }
    } catch (error: any) {
      console.error("Error adding password:", error);
      toast.error(error.message || "Failed to add password");
    } finally {
      setAddingPassword(false);
    }
  };

  const handleUnlinkProvider = async () => {
    if (!unlinkProvider || linkedProviders.length <= 1) {
      toast.error("You must have at least one authentication method");
      return;
    }

    setUnlinking(true);
    try {
      const identity = user?.identities?.find(
        (i: any) => i.provider === unlinkProvider
      );

      if (!identity) {
        throw new Error("Identity not found");
      }

      const { error } = await supabase.auth.unlinkIdentity(identity);

      if (error) throw error;

      toast.success(`${getProviderName(unlinkProvider)} unlinked successfully`);
      setLinkedProviders((prev) =>
        prev.filter((p) => p.provider !== unlinkProvider)
      );
    } catch (error: any) {
      console.error("Error unlinking provider:", error);
      toast.error(error.message || "Failed to unlink provider");
    } finally {
      setUnlinking(false);
      setUnlinkProvider(null);
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "google":
        return "Google";
      case "email":
        return "Email/Password";
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <Link2 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect multiple sign-in methods to your account for flexibility and backup access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Currently linked providers */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Connected Methods</Label>
            {linkedProviders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No providers linked yet.</p>
            ) : (
              <div className="space-y-2">
                {linkedProviders.map((provider) => (
                  <div
                    key={provider.provider}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background">
                        {getProviderIcon(provider.provider)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getProviderName(provider.provider)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        </div>
                        {provider.email && (
                          <p className="text-xs text-muted-foreground">
                            {provider.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {linkedProviders.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUnlinkProvider(provider.provider)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new providers */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">Add Sign-in Method</Label>
            <div className="space-y-2">
              {/* Google linking */}
              {!hasProvider("google") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLinkGoogle}
                  disabled={linkingGoogle}
                >
                  {linkingGoogle ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Link Google Account
                </Button>
              )}

              {/* Email/Password linking */}
              {!hasProvider("email") && !showPasswordForm && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowPasswordForm(true)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Add Email/Password
                </Button>
              )}

              {/* Password form */}
              {showPasswordForm && (
                <form onSubmit={handleAddPassword} className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="link-password">Create Password</Label>
                    <div className="relative">
                      <Input
                        id="link-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter a password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <PasswordStrengthIndicator password={newPassword} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-confirm-password">Confirm Password</Label>
                    <Input
                      id="link-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You'll be able to sign in with {user?.email} and this password.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addingPassword}>
                      {addingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Password"
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {hasProvider("google") && hasProvider("email") && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  All available sign-in methods are connected.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlink confirmation dialog */}
      <AlertDialog open={!!unlinkProvider} onOpenChange={() => setUnlinkProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink {unlinkProvider && getProviderName(unlinkProvider)}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sign in using {unlinkProvider && getProviderName(unlinkProvider)}. 
              Make sure you have another way to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkProvider}
              disabled={unlinking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                "Unlink"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
