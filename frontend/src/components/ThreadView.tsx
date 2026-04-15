import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Send, Edit2, Trash2, X, Check, ChevronLeft, Plus } from 'lucide-react';
import { commentsService, annotationsService } from '../services/api';
import { User, Comment, APIAnnotation } from '../types';
import { timeAgo } from '../lib/utils';


export const ThreadView = ({ 
  annotation, 
  currentUser,
  onRefresh,
  onClose
}: { 
  annotation: Partial<APIAnnotation>, 
  currentUser: User | null,
  onRefresh: (newId?: number) => void,
  onClose: () => void 
}) => {
  const rootCommentId = annotation?.comments?.length ? annotation.comments[0].id : null;
  const [focusedCommentId, setFocusedCommentId] = useState<number | null>(null);

  
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // If new comments come in, the current focus might be deleted, so check validity
  // Handle derived state: if focused comment no longer exists (e.g. deleted), reset focus
  if (focusedCommentId && !annotation.comments?.some((c: Comment) => c.id === focusedCommentId)) {
    setFocusedCommentId(null);
  }


  const currentComment = annotation.comments?.find((c: Comment) => c.id === focusedCommentId);
  // Sort children by date (oldest first or newest first)
  const childrenComments = annotation.comments?.filter((c: Comment) => 
    focusedCommentId ? c.parent_id === focusedCommentId : c.parent_id === null
  );


  const handleBack = () => {
     if (focusedCommentId && currentComment && currentComment.parent_id) {
         setFocusedCommentId(currentComment.parent_id);
         setIsReplying(false);
     } else if (focusedCommentId) {
         setFocusedCommentId(null);
         setIsReplying(false);
     } else {
         onClose();
     }
  };


  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      if (!annotation.id) {
        // Create mode
        const newAnn = await annotationsService.createAnnotation({
          url: window.location.href,
          text_selector: "custom-selector",
          selected_text: annotation.selected_text || "",
          initial_comment: replyText
        });
        setReplyText('');
        setIsReplying(false);
        onRefresh(newAnn.id);
      } else {
        // We have an annotation ID.
        if (focusedCommentId) {
          // Replying to a specific comment
          await commentsService.replyToComment(focusedCommentId, replyText);
        } else {
          // Adding a root comment directly to the annotation
          await commentsService.addCommentToAnnotation(annotation.id, replyText);
        }
        
        setReplyText('');
        setIsReplying(false);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentsService.deleteComment(commentId);
      setMenuOpenId(null);
      if (commentId === rootCommentId) {
        onClose(); // Close whole thread if root deleted
      } else if (commentId === focusedCommentId) {
        handleBack(); // Go back if we're focused on the deleted one
      }
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to delete comment');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setMenuOpenId(null);
  };

  const saveEdit = async (commentId: number) => {
    try {
      await commentsService.updateComment(commentId, editContent);
      setEditingCommentId(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to update comment');
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 pb-10"
    >
      {/* 1. Annotation Section */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
        <div className="relative pl-3 border-l-2 border-[#FACC15]/30">
          <p className="text-xs text-zinc-400 italic leading-relaxed">
            &quot;{annotation.selected_text}&quot;
          </p>
        </div>
      </div>

      {/* 2. Parent Comment Section (If viewing a specific thread) */}
      {currentComment && (
        <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 relative ring-1 ring-[#FACC15]/20 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-sm font-bold text-[#FACC15]">
                {currentComment.user?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-semibold text-zinc-200 block leading-none">{currentComment.user?.username}</span>
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                   {timeAgo(currentComment.created_at)}
                </span>
              </div>
            </div>
            
            {currentUser && currentUser.id === currentComment.user_id && (
              <div className="relative">
                <button 
                  onClick={() => setMenuOpenId(menuOpenId === currentComment.id ? null : currentComment.id)}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpenId === currentComment.id && (
                  <div className="absolute right-0 mt-1 w-28 bg-[#1a1a1a] border border-zinc-700 rounded shadow-xl overflow-hidden z-20">
                    <button onClick={() => startEdit(currentComment)} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(currentComment.id)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 flex items-center gap-2">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {editingCommentId === currentComment.id ? (
            <div className="mt-2 space-y-2">
              <textarea
                className="w-full bg-zinc-950 border border-[#FACC15]/50 rounded p-2 text-sm text-zinc-200 outline-none resize-none"
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setEditingCommentId(null)} className="p-1 text-zinc-400 hover:text-zinc-200">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => saveEdit(currentComment.id)} className="p-1 text-green-400 hover:text-green-300">
                    <Check className="w-4 h-4" />
                  </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {currentComment.content}
            </p>
          )}
        </div>
      )}

      {/* 3. Action Bar (< Back, + Add) */}
      <div className="flex items-center justify-between px-1">
         <button 
           onClick={handleBack}
           className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 uppercase tracking-widest font-semibold transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
         >
           <ChevronLeft className="w-4 h-4" />
           Back
         </button>

         <button 
           onClick={() => setIsReplying(!isReplying)}
           className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isReplying ? 'bg-zinc-800 text-zinc-400 transform rotate-45' : 'bg-[#FACC15] text-black hover:scale-110 shadow-lg'}`}
         >
           <Plus className="w-5 h-5" />
         </button>
      </div>

      {/* 4. Text Entry Field (Appears when + is clicked) */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2 relative mt-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-transparent text-sm focus:outline-none text-zinc-200 resize-none"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <div className="flex justify-end border-t border-zinc-800/50 pt-2">
                <button
                  onClick={handleReply}
                  disabled={submitting || !replyText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[#FACC15] text-black text-xs font-bold disabled:opacity-50 hover:bg-[#EAB308] transition-colors flex items-center gap-2"
                >
                  <Send className="w-3 h-3" /> Reply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. List of Child Comments */}
      {childrenComments && childrenComments.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-2">Replies</h4>
          {childrenComments.map((comment: Comment) => (
            <div 
              key={comment.id}
              onClick={() => {
                setFocusedCommentId(comment.id);
                setIsReplying(false);
              }}
              className="bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#121212] border border-zinc-700 text-[10px] font-bold text-zinc-400">
                    {comment.user?.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-zinc-300">{comment.user?.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono">
                     {timeAgo(comment.created_at)}
                  </span>
                  {currentUser && currentUser.id === comment.user_id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEdit(comment); }}
                        className="p-1 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(comment.id); }}
                        className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <div className="mt-1 mb-2 space-y-2 pl-7" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    className="w-full bg-zinc-950 border border-[#FACC15]/50 rounded p-2 text-sm text-zinc-200 outline-none resize-none"
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setEditingCommentId(null)} className="p-1 text-zinc-400 hover:text-zinc-200">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => saveEdit(comment.id)} className="p-1 text-green-400 hover:text-green-300">
                        <Check className="w-4 h-4" />
                      </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 pl-7">
                  {comment.content}
                </p>
              )}
              
              {/* Optional: Show reply count if this comment has further children.
                  Since we only have flat structure, we can compute it on the fly */}
              {(annotation.comments?.filter((c: Comment) => c.parent_id === comment.id)?.length || 0) > 0 && (
                <div className="pl-7 mt-2">
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                    {annotation.comments?.filter((c: Comment) => c.parent_id === comment.id)?.length} replies
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
