import { useState } from "react";
import { useForumData, FORUM_CATEGORIES } from "@/hooks/useForumData";
import { useAuth } from "@/contexts/AuthContext";
import { CreatePostDialog } from "@/components/forum/CreatePostDialog";
import { PostCard } from "@/components/forum/PostCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Search } from "lucide-react";

export default function Forum() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { posts, loading, createPost, updatePost, deletePost, votePost } = useForumData({
    searchQuery,
    category: selectedCategory
  });

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {FORUM_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-textMuted" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-textMuted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textMain mb-2">
            {searchQuery || selectedCategory !== 'all' ? "No posts found" : "No posts yet"}
          </h3>
          <p className="text-textMuted">
            {searchQuery || selectedCategory !== 'all' 
              ? "Try adjusting your search or filter" 
              : user 
                ? "Be the first to start a conversation!" 
                : "Sign in to create the first post"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onVote={votePost}
              onDelete={deletePost}
              onEdit={updatePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
