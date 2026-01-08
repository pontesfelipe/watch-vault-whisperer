import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Post } from "@/hooks/useForumData";
import { CommentSection } from "./CommentSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

export function PostCard({ post, onLike, onDelete }: PostCardProps) {
  const { user, isAdmin } = useAuth();
  const [showComments, setShowComments] = useState(false);
  
  const authorName = post.author?.full_name || post.author?.email?.split('@')[0] || 'Unknown';
  const authorInitials = authorName.slice(0, 2).toUpperCase();
  const isOwner = user?.id === post.user_id;
  const canDelete = isOwner || isAdmin;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="bg-accentSubtle text-accent text-sm">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-textMain">{authorName}</p>
              <p className="text-xs text-textMuted">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-textMuted hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the post and all its comments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(post.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <h3 className="font-semibold text-lg text-textMain mb-2">{post.title}</h3>
        {post.content && (
          <p className="text-textSoft whitespace-pre-wrap">{post.content}</p>
        )}
        {post.image_url && (
          <div className="mt-3">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full max-h-96 object-cover rounded-lg"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-0">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${post.user_has_liked ? 'text-red-500' : 'text-textMuted'}`}
            onClick={() => onLike(post.id)}
          >
            <Heart className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
            {post.likes_count}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-textMuted"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            {post.comments_count}
            {showComments ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {showComments && (
          <div className="w-full border-t pt-3">
            <CommentSection postId={post.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
