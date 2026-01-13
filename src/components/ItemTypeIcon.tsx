import { Watch, Footprints, ShoppingBag, LucideIcon } from "lucide-react";
import { CollectionType } from "@/types/collection";
import { cn } from "@/lib/utils";

interface ItemTypeIconProps {
  type: CollectionType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconMap: Record<CollectionType, LucideIcon> = {
  watches: Watch,
  sneakers: Footprints,
  purses: ShoppingBag,
};

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export const ItemTypeIcon = ({ type, className, size = "md" }: ItemTypeIconProps) => {
  const Icon = iconMap[type];
  return <Icon className={cn(sizeMap[size], className)} />;
};

export const getItemTypeIcon = (type: CollectionType): LucideIcon => {
  return iconMap[type];
};
