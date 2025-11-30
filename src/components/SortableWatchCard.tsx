import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { WatchCard } from "./WatchCard";

interface SortableWatchCardProps {
  watch: {
    id: string;
    brand: string;
    model: string;
    dial_color: string;
    type: string;
    cost: number;
    case_size?: string;
    lug_to_lug_size?: string;
    caseback_material?: string;
    movement?: string;
    has_sapphire?: boolean;
    average_resale_price?: number;
    warranty_date?: string;
    warranty_card_url?: string;
    when_bought?: string;
    rarity?: string;
    historical_significance?: string;
    available_for_trade?: boolean;
    metadata_analysis_reasoning?: string;
    ai_image_url?: string;
  };
  totalDays: number;
  onDelete: () => void;
}

export const SortableWatchCard = ({ watch, totalDays, onDelete }: SortableWatchCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: watch.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/80 backdrop-blur-sm rounded-lg p-1.5 hover:bg-background transition-colors"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <WatchCard watch={watch} totalDays={totalDays} onDelete={onDelete} />
    </div>
  );
};
