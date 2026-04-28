import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, MailX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Status = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMsg("Missing unsubscribe token.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
          setErrorMsg(data?.error || "Invalid or expired link.");
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid === true) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err?.message || "Network error.");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data?.error || "Could not process request.");
        return;
      }
      if (data.success === true || data.reason === "already_unsubscribed") {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg("Could not process request.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Network error.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailX className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Email preferences</CardTitle>
          <CardDescription>Sora Vault</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {status === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">
                Click below to unsubscribe from non-essential emails from Sora Vault. You will still receive
                important account-related messages such as security alerts and password resets.
              </p>
              <Button onClick={handleConfirm} className="w-full" size="lg">
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {status === "submitting" && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {status === "success" && (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <p className="font-medium">You have been unsubscribed.</p>
              <p className="text-sm text-muted-foreground">
                Sorry to see you go. You can still log in to Sora Vault any time.
              </p>
            </div>
          )}
          {status === "already" && (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <p className="font-medium">You are already unsubscribed.</p>
              <p className="text-sm text-muted-foreground">No further action needed.</p>
            </div>
          )}
          {(status === "invalid" || status === "error") && (
            <div className="space-y-2">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}