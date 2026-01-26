import { useState, useEffect } from "react";
import { NewAppLayout } from "@/components/NewAppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Watch,
  Heart,
  List,
  Plus,
  Settings,
  UserPlus,
  UserCheck,
  Camera,
  Grid3X3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { UserAvatarById } from "@/components/UserAvatarById";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileData {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface WatchItem {
  id: string;
  brand: string;
  model: string;
  dialColor: string;
  imageUrl: string | null;
  isFavorite?: boolean;
}

interface UserList {
  id: string;
  name: string;
  itemCount: number;
  isSystem: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const isOwnProfile = !userId || userId === user?.id;
  const profileId = userId || user?.id;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [watches, setWatches] = useState<WatchItem[]>([]);
  const [wishlist, setWishlist] = useState<WatchItem[]>([]);
  const [lists, setLists] = useState<UserList[]>([]);
  const [recentWears, setRecentWears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (profileId) {
      fetchProfileData();
    }
  }, [profileId]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      // Fetch follower counts
      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileId);

      const { count: followingCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileId);

      // Check if current user follows this profile
      let isFollowing = false;
      if (!isOwnProfile && user) {
        const { data: followData } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profileId)
          .single();
        isFollowing = !!followData;
      }

      setProfile({
        id: profileId!,
        username: profileData?.username,
        fullName: profileData?.full_name,
        avatarUrl: profileData?.avatar_url,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        isFollowing,
      });

      // Fetch watches (collection)
      const watchQuery = supabase
        .from("watches")
        .select("id, brand, model, dial_color, ai_image_url")
        .eq("status", "In Collection")
        .order("sort_order");

      if (isOwnProfile) {
        watchQuery.eq("user_id", profileId);
      } else {
        watchQuery.eq("user_id", profileId).eq("is_shared", true);
      }

      const { data: watchData } = await watchQuery;
      if (watchData) {
        setWatches(
          watchData.map((w) => ({
            id: w.id,
            brand: w.brand,
            model: w.model,
            dialColor: w.dial_color,
            imageUrl: w.ai_image_url,
          }))
        );
      }

      // Fetch wishlist (only for own profile)
      if (isOwnProfile) {
        const { data: wishlistData } = await supabase
          .from("wishlist")
          .select("id, brand, model, dial_colors")
          .eq("user_id", profileId)
          .order("rank");

        if (wishlistData) {
          setWishlist(
            wishlistData.map((w) => ({
              id: w.id,
              brand: w.brand,
              model: w.model,
              dialColor: w.dial_colors,
              imageUrl: null,
            }))
          );
        }

        // Fetch lists
        const { data: listsData } = await supabase
          .from("user_lists")
          .select(`
            id,
            name,
            is_system,
            list_items (id)
          `)
          .eq("user_id", profileId);

        if (listsData) {
          setLists(
            listsData.map((l: any) => ({
              id: l.id,
              name: l.name,
              itemCount: l.list_items?.length || 0,
              isSystem: l.is_system,
            }))
          );
        }
      }

      // Fetch recent wears
      const { data: wearData } = await supabase
        .from("wear_entries")
        .select(`
          id,
          wear_date,
          watches (id, brand, model, ai_image_url)
        `)
        .eq("user_id", profileId)
        .order("wear_date", { ascending: false })
        .limit(5);

      if (wearData) {
        setRecentWears(wearData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (profile.isFollowing) {
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        setProfile((prev) =>
          prev
            ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 }
            : null
        );
        toast.success("Unfollowed");
      } else {
        await supabase.from("followers").insert({
          follower_id: user.id,
          following_id: profile.id,
        });
        setProfile((prev) =>
          prev
            ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 }
            : null
        );
        toast.success("Following!");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      await supabase.from("user_lists").insert({
        user_id: user?.id,
        name: newListName,
      });
      toast.success("List created!");
      setNewListName("");
      setShowCreateList(false);
      fetchProfileData();
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
    }
  };

  if (isLoading) {
    return (
      <NewAppLayout>
        <div className="p-4 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </NewAppLayout>
    );
  }

  return (
    <NewAppLayout showSearch={false}>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <UserAvatarById userId={profileId!} size="lg" className="h-24 w-24" />
          <h1 className="text-xl font-bold mt-4">
            {profile?.username || profile?.fullName || "Collector"}
          </h1>

          {/* Stats */}
          <div className="flex gap-8 mt-4">
            <button className="text-center">
              <p className="text-xl font-bold">{profile?.followersCount}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </button>
            <button className="text-center">
              <p className="text-xl font-bold">{profile?.followingCount}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </button>
            <div className="text-center">
              <p className="text-xl font-bold">{watches.length}</p>
              <p className="text-sm text-muted-foreground">Watches</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {isOwnProfile ? (
              <Button variant="outline" onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={profile?.isFollowing ? "outline" : "default"}
                onClick={handleFollow}
              >
                {profile?.isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Recent Wears */}
        {recentWears.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              What I'm Wearing
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {recentWears.map((wear: any) => (
                <motion.div
                  key={wear.id}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 w-20"
                  onClick={() => navigate(`/watch/${wear.watches.id}`)}
                >
                  <AspectRatio ratio={1}>
                    {wear.watches.ai_image_url ? (
                      <img
                        src={wear.watches.ai_image_url}
                        alt={`${wear.watches.brand} ${wear.watches.model}`}
                        className="object-cover w-full h-full rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
                        <Watch className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </AspectRatio>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Tabs for Collection, Wishlist, Lists */}
        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collection" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Collection
            </TabsTrigger>
            {isOwnProfile && (
              <>
                <TabsTrigger value="wishlist" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Wishlist
                </TabsTrigger>
                <TabsTrigger value="lists" className="gap-2">
                  <List className="h-4 w-4" />
                  Lists
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Collection Grid */}
          <TabsContent value="collection" className="mt-4">
            {watches.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {watches.map((watch, index) => (
                  <motion.div
                    key={watch.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/watch/${watch.id}`)}
                    className="cursor-pointer"
                  >
                    <AspectRatio ratio={1}>
                      {watch.imageUrl ? (
                        <img
                          src={watch.imageUrl}
                          alt={`${watch.brand} ${watch.model}`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Watch className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </AspectRatio>
                  </motion.div>
                ))}
                {isOwnProfile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate("/log")}
                    className="cursor-pointer"
                  >
                    <AspectRatio ratio={1}>
                      <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add</span>
                      </div>
                    </AspectRatio>
                  </motion.div>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Watch className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "Your collection is empty"
                    : "No shared watches"}
                </p>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/log")}
                  >
                    Add Your First Watch
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Wishlist */}
          {isOwnProfile && (
            <TabsContent value="wishlist" className="mt-4">
              {wishlist.length > 0 ? (
                <div className="space-y-3">
                  {wishlist.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Watch className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.brand}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.model}
                          </p>
                        </div>
                        <Badge variant="outline">{item.dialColor}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Your wishlist is empty</p>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Lists */}
          {isOwnProfile && (
            <TabsContent value="lists" className="mt-4">
              <div className="space-y-3">
                {lists.map((list) => (
                  <Card
                    key={list.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{list.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {list.itemCount} watches
                        </p>
                      </div>
                      {list.isSystem && (
                        <Badge variant="secondary">System</Badge>
                      )}
                    </div>
                  </Card>
                ))}

                {/* Create New List */}
                <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Create New List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New List</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="List name (e.g., Dive Watches)"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                    />
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCreateList(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleCreateList}
                        disabled={!newListName.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </NewAppLayout>
  );
}
