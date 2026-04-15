import { useState } from 'react';
import { annotationsService } from '../services/api';

export const CreateAnnotation = ({ 
  selectionText, 
  oncreated 
}: { 
  selectionText: string, 
  oncreated: () => void 
}) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment) return;
    setLoading(true);
    try {
      await annotationsService.createAnnotation({
        url: window.location.href,
        text_selector: 'dummy-selector', // Should be generated based on Range
        selected_text: selectionText,
        initial_comment: comment
      });
      setComment('');
      oncreated();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="font-bold text-sm mb-2">Create New Annotation</h3>
      <div className="bg-purple-100 p-2 text-xs italic rounded mb-2 border-l-2 border-purple-500">
        &quot;{selectionText}&quot;
      </div>
      <textarea
        className="w-full text-sm border p-2 rounded mb-2"
        rows={3}
        placeholder="Type your comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button 
        onClick={handleSubmit}
        disabled={loading || !comment}
        className="w-full bg-purple-600 text-white font-bold py-2 rounded text-sm disabled:opacity-50"
      >
        Save Annotation
      </button>
    </div>
  );
};
