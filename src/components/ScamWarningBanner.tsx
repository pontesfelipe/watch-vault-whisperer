import { AlertTriangle } from "lucide-react";

const SCAM_KEYWORDS = [
  "venmo", "zelle", "cashapp", "cash app", "paypal", "wire me", "wire transfer",
  "western union", "moneygram", "crypto", "bitcoin", "btc", "eth",
  "send money", "bank transfer", "pay me directly", "pay outside",
  "gift card", "apple pay me", "google pay me",
  "off platform", "off the platform", "outside the app",
  "my personal email", "text me at", "call me at", "whatsapp",
];

export function detectScamKeywords(message: string): boolean {
  const lower = message.toLowerCase();
  return SCAM_KEYWORDS.some((kw) => lower.includes(kw));
}

export function ScamWarningBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-[11px] text-destructive leading-tight">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>Warning:</strong> This message may contain a request to transact outside the platform.
        Never share payment info or send money directly to another user.
      </span>
    </div>
  );
}
