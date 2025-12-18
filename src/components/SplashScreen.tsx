import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export const SplashScreen = ({ onComplete, minDuration = 1500 }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
      
      {/* Animated glow effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="relative">
          <div 
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent/15 text-4xl font-bold text-accent shadow-2xl shadow-accent/30 animate-scale-in"
            style={{ animationDuration: '0.6s' }}
          >
            SV
          </div>
          {/* Decorative ring */}
          <div className="absolute -inset-3 rounded-[2rem] border border-accent/20 animate-pulse" />
        </div>

        {/* Brand name */}
        <div 
          className="flex flex-col items-center gap-1 animate-fade-in"
          style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-textMain">
            Sora Vault
          </h1>
          <p className="text-sm text-textMuted tracking-widest uppercase">
            Watch Collection Studio
          </p>
        </div>

        {/* Loading indicator */}
        <div 
          className="flex items-center gap-2 mt-4 animate-fade-in"
          style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-8 text-xs text-textMuted/50 animate-fade-in"
        style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}
      >
        Premium Watch Management
      </div>
    </div>
  );
};
