import { useState, useEffect } from "react";
import { NewAppLayout } from "@/components/NewAppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Watch,
  Camera,
  HelpCircle,
  X,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
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

interface Post {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  content: string | null;
  imageUrl: string | null;
  postType: string;
  watchBrand?: string;
  watchModel?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<"text" | "question" | "wrist_check">("text");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (user) {
      fetchPosts();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      // Fetch posts from followed users and self
      const { data: following } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user?.id);

      const followedIds = following?.map((f) => f.following_id) || [];
      const allIds = [user?.id, ...followedIds];

      const { data: postsData } = await supabase
        .from("user_posts")
        .select(`
          id,
          user_id,
          content,
          image_url,
          post_type,
          created_at,
          watches (brand, model)
        `)
        .in("user_id", allIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsData) {
        // Get profiles for users
        const userIds = [...new Set(postsData.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        // Get likes and comments counts
        const postIds = postsData.map((p) => p.id);
        
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id, user_id")
          .in("post_id", postIds);

        const { data: commentCounts } = await supabase
          .from("user_post_comments")
          .select("post_id")
          .in("post_id", postIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
        const likesByPost = new Map<string, { count: number; userLiked: boolean }>();
        likes?.forEach((l) => {
          const existing = likesByPost.get(l.post_id) || { count: 0, userLiked: false };
          existing.count++;
          if (l.user_id === user?.id) existing.userLiked = true;
          likesByPost.set(l.post_id, existing);
        });

        const commentsByPost = new Map<string, number>();
        commentCounts?.forEach((c) => {
          commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) || 0) + 1);
        });

        setPosts(
          postsData.map((p: any) => {
            const profile = profileMap.get(p.user_id);
            const likeData = likesByPost.get(p.id) || { count: 0, userLiked: false };
            return {
              id: p.id,
              userId: p.user_id,
              username: profile?.username || "User",
              avatarUrl: profile?.avatar_url,
              content: p.content,
              imageUrl: p.image_url,
              postType: p.post_type,
              watchBrand: p.watches?.brand,
              watchModel: p.watches?.model,
              createdAt: p.created_at,
              likesCount: likeData.count,
              commentsCount: commentsByPost.get(p.id) || 0,
              isLiked: likeData.userLiked,
            };
          })
        );
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel("feed-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_posts" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_posts").insert({
        user_id: user?.id,
        content: newPostContent,
        post_type: newPostType,
      });

      if (error) throw error;

      toast.success("Post created!");
      setNewPostContent("");
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user?.id);
      } else {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user?.id,
        });
      }
      
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !isLiked, likesCount: p.likesCount + (isLiked ? -1 : 1) }
            : p
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase
      .from("user_post_comments")
      .select(`
        id,
        user_id,
        content,
        created_at
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      setComments(
        data.map((c) => ({
          id: c.id,
          userId: c.user_id,
          username: profileMap.get(c.user_id)?.username || "User",
          content: c.content,
          createdAt: c.created_at,
        }))
      );
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      await supabase.from("user_post_comments").insert({
        post_id: selectedPost.id,
        user_id: user?.id,
        content: newComment,
      });
      setNewComment("");
      fetchComments(selectedPost.id);
      fetchPosts();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "wrist_check":
        return <Watch className="h-4 w-4" />;
      case "question":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <NewAppLayout>
      <div className="p-4 space-y-4">
        {/* Create Post Button */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl justify-start gap-3 text-muted-foreground"
          onClick={() => setShowCreatePost(true)}
        >
          <Plus className="h-5 w-5" />
          Share what you're wearing...
        </Button>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreatePost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Create Post</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreatePost(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Post Type Selection */}
                <div className="flex gap-2 mb-4">
                  {[
                    { value: "text", label: "Post", icon: null },
                    { value: "wrist_check", label: "Wrist Check", icon: Watch },
                    { value: "question", label: "Question", icon: HelpCircle },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={newPostType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewPostType(type.value as any)}
                      className="gap-2"
                    >
                      {type.icon && <type.icon className="h-4 w-4" />}
                      {type.label}
                    </Button>
                  ))}
                </div>

                <Textarea
                  placeholder={
                    newPostType === "question"
                      ? "Ask the community..."
                      : newPostType === "wrist_check"
                      ? "What are you wearing today?"
                      : "Share your thoughts..."
                  }
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-32 resize-none"
                />

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!newPostContent.trim() || isSubmitting}
                    onClick={handleCreatePost}
                  >
                    {isSubmitting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <UserAvatarById userId={post.userId} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {post.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {getPostTypeIcon(post.postType) && (
                        <Badge variant="outline" className="gap-1">
                          {getPostTypeIcon(post.postType)}
                          {post.postType === "wrist_check" ? "Wrist Check" : "Question"}
                        </Badge>
                      )}
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <p className="text-foreground mb-3">{post.content}</p>
                    )}

                    {/* Post Image */}
                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden mb-3">
                        <AspectRatio ratio={4 / 3}>
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            className="object-cover w-full h-full"
                          />
                        </AspectRatio>
                      </div>
                    )}

                    {/* Watch Info */}
                    {post.watchBrand && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
                        <Watch className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {post.watchBrand} {post.watchModel}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 ${post.isLiked ? "text-red-500" : ""}`}
                        onClick={() => handleLike(post.id, post.isLiked)}
                      >
                        <Heart
                          className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`}
                        />
                        {post.likesCount > 0 && post.likesCount}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setSelectedPost(post);
                          fetchComments(post.id);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {post.commentsCount > 0 && post.commentsCount}
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 ml-auto">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No posts yet. Follow some collectors or be the first to post!
            </p>
            <Button onClick={() => setShowCreatePost(true)}>Create First Post</Button>
          </Card>
        )}

        {/* Comments Dialog */}
        <Dialog
          open={!!selectedPost}
          onOpenChange={() => setSelectedPost(null)}
        >
          <DialogContent className="max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Comments</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <UserAvatarById userId={comment.userId} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{comment.username}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first!
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </NewAppLayout>
  );
}
