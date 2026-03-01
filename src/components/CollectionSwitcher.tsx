import { Plus, Check, Crown, Edit3, Eye } from "lucide-react";
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
import { useState } from "react";
import { CreateCollectionTypeDialog } from "./CreateCollectionTypeDialog";
import { ItemTypeIcon } from "./ItemTypeIcon";
import { getCollectionConfig } from "@/types/collection";

export const CollectionSwitcher = () => {
  const { selectedCollectionId, setSelectedCollectionId, currentCollection, currentCollectionType } = useCollection();
  const { collections, refetch } = useCollectionData();
  const { isAdmin } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  // Count collections the user owns (created)
  const ownedCollections = collections.filter(c => c.role === 'owner');
  const canCreateCollection = isAdmin || ownedCollections.length === 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <ItemTypeIcon type={currentCollectionType} size="sm" />
            {currentCollection?.name || "Select Collection"}
            {currentCollection && (
              <Badge variant={getRoleBadgeVariant(currentCollection.role || 'viewer')} className="gap-1">
                {getRoleIcon(currentCollection.role)}
                {currentCollection.role}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-screen sm:w-72 max-w-[calc(100vw-2rem)]">
          <DropdownMenuLabel>My Collections</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {collections.map((collection) => {
            const config = getCollectionConfig(collection.collection_type);
            return (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => setSelectedCollectionId(collection.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {collection.id === selectedCollectionId && <Check className="w-4 h-4 flex-shrink-0" />}
                  <ItemTypeIcon type={collection.collection_type} size="sm" className="flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{collection.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {config.label}
                      {isAdmin && (collection.ownerName || collection.ownerEmail) && (
                        <> • by {collection.ownerName || collection.ownerEmail}</>
                      )}
                    </span>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(collection.role || 'viewer')} className="gap-1 flex-shrink-0 ml-2">
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
        <CreateCollectionTypeDialog
          onSuccess={() => {
            setShowCreateDialog(false);
            refetch();
          }}
        />
      )}
    </>
  );
};
