import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, ShieldOff, QrCode, Copy, Check, Key, RefreshCw, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/contexts/AuthContext";

// Generate a random recovery code
const generateRecoveryCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    if (i === 5) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Simple hash function for storing codes (in production, use bcrypt via edge function)
const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace(/-/g, '').toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const TwoFactorAuthCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
  const [hasRecoveryCodes, setHasRecoveryCodes] = useState(false);
  
  // Enrollment state
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Recovery codes state
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // Disable state
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const verifiedFactors = data.totp.filter(f => f.status === 'verified');
      setFactors(verifiedFactors);
      setMfaEnabled(verifiedFactors.length > 0);
      
      // Check for existing recovery codes
      if (user) {
        const { count } = await supabase
          .from('mfa_recovery_codes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('used_at', null);
        setHasRecoveryCodes((count || 0) > 0);
      }
    } catch (error: any) {
      console.error("Error checking MFA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAndStoreRecoveryCodes = async (): Promise<string[]> => {
    if (!user) return [];
    
    // Generate 10 recovery codes
    const codes = Array.from({ length: 10 }, () => generateRecoveryCode());
    
    // Delete existing codes
    await supabase
      .from('mfa_recovery_codes')
      .delete()
      .eq('user_id', user.id);
    
    // Store hashed codes
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        user_id: user.id,
        code_hash: await hashCode(code),
      }))
    );
    
    const { error } = await supabase
      .from('mfa_recovery_codes')
      .insert(hashedCodes);
    
    if (error) throw error;
    
    return codes;
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });
      
      if (error) throw error;
      
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setShowEnrollDialog(true);
    } catch (error: any) {
      console.error("Error starting MFA enrollment:", error);
      toast.error(error.message || "Failed to start 2FA setup");
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    
    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });
      
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode
      });
      
      if (verifyError) throw verifyError;
      
      // Generate recovery codes
      const codes = await generateAndStoreRecoveryCodes();
      setRecoveryCodes(codes);
      
      toast.success("Two-factor authentication enabled!");
      setShowEnrollDialog(false);
      setShowRecoveryCodes(true);
      setVerifyCode("");
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      checkMfaStatus();
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast.error(error.message || "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  const regenerateRecoveryCodes = async () => {
    setRegenerating(true);
    try {
      const codes = await generateAndStoreRecoveryCodes();
      setRecoveryCodes(codes);
      setShowRegenerateConfirm(false);
      setShowRecoveryCodes(true);
      setHasRecoveryCodes(true);
      toast.success("New recovery codes generated");
    } catch (error: any) {
      console.error("Error regenerating codes:", error);
      toast.error(error.message || "Failed to generate recovery codes");
    } finally {
      setRegenerating(false);
    }
  };

  const disableMfa = async () => {
    if (factors.length === 0) return;
    
    setDisabling(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factors[0].id
      });
      
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factors[0].id,
        challengeId: challengeData.id,
        code: disableCode
      });
      
      if (verifyError) throw verifyError;
      
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factors[0].id
      });
      
      if (unenrollError) throw unenrollError;
      
      // Delete recovery codes
      if (user) {
        await supabase
          .from('mfa_recovery_codes')
          .delete()
          .eq('user_id', user.id);
      }
      
      toast.success("Two-factor authentication disabled");
      setShowDisableConfirm(false);
      setDisableCode("");
      checkMfaStatus();
    } catch (error: any) {
      console.error("Error disabling MFA:", error);
      toast.error(error.message || "Failed to disable 2FA. Check your verification code.");
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success("Recovery codes copied to clipboard");
  };

  const downloadRecoveryCodes = () => {
    const content = `Sora Vault Recovery Codes\n${'='.repeat(30)}\n\nSave these codes in a safe place. Each code can only be used once.\n\n${recoveryCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sora-vault-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
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
            {mfaEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">2FA is enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with an authenticator app
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateConfirm(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {hasRecoveryCodes ? "Regenerate Recovery Codes" : "Generate Recovery Codes"}
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => setShowDisableConfirm(true)}
                >
                  <ShieldOff className="w-4 h-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your account by requiring a verification code from an authenticator app 
                (like Google Authenticator, Authy, or 1Password) when you sign in.
              </p>
              <Button onClick={startEnrollment} disabled={enrolling}>
                {enrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Enable Two-Factor Authentication
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => {
        if (!open && !verifying) {
          setShowEnrollDialog(false);
          setVerifyCode("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code for 2FA setup" className="w-48 h-48" />
              </div>
            )}
            
            {secret && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Or enter this code manually:
                </Label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="verifyCode">Enter verification code</Label>
              <Input
                id="verifyCode"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={verifyEnrollment}
              disabled={verifying || verifyCode.length !== 6}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and Enable"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryCodes} onOpenChange={setShowRecoveryCodes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Save Your Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Store these codes in a safe place. Each code can only be used once to sign in if you lose access to your authenticator app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {recoveryCodes.map((code, index) => (
                <code key={index} className="text-sm font-mono p-1">
                  {code}
                </code>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyRecoveryCodes}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" className="flex-1" onClick={downloadRecoveryCodes}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              After closing this dialog, you won't be able to see these codes again.
            </p>
            
            <Button className="w-full" onClick={() => setShowRecoveryCodes(false)}>
              I've Saved My Codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Codes Confirmation */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Recovery Codes?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasRecoveryCodes 
                ? "This will invalidate all your existing recovery codes. Make sure you save the new codes in a safe place."
                : "This will generate 10 new recovery codes that you can use if you lose access to your authenticator app."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={regenerateRecoveryCodes} disabled={regenerating}>
              {regenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Codes
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will remove the extra security layer from your account. 
                Enter your verification code to confirm.
              </p>
              <div className="space-y-2">
                <Label htmlFor="disableCode">Verification code</Label>
                <Input
                  id="disableCode"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={disableMfa}
              disabled={disabling || disableCode.length !== 6}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disabling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
