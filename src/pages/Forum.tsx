import { useForumData } from "@/hooks/useForumData";
import { useAuth } from "@/contexts/AuthContext";
import { CreatePostDialog } from "@/components/forum/CreatePostDialog";
import { PostCard } from "@/components/forum/PostCard";
import { Loader2, MessageSquare } from "lucide-react";

export default function Forum() {
  const { user } = useAuth();
  const { posts, loading, createPost, deletePost, toggleLike } = useForumData();

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Forum
          </h1>
          <p className="text-textMuted mt-1">
            Share posts, conversations, and discussions with the community
          </p>
        </div>
        {user && <CreatePostDialog onSubmit={createPost} />}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-textMuted" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-textMuted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textMain mb-2">No posts yet</h3>
          <p className="text-textMuted">
            {user ? "Be the first to start a conversation!" : "Sign in to create the first post"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={toggleLike}
              onDelete={deletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
