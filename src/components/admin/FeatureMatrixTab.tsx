import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useFeatureToggles } from "@/hooks/useFeatureToggles";
import { CollectionType, COLLECTION_CONFIGS } from "@/types/collection";
import { Watch, Footprints, ShoppingBag, Loader2 } from "lucide-react";

const collectionIcons: Record<CollectionType, React.ReactNode> = {
  watches: <Watch className="h-4 w-4" />,
  sneakers: <Footprints className="h-4 w-4" />,
  purses: <ShoppingBag className="h-4 w-4" />,
};

export const FeatureMatrixTab = () => {
  const { toggles, loading, updateToggle, getFeatureMatrix, getToggleId } = useFeatureToggles();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const matrix = getFeatureMatrix();
  const featureKeys = Object.keys(matrix);
  const collectionTypes: CollectionType[] = ['watches', 'sneakers', 'purses'];

  const handleToggle = async (collectionType: CollectionType, featureKey: string, currentValue: boolean) => {
    const toggleId = getToggleId(collectionType, featureKey);
    if (toggleId) {
      await updateToggle(toggleId, !currentValue);
    }
  };

  // Group features by category
  const groupedFeatures: Record<string, string[]> = {
    'Core Features': ['wear_tracking', 'ai_analysis', 'price_tracking', 'depreciation', 'trade_matching'],
    'Type-Specific': ['water_tracking', 'movement_specs', 'warranty_tracking', 'condition_grading', 'box_status', 'og_all_tracking', 'collaboration_tracking', 'authenticity_tracking', 'size_breakdown', 'material_tracking'],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Matrix</CardTitle>
        <CardDescription>
          Configure which features are available for each collection type. 
          Toggle features on or off to customize the experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {Object.entries(groupedFeatures).map(([groupName, groupFeatureKeys]) => {
            const relevantFeatures = featureKeys.filter(key => groupFeatureKeys.includes(key));
            if (relevantFeatures.length === 0) return null;

            return (
              <div key={groupName}>
                <h3 className="text-lg font-semibold mb-4">{groupName}</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Feature</TableHead>
                        {collectionTypes.map((type) => (
                          <TableHead key={type} className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {collectionIcons[type]}
                              <span>{COLLECTION_CONFIGS[type].label}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relevantFeatures.map((featureKey) => {
                        const feature = matrix[featureKey];
                        if (!feature) return null;

                        return (
                          <TableRow key={featureKey}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {feature.name}
                                <Badge variant="outline" className="text-xs">
                                  {featureKey}
                                </Badge>
                              </div>
                            </TableCell>
                            {collectionTypes.map((type) => {
                              const toggleId = getToggleId(type, featureKey);
                              const isAvailable = toggleId !== null;
                              const isEnabled = feature[type];

                              return (
                                <TableCell key={type} className="text-center">
                                  {isAvailable ? (
                                    <div className="flex items-center justify-center">
                                      <Switch
                                        checked={isEnabled}
                                        onCheckedChange={() => handleToggle(type, featureKey, isEnabled)}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Legend</h4>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Switch checked disabled className="scale-75" />
              <span>Feature enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={false} disabled className="scale-75" />
              <span>Feature disabled</span>
            </div>
            <div className="flex items-center gap-2">
              <span>—</span>
              <span>Not applicable to this collection type</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
