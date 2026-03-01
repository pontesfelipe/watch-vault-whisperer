import { Plus, Check, Crown, Edit3, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCollection } from "@/contexts/CollectionContext";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useAuth } from "@/contexts/AuthContext";
import { COLLECTION_TYPE_CONFIGS } from "@/types/collection";
import { useState } from "react";
import { CreateFirstCollectionDialog } from "./CreateFirstCollectionDialog";

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner': return <Crown className="w-3 h-3" />;
    case 'editor': return <Edit3 className="w-3 h-3" />;
    case 'viewer': return <Eye className="w-3 h-3" />;
    default: return null;
  }
};

const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  switch (role) {
    case 'owner': return 'default';
    case 'editor': return 'secondary';
    case 'viewer': return 'outline';
    default: return 'outline';
  }
};

export const CollectionSwitcher = () => {
  const { selectedCollectionId, setSelectedCollectionId, currentCollection } = useCollection();
  const { collections, refetch } = useCollectionData();
  const { isAdmin } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const ownedCollections = collections.filter(c => c.role === 'owner');
  const canCreateCollection = isAdmin || ownedCollections.length === 0;

  const currentTypeConfig = currentCollection?.collection_type
    ? COLLECTION_TYPE_CONFIGS[currentCollection.collection_type]
    : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-1.5 px-2 md:px-3 max-w-[200px] md:max-w-xs font-medium text-sm">
            {currentTypeConfig && (
              <span className="text-base leading-none flex-shrink-0">{currentTypeConfig.icon}</span>
            )}
            <span className="truncate">{currentCollection?.name || "Select Collection"}</span>
            {currentCollection && (
              <Badge variant={getRoleBadgeVariant(currentCollection.role || 'viewer')} className="hidden sm:flex gap-1 flex-shrink-0">
                {getRoleIcon(currentCollection.role)}
                {currentCollection.role}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>My Collections</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {collections.map((collection) => {
            const typeConfig = COLLECTION_TYPE_CONFIGS[collection.collection_type];
            return (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => setSelectedCollectionId(collection.id)}
                className="flex items-center justify-between cursor-pointer gap-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {collection.id === selectedCollectionId ? (
                    <Check className="w-4 h-4 flex-shrink-0 text-accent" />
                  ) : (
                    <span className="w-4 flex-shrink-0" />
                  )}
                  <span className="text-base leading-none flex-shrink-0">{typeConfig?.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{collection.name}</span>
                    {isAdmin && (collection.ownerName || collection.ownerEmail) && (
                      <span className="text-xs text-muted-foreground truncate">
                        by {collection.ownerName || collection.ownerEmail}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(collection.role || 'viewer')} className="gap-1 flex-shrink-0">
                  {getRoleIcon(collection.role)}
                  {collection.role}
                </Badge>
              </DropdownMenuItem>
            );
          })}

          {canCreateCollection && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCreateDialog(true)}
                className="cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Collection
              </DropdownMenuItem>
            </>
          )}
          
          {!canCreateCollection && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                You can only create one collection. Ask others to share theirs with you.
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showCreateDialog && (
        <CreateFirstCollectionDialog
          onSuccess={() => {
            setShowCreateDialog(false);
            refetch();
          }}
        />
      )}
    </>
  );
};
