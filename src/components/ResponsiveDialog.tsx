import { ReactNode, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  trigger?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Uses Drawer on mobile, Dialog on desktop.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  trigger,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  // Safety: ensure body styles are reset when dialog/drawer closes.
  // vaul + Radix can occasionally leave pointer-events:none or position:fixed
  // on <body> on mobile, blocking subsequent interactions.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = "";
        }
        if (document.body.style.position === "fixed") {
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.left = "";
          document.body.style.right = "";
        }
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className={className}>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div
            data-vaul-no-drag
            className="px-4 pb-6 max-h-[80vh] overflow-y-auto overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
            onTouchStart={(e) => {
              // Prevent vaul drawer from hijacking vertical scroll on iOS Safari
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={`${className ?? ""} max-h-[90vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          className="overflow-y-auto overscroll-contain pr-1 -mr-1 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
