import { CreditCard } from "lucide-react";

const PAYMENT_PATTERNS = [
  /send\s+(\$|usd|€|£)\s*\d+/i,
  /\$\d+\s*(via|through|on)\s/i,
  /pay\s+(me|us)\s/i,
  /wire\s+(\$|the|me|us)/i,
  /transfer\s+(\$|the|funds|money)/i,
  /\b\d{8,17}\b.*\b(account|routing|iban|swift)\b/i,
  /\b(account|routing|iban|swift)\b.*\b\d{8,17}\b/i,
  /\b(0x[a-fA-F0-9]{40})\b/,
  /\b([13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/,
  /(urgent|asap|immediately|right now|today only).{0,40}(pay|send|transfer|money)/i,
  /(pay|send|transfer|money).{0,40}(urgent|asap|immediately|right now|today only)/i,
  /my\s+(venmo|cashapp|paypal|zelle)\s+(is|@)/i,
  /@[a-zA-Z0-9_]+\s+(on|via)\s+(venmo|cashapp|paypal)/i,
];

export function detectPaymentSolicitation(message: string): boolean {
  return PAYMENT_PATTERNS.some((pattern) => pattern.test(message));
}

export function PaymentWarningBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-700 dark:text-red-400 leading-tight">
      <CreditCard className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>Payment solicitation detected.</strong> This message appears to request direct payment.
        Never send money directly to another user.
      </span>
    </div>
  );
}
