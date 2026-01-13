import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, DollarSign, Eye, TrendingUp, Edit2, Trash2, ArrowUpDown, Box, CheckCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CollectionType, getCollectionConfig, SNEAKER_CONDITIONS, PURSE_SIZES } from "@/types/collection";
import { ItemTypeIcon } from "./ItemTypeIcon";
import { formatCurrency } from "@/utils/format";

interface DynamicItemCardProps {
  item: any;
  collectionType: CollectionType;
  totalWearDays?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkAsSold?: () => void;
  onMarkAsTraded?: () => void;
  isDraggable?: boolean;
}

export const DynamicItemCard = ({
  item,
  collectionType,
  totalWearDays = 0,
  onEdit,
  onDelete,
  onMarkAsSold,
  onMarkAsTraded,
  isDraggable = false,
}: DynamicItemCardProps) => {
  const navigate = useNavigate();
  const config = getCollectionConfig(collectionType);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons/menus
    if ((e.target as HTMLElement).closest('button, [role="menu"]')) return;
    navigate(`/watch/${item.id}`);
  };

  // Get type-specific display values
  const getPrimaryColorDisplay = () => {
    if (collectionType === 'sneakers' && item.specs?.colorway) {
      return item.specs.colorway;
    }
    if (collectionType === 'purses' && item.specs?.color) {
      return item.specs.color;
    }
    return item.dial_color;
  };

  const getSecondaryInfo = () => {
    switch (collectionType) {
      case 'sneakers':
        const specs = item.specs;
        if (!specs) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {specs.shoe_size && (
              <Badge variant="outline" className="text-xs">
                Size {specs.shoe_size} {specs.size_type}
              </Badge>
            )}
            {specs.condition && (
              <Badge variant="secondary" className="text-xs">
                {SNEAKER_CONDITIONS[specs.condition]?.label || specs.condition}
              </Badge>
            )}
            {specs.limited_edition && (
              <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Limited
              </Badge>
            )}
          </div>
        );
      case 'purses':
        const purseSpecs = item.specs;
        if (!purseSpecs) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {purseSpecs.size_category && (
              <Badge variant="outline" className="text-xs">
                {PURSE_SIZES[purseSpecs.size_category]?.label || purseSpecs.size_category}
              </Badge>
            )}
            {purseSpecs.material && (
              <Badge variant="secondary" className="text-xs">
                {purseSpecs.material}
              </Badge>
            )}
            {purseSpecs.authenticity_verified && (
              <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        );
      case 'watches':
      default:
        return (
          <div className="flex flex-wrap gap-1">
            {item.movement && (
              <Badge variant="outline" className="text-xs">
                {item.movement}
              </Badge>
            )}
            {item.case_size && (
              <Badge variant="secondary" className="text-xs">
                {item.case_size}
              </Badge>
            )}
            {item.rarity && item.rarity !== 'common' && (
              <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
                {item.rarity.replace('_', ' ')}
              </Badge>
            )}
          </div>
        );
    }
  };

  const getPriceMetrics = () => {
    const cost = item.cost || 0;
    const resalePrice = item.average_resale_price;
    const appreciation = resalePrice ? ((resalePrice - cost) / cost * 100).toFixed(0) : null;
    
    return { cost, resalePrice, appreciation };
  };

  const { cost, resalePrice, appreciation } = getPriceMetrics();

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Image placeholder */}
      {item.ai_image_url && (
        <div className="aspect-square overflow-hidden bg-muted">
          <img 
            src={item.ai_image_url} 
            alt={`${item.brand} ${item.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ItemTypeIcon type={collectionType} size="sm" className="text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm truncate">{item.brand}</h3>
            </div>
            <p className="text-muted-foreground text-xs truncate">{item.model}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onMarkAsSold}>
                <DollarSign className="w-4 h-4 mr-2" />
                Mark as Sold
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMarkAsTraded}>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Mark as Traded
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Primary color/colorway */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{config.primaryColorLabel}:</span>
          <Badge variant="outline" className="text-xs">
            {getPrimaryColorDisplay()}
          </Badge>
        </div>
        
        {/* Type-specific secondary info */}
        {getSecondaryInfo()}
        
        {/* Price and metrics */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-medium">{formatCurrency(cost)}</span>
          </div>
          
          {appreciation && (
            <div className={`flex items-center gap-1 text-xs ${parseFloat(appreciation) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <TrendingUp className="w-3 h-3" />
              <span>{appreciation}%</span>
            </div>
          )}
          
          {collectionType === 'watches' && totalWearDays > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalWearDays} day{totalWearDays !== 1 ? 's' : ''} worn
            </Badge>
          )}
        </div>
        
        {/* Trade badge */}
        {item.available_for_trade && (
          <Badge variant="outline" className="text-xs w-full justify-center bg-primary/5">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            Available for Trade
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
