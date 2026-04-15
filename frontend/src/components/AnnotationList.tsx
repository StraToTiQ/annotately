import { useEffect, useState, useCallback } from 'react';
import { annotationsService } from '../services/api';
import { CommentThread } from './CommentThread';
import { APIAnnotation, Comment } from '../types';

export const AnnotationList = () => {
  const [annotations, setAnnotations] = useState<APIAnnotation[]>([]);

  const highlightInDOM = (text: string) => {
    if (!text || text.trim() === '') return;
    const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodesToReplace: {node: Text, matchIndex: number}[] = [];
    
    let currentNode = treeWalker.nextNode();
    while(currentNode) {
        if (currentNode.nodeValue && currentNode.nodeValue.includes(text)) {
            // Ignore if we are inside our own extension
            if (currentNode.parentElement && currentNode.parentElement.closest('#anotationblog-extension-root')) {
                currentNode = treeWalker.nextNode();
                continue;
            }
            nodesToReplace.push({ node: currentNode as Text, matchIndex: currentNode.nodeValue.indexOf(text) });
        }
        currentNode = treeWalker.nextNode();
    }
    
    nodesToReplace.forEach(({node}) => {
        const span = document.createElement('span');
        span.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
        span.style.borderBottom = '2px solid purple';
        span.style.borderRadius = '2px';
        span.className = 'anotationblog-highlight';
        
        const parent = node.parentNode;
        if (!parent) return;
        
        const nodeText = node.nodeValue || '';
        const matchIndex = nodeText.indexOf(text);
        if (matchIndex === -1) return;
        
        const before = document.createTextNode(nodeText.substring(0, matchIndex));
        const highlighted = document.createTextNode(text);
        const after = document.createTextNode(nodeText.substring(matchIndex + text.length));
        
        span.appendChild(highlighted);
        
        parent.insertBefore(before, node);
        parent.insertBefore(span, node);
        parent.insertBefore(after, node);
        parent.removeChild(node);
    });
  };

  const fetchAnnotations = useCallback(async () => {
    try {
      const data = await annotationsService.getAnnotations(window.location.href);
      setAnnotations(data);
      
      // Highlight all returned annotation snippets
      data.forEach((ann: APIAnnotation) => {
        if (ann.selected_text) {
          highlightInDOM(ann.selected_text);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }, []);


  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  return (
    <div className="mt-4">
      <h3 className="font-bold text-sm mb-2 border-b pb-2">Annotations on this page</h3>
      {annotations.length === 0 && <p className="text-xs text-gray-400">No annotations found. Highlight some text to add one!</p>}
      
      {annotations.map(ann => {
        // Find top-level comments for this annotation
        const rootComments = ann.comments.filter((c: Comment) => !c.parent_id);
        
        return (
          <div key={ann.id} className="mb-4 bg-white border border-gray-200 rounded p-2 shadow-sm">
            <div className="text-xs italic bg-yellow-100 p-1 mb-2">&quot;...{ann.selected_text}...&quot;</div>
            
            {rootComments.map((comment: Comment) => (
              <CommentThread key={comment.id} comment={comment} allComments={ann.comments} />
            ))}
          </div>
        );
      })}
    </div>
  );
};
