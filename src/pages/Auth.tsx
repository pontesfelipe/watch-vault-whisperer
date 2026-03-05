import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Watch, Footprints, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { RegistrationRequestForm } from "@/components/RegistrationRequestForm";
import { BetaBadge } from "@/components/BetaBadge";
import { lovable } from "@/integrations/lovable/index";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { TermsDialog } from "@/components/TermsDialog";
import { MfaVerification } from "@/components/MfaVerification";
import { recordLoginAttempt } from "@/utils/loginTracking";
import heroImage from "@/assets/hero-collection.jpg";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showMfaVerification, setShowMfaVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "request">("signin");

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

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error("Please enter your first and last name");
        return;
      }
      if (!acceptedTerms || !acceptedPrivacy) {
        toast.error("Please accept Terms & Conditions and Privacy Policy");
        return;
      }
    }

    setSigningIn(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! You can now sign in.");
          setIsSignUp(false);
          setAcceptedTerms(false);
          setAcceptedPrivacy(false);
          setFirstName("");
          setLastName("");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        } else if (data.session && data.user) {
          recordLoginAttempt(data.user.id, true);
          
          const { data: factorsData } = await supabase.auth.mfa.listFactors();
          const verifiedFactors = factorsData?.totp.filter(f => f.status === 'verified') || [];
          
          if (verifiedFactors.length > 0) {
            setShowMfaVerification(true);
          }
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
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
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

  const handleAppleSignIn = async () => {
    setSigningIn(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Apple sign in error:", error);
      toast.error("Failed to sign in with Apple");
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

  if (showMfaVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <AnimatedLogo />
          </div>
          <MfaVerification
            onSuccess={() => {
              setShowMfaVerification(false);
              navigate("/");
            }}
            onCancel={async () => {
              await supabase.auth.signOut();
              setShowMfaVerification(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Cinematic Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Ken Burns animated hero */}
        <motion.img 
          src={heroImage} 
          alt="Luxury collection" 
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
        />
        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end p-16 pb-20">
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            <AnimatedLogo size="lg" />
            
            <motion.p 
              className="text-lg text-muted-foreground max-w-sm leading-relaxed font-light tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              The premier platform for managing your luxury collections with precision and elegance.
            </motion.p>
            
            <motion.div 
              className="flex gap-3 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              {[
                { icon: Watch, label: "Watches" },
                { icon: Footprints, label: "Sneakers" },
                { icon: ShoppingBag, label: "Purses" },
              ].map(({ icon: Icon, label }, i) => (
                <motion.div 
                  key={label} 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card/50 backdrop-blur-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.1 + i * 0.1 }}
                  whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary))" }}
                >
                  <Icon className="h-4 w-4 text-primary/70" />
                  <span className="text-sm text-foreground/70">{label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div 
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile header */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <AnimatedLogo />
            <motion.p 
              className="text-center text-muted-foreground text-sm mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Your luxury collection studio
            </motion.p>
            <motion.div 
              className="flex gap-2 mt-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { icon: Watch, label: "Watches" },
                { icon: Footprints, label: "Sneakers" },
                { icon: ShoppingBag, label: "Purses" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/50">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-10">
            <motion.div 
              className="flex items-center gap-2.5 mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
              <BetaBadge />
            </motion.div>
            <motion.p 
              className="text-muted-foreground text-[15px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              Sign in to access your collections
            </motion.p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8">
            {([
              { key: "signin", label: "Sign In" },
              { key: "request", label: "Request Access" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeTab === key && (
                  <motion.div
                    layoutId="auth-tab-bg"
                    className="absolute inset-0 bg-background rounded-lg shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "signin" ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Social Login — Premium Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <SocialButton
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    icon={<GoogleIcon />}
                    label="Google"
                  />
                  <SocialButton
                    onClick={handleAppleSignIn}
                    disabled={signingIn}
                    icon={<AppleIcon />}
                    label="Apple"
                  />
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-[11px] text-muted-foreground uppercase tracking-[0.2em] font-medium">or continue with email</span>
                  </div>
                </div>

                {showPasswordReset ? (
                  <PasswordResetForm
                    resetEmail={resetEmail}
                    setResetEmail={setResetEmail}
                    signingIn={signingIn}
                    onSubmit={handlePasswordReset}
                    onBack={() => setShowPasswordReset(false)}
                  />
                ) : (
                  <EmailAuthForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    isSignUp={isSignUp}
                    signingIn={signingIn}
                    acceptedTerms={acceptedTerms}
                    setAcceptedTerms={setAcceptedTerms}
                    acceptedPrivacy={acceptedPrivacy}
                    setAcceptedPrivacy={setAcceptedPrivacy}
                    onSubmit={handleEmailAuth}
                    onForgotPassword={() => setShowPasswordReset(true)}
                    onOpenTerms={() => setTermsOpen(true)}
                    onOpenPrivacy={() => setPrivacyOpen(true)}
                  />
                )}

                {!showPasswordReset && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      disabled={signingIn}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isSignUp ? "Already have an account? " : "Don't have an account? "}
                      <span className="font-medium text-foreground">{isSignUp ? "Sign in" : "Sign up"}</span>
                    </button>
                  </div>
                )}

                <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
                  By continuing, you agree to our terms of service
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="request"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <RegistrationRequestForm />
              </motion.div>
            )}
          </AnimatePresence>

          <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
          <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
        </motion.div>
      </div>
    </div>
  );
}

/* ── Animated Logo ── */
function AnimatedLogo({ size = "default" }: { size?: "default" | "lg" }) {
  const isLg = size === "lg";
  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div 
        className={`relative flex items-center justify-center rounded-2xl font-bold text-primary overflow-hidden ${
          isLg ? "h-14 w-14 text-xl" : "h-12 w-12 text-lg"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-primary/10" />
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative z-10">SV</span>
      </motion.div>
      <div className="flex items-center gap-2">
        <h1 className={`font-semibold tracking-tight text-foreground ${isLg ? "text-3xl" : "text-2xl"}`}>
          Sora Vault
        </h1>
        <BetaBadge />
      </div>
    </motion.div>
  );
}

/* ── Social Button ── */
function SocialButton({ onClick, disabled, icon, label }: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="group relative flex items-center justify-center gap-2.5 w-full h-12 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 text-sm font-medium text-foreground disabled:opacity-50"
      whileHover={{ y: -1, boxShadow: "var(--shadow-soft)" }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
      {label}
    </motion.button>
  );
}

/* ── Icons ── */
function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

/* ── Premium Input ── */
function PremiumInput({ id, type, placeholder, value, onChange, disabled, maxLength, className }: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  maxLength?: number;
  className?: string;
}) {
  return (
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      maxLength={maxLength}
      className={`h-12 rounded-xl bg-muted/30 border-border focus:bg-background focus:border-primary/50 focus:shadow-[var(--shadow-glow)] transition-all duration-300 ${className || ""}`}
    />
  );
}

/* ── Password Reset Form ── */
function PasswordResetForm({ resetEmail, setResetEmail, signingIn, onSubmit, onBack }: {
  resetEmail: string;
  setResetEmail: (v: string) => void;
  signingIn: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">Email</Label>
        <PremiumInput
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
        className="w-full h-12 rounded-xl text-sm font-semibold"
      >
        {signingIn ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Sending...
          </>
        ) : (
          <>Send Sign-In Link<ArrowRight className="ml-2 h-4 w-4" /></>
        )}
      </Button>
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          disabled={signingIn}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to sign in
        </button>
      </div>
    </form>
  );
}

/* ── Email Auth Form ── */
function EmailAuthForm({ email, setEmail, password, setPassword, firstName, setFirstName, lastName, setLastName, isSignUp, signingIn, acceptedTerms, setAcceptedTerms, acceptedPrivacy, setAcceptedPrivacy, onSubmit, onForgotPassword, onOpenTerms, onOpenPrivacy }: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  isSignUp: boolean;
  signingIn: boolean;
  acceptedTerms: boolean;
  setAcceptedTerms: (v: boolean) => void;
  acceptedPrivacy: boolean;
  setAcceptedPrivacy: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AnimatePresence>
        {isSignUp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <PremiumInput
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={signingIn}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <PremiumInput
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={signingIn}
                  maxLength={50}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <PremiumInput
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
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          {!isSignUp && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          )}
        </div>
        <PremiumInput
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={signingIn}
        />
      </div>

      <AnimatePresence>
        {isSignUp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  disabled={signingIn}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  I accept the{" "}
                  <button type="button" onClick={onOpenTerms} className="text-primary underline-offset-4 hover:underline">
                    Terms & Conditions
                  </button>
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  disabled={signingIn}
                  className="mt-0.5"
                />
                <label htmlFor="privacy" className="text-sm text-muted-foreground leading-relaxed">
                  I accept the{" "}
                  <button type="button" onClick={onOpenPrivacy} className="text-primary underline-offset-4 hover:underline">
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          disabled={signingIn}
          className="w-full h-12 rounded-xl text-sm font-semibold mt-2"
        >
          {signingIn ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              {isSignUp ? "Creating account..." : "Signing in..."}
            </>
          ) : (
            <>
              {isSignUp ? "Create Account" : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
