import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useForumData() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;

      // Fetch profiles for authors
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch likes counts
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id');
      
      const likesCount = new Map<string, number>();
      likesData?.forEach(l => {
        likesCount.set(l.post_id, (likesCount.get(l.post_id) || 0) + 1);
      });

      // Fetch user's likes if logged in
      let userLikes = new Set<string>();
      if (user) {
        const { data: userLikesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        userLikes = new Set(userLikesData?.map(l => l.post_id) || []);
      }

      // Fetch comments counts
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('post_id');
      
      const commentsCount = new Map<string, number>();
      commentsData?.forEach(c => {
        commentsCount.set(c.post_id, (commentsCount.get(c.post_id) || 0) + 1);
      });

      const enrichedPosts: Post[] = (postsData || []).map(post => ({
        ...post,
        author: profileMap.get(post.user_id),
        likes_count: likesCount.get(post.id) || 0,
        comments_count: commentsCount.get(post.id) || 0,
        user_has_liked: userLikes.has(post.id)
      }));

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPost = async (title: string, content: string, imageFile?: File) => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return false;
    }

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title,
          content,
          image_url: imageUrl
        });

      if (error) throw error;

      toast.success("Post created successfully");
      fetchPosts();
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
      return false;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success("Post deleted");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to like posts");
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_has_liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }

      fetchPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    createPost,
    deletePost,
    toggleLike,
    refetch: fetchPosts
  };
}

export function usePostComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Fetch profiles for authors
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedComments: PostComment[] = (commentsData || []).map(comment => ({
        ...comment,
        author: profileMap.get(comment.user_id)
      }));

      setComments(enrichedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = async (content: string, parentCommentId?: string) => {
    if (!user) {
      toast.error("You must be logged in to comment");
      return false;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId || null
        });

      if (error) throw error;

      toast.success("Comment added");
      fetchComments();
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success("Comment deleted");
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refetch: fetchComments
  };
}
