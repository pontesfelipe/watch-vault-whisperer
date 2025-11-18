import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Watch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RegistrationRequestForm } from "@/components/RegistrationRequestForm";
import { BetaBadge } from "@/components/BetaBadge";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }

    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: resetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Magic sign-in link sent! Check your inbox.");
        setShowPasswordReset(false);
        setResetEmail("");
      }
    } catch (error) {
      console.error("Magic link error:", error);
      toast.error("Failed to send sign-in link");
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setSigningIn(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! You can now sign in.");
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Authentication failed");
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in");
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-3">
            <Watch className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-center">Welcome to Watch Tracker</h1>
          <BetaBadge />
        </div>
        <p className="text-center text-muted-foreground mb-8">
          Sign in or request access to manage your watch collection
        </p>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="request">Request Access</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">
                  {showPasswordReset ? "Email Sign-In Link" : isSignUp ? "Create Account" : "Sign In"}
                </CardTitle>
                <CardDescription>
                  {showPasswordReset 
                    ? "We'll email you a magic link that logs you in instantly"
                    : isSignUp 
                    ? "Create an account to start tracking your watches" 
                    : "Sign in to access your watch collection"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showPasswordReset ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        disabled={signingIn}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={signingIn}
                      className="w-full"
                      size="lg"
                    >
                      {signingIn ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        "Send Sign-In Link"
                      )}
                    </Button>
                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={() => setShowPasswordReset(false)}
                        disabled={signingIn}
                        className="text-sm"
                      >
                        Back to sign in
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={signingIn}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {!isSignUp && (
                          <Button
                            variant="link"
                            onClick={() => setShowPasswordReset(true)}
                            className="text-xs h-auto p-0"
                            type="button"
                          >
                            Email me a sign-in link
                          </Button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={signingIn}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={signingIn}
                      className="w-full"
                      size="lg"
                    >
                      {signingIn ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          {isSignUp ? "Creating account..." : "Signing in..."}
                        </>
                      ) : (
                        isSignUp ? "Create Account" : "Sign In"
                      )}
                    </Button>
                  </form>
                )}

                {!showPasswordReset && (
                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setIsSignUp(!isSignUp)}
                      disabled={signingIn}
                      className="text-sm"
                    >
                      {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                    </Button>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
                  Continue with Google
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  By continuing, you agree to our terms of service
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="request">
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Request Access</CardTitle>
                <CardDescription>
                  Choose how you'd like to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground">Option 1: Create Your Own Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Create an account with your email and password right now
                  </p>
                  <Button
                    onClick={() => {
                      setIsSignUp(true);
                      const tabs = document.querySelector('[value="signin"]') as HTMLElement;
                      tabs?.click();
                    }}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Create Account with Email
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground">Option 2: Request Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a request and we'll review your application
                  </p>
                  <RegistrationRequestForm />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
