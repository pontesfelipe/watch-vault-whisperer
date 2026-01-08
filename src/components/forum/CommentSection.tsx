import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Reply, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePostComments, PostComment } from "@/hooks/useForumData";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user, isAdmin } = useAuth();
  const { comments, loading, addComment, deleteComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment("");
    }
    setIsSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    const success = await addComment(replyContent, parentId);
    if (success) {
      setReplyContent("");
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  // Build comment tree
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const repliesMap = new Map<string, PostComment[]>();
  comments.forEach(c => {
    if (c.parent_comment_id) {
      const existing = repliesMap.get(c.parent_comment_id) || [];
      repliesMap.set(c.parent_comment_id, [...existing, c]);
    }
  });

  const renderComment = (comment: PostComment, depth = 0) => {
    const authorName = comment.author?.full_name || comment.author?.email?.split('@')[0] || 'Unknown';
    const authorInitials = authorName.slice(0, 2).toUpperCase();
    const isOwner = user?.id === comment.user_id;
    const canDelete = isOwner || isAdmin;
    const replies = repliesMap.get(comment.id) || [];

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-surfaceMuted pl-4' : ''}`}>
        <div className="flex gap-3 py-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-surfaceMuted text-textMuted text-xs">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-textMain">{authorName}</span>
              <span className="text-xs text-textMuted">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-textSoft mt-1 whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-2 mt-2">
              {user && depth < 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-textMuted"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-textMuted hover:text-destructive"
                  onClick={() => deleteComment(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            {replyingTo === comment.id && (
              <div className="flex gap-2 mt-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] text-sm"
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
        {replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-textMuted" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {user && (
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[60px] text-sm"
            rows={2}
          />
          <Button
            size="sm"
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
      {!user && (
        <p className="text-sm text-textMuted text-center py-2">
          Sign in to join the conversation
        </p>
      )}
      <div className="space-y-1">
        {topLevelComments.length === 0 ? (
          <p className="text-sm text-textMuted text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevelComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}
