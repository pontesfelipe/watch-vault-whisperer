import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Reply, Send, Loader2, Pencil, X, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePostComments, PostComment } from "@/hooks/useForumData";
import { VoteButtons } from "./VoteButtons";
import { MentionTextarea } from "./MentionTextarea";
import { MentionText } from "./MentionText";
import { extractMentions, createMentionNotifications } from "@/hooks/useMentions";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user, isAdmin } = useAuth();
  const { comments, loading, addComment, updateComment, deleteComment, voteComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    const commentId = await addComment(newComment);
    if (commentId) {
      const mentions = extractMentions(newComment);
      await createMentionNotifications(mentions, user.id, commentId, postId);
      setNewComment("");
    }
    setIsSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    setIsSubmitting(true);
    const commentId = await addComment(replyContent, parentId);
    if (commentId) {
      const mentions = extractMentions(replyContent);
      await createMentionNotifications(mentions, user.id, commentId, postId);
      setReplyContent("");
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    setIsSubmitting(true);
    const success = await updateComment(commentId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent("");
    }
    setIsSubmitting(false);
  };

  const startEditing = (comment: PostComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setReplyingTo(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
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
    // Use username for display (privacy), fall back to email prefix
    const authorName = comment.author?.username || comment.author?.email?.split('@')[0] || 'Unknown';
    const isOwner = user?.id === comment.user_id;
    const canDelete = isOwner || isAdmin;
    const canEdit = isOwner;
    const replies = repliesMap.get(comment.id) || [];
    const isEditing = editingId === comment.id;

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-surfaceMuted pl-4' : ''}`}>
        <div className="flex gap-2 py-2">
          {/* Vote buttons */}
          <div className="flex-shrink-0">
            <VoteButtons
              score={comment.vote_score}
              userVote={comment.user_vote}
              onUpvote={() => voteComment(comment.id, 1)}
              onDownvote={() => voteComment(comment.id, -1)}
              size="sm"
            />
          </div>
          
          {/* Comment content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <UserAvatar 
                username={comment.author?.username} 
                fullName={comment.author?.full_name}
                size="sm"
              />
              <span className="font-medium text-sm text-textMain">{authorName}</span>
              <span className="text-xs text-textMuted">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {isEditing ? (
              <div className="flex gap-2 mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] text-sm"
                  rows={2}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={isSubmitting || !editContent.trim()}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <MentionText content={comment.content} className="text-sm text-textSoft mt-1" />
            )}
            
            {!isEditing && (
              <div className="flex items-center gap-2 mt-2">
                {user && depth < 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-textMuted"
                    onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setEditingId(null);
                    }}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-textMuted"
                    onClick={() => startEditing(comment)}
                  >
                    <Pencil className="h-3 w-3" />
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
            )}
            
            {replyingTo === comment.id && (
              <div className="flex gap-2 mt-2">
                <MentionTextarea
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write a reply... Use @ to mention users"
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
          <MentionTextarea
            value={newComment}
            onChange={setNewComment}
            placeholder="Write a comment... Use @ to mention users"
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
