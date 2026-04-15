import { ExternalLink } from "lucide-react";

const SUSPICIOUS_DOMAINS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "adf.ly", "bc.vc", "cutt.ly",
  "discord.gg", "telegr.am", "telegram.me",
];

const SAFE_DOMAINS = [
  "chrono24.com", "hodinkee.com", "watchuseek.com", "rolex.com",
  "omega.com", "patek.com", "instagram.com", "youtube.com",
];

const URL_REGEX = /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi;

export function detectSuspiciousLinks(message: string): { hasSuspicious: boolean; urls: string[] } {
  const urls = message.match(URL_REGEX) || [];
  if (urls.length === 0) return { hasSuspicious: false, urls: [] };

  const suspiciousUrls = urls.filter((url) => {
    const lower = url.toLowerCase();
    if (SAFE_DOMAINS.some((d) => lower.includes(d))) return false;
    if (SUSPICIOUS_DOMAINS.some((d) => lower.includes(d))) return true;
    return false;
  });

  return { hasSuspicious: suspiciousUrls.length > 0, urls: suspiciousUrls };
}

export function LinkWarningBanner({ urls }: { urls: string[] }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>Suspicious link detected.</strong> This message contains a shortened or unverified URL.
        Do not click links from untrusted users. {urls.length > 0 && (
          <span className="opacity-70">({urls.length} flagged)</span>
        )}
      </span>
    </div>
  );
}
