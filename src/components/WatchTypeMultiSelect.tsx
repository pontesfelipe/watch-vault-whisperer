import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const WATCH_TYPES = [
  "Diver",
  "Chronograph",
  "GMT",
  "Pilot",
  "Dress",
  "Field",
  "Racing",
  "Sport",
  "Digital",
  "Tool",
  "Vintage",
  "Skeleton",
] as const;

interface WatchTypeMultiSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const WatchTypeMultiSelect = ({ value, onChange, className }: WatchTypeMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse existing value to array
  const selectedTypes = value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const handleToggleType = (type: string) => {
    const newSelected = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onChange(newSelected.join(", "));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const displayText = selectedTypes.length > 0 
    ? selectedTypes.join(", ") 
    : "Select type(s)";

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between bg-background border-border text-left font-normal"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-md">
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {WATCH_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => handleToggleType(type)}
                />
                <Label
                  htmlFor={`type-${type}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>
          {selectedTypes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => onChange("")}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { WATCH_TYPES };
