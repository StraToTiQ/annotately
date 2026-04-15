import { useState } from 'react';
import { commentsService } from '../services/api';
import { Comment } from '../types';

export const CommentThread = ({ comment, allComments, depth = 0 }: { comment: Comment, allComments: Comment[], depth?: number }) => {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const replies = allComments.filter(c => c.parent_id === comment.id);

  const handleReply = async () => {
    if (!replyText) return;
    try {
      await commentsService.replyToComment(comment.id, replyText);
      setReplyText('');
      setShowReply(false);
      // NOTE: In a real app we might trigger a refresh callback here
      window.location.reload(); 
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className={`mt-2 ${depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-2' : ''}`}>
      <div className="bg-gray-50 p-2 rounded">
        <span className="font-bold text-xs text-purple-700">{comment.user?.username || 'User'}</span>
        <p className="text-sm mt-1">{comment.content}</p>
        <button onClick={() => setShowReply(!showReply)} className="text-xs text-blue-500 mt-2 hover:underline">
          Reply
        </button>
        {showReply && (
          <div className="mt-2 flex gap-2">
            <input 
              type="text" 
              className="border text-xs p-1 rounded flex-1" 
              value={replyText} 
              onChange={e => setReplyText(e.target.value)} 
            />
            <button className="bg-blue-500 text-white text-xs px-2 py-1 rounded" onClick={handleReply}>Send</button>
          </div>
        )}
      </div>
      {replies.map(reply => (
         <CommentThread key={reply.id} comment={reply} allComments={allComments} depth={depth + 1} />
      ))}
    </div>
  );
}
