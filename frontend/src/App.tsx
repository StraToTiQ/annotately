import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  StickyNote,
  Clock,
  MessageSquare,
  GripHorizontal
} from 'lucide-react';
import { authService, annotationsService } from './services/api';
import { Login } from './components/Login';
import { ThreadView } from './components/ThreadView';
import { APIAnnotation, User } from './types';
import { timeAgo } from './lib/utils';


const highlightInDOM = (ann: APIAnnotation) => {
  const text = ann.selected_text;
  if (!text || text.trim() === '') return;
  
  // Quick check if already highlighted to prevent duplication on refresh
  if (document.querySelector(`span[data-annotation-id="${ann.id}"]`)) return;

  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const nodesToReplace: {node: Text, matchIndex: number}[] = [];
  
  let currentNode = treeWalker.nextNode();
  while(currentNode) {
      if (currentNode.nodeValue && currentNode.nodeValue.includes(text)) {
          if (currentNode.parentElement && currentNode.parentElement.closest('#anotationblog-extension-root')) {
              currentNode = treeWalker.nextNode();
              continue;
          }
          // Ignore already highlighted spans
          if (currentNode.parentElement && currentNode.parentElement.hasAttribute('data-annotation-id')) {
              currentNode = treeWalker.nextNode();
              continue;
          }
          nodesToReplace.push({ node: currentNode as Text, matchIndex: currentNode.nodeValue.indexOf(text) });
      }
      currentNode = treeWalker.nextNode();
  }
  
  nodesToReplace.forEach(({node}) => {
      const span = document.createElement('span');
      span.style.backgroundColor = 'rgba(250, 204, 21, 0.4)';
      span.style.borderBottom = '2px solid #FACC15';
      span.style.borderRadius = '2px';
      span.style.cursor = 'pointer';
      span.className = 'anotationblog-highlight hover:bg-yellow-400/60 transition-colors';
      span.dataset.annotationId = ann.id.toString();
      
      span.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('anotationblog-open-thread', { detail: { id: ann.id } }));
      };

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

export default function App({ initialSelection = '' }: { initialSelection?: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [view, setView] = useState<'list' | 'create' | 'thread'>('list');
  const [activeAnnotationId, setActiveAnnotationId] = useState<number | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [annotations, setAnnotations] = useState<APIAnnotation[]>([]);
  const [newText, setNewText] = useState(initialSelection);

  const fetchAnnotations = useCallback(async () => {
    try {
      const data: APIAnnotation[] = await annotationsService.getAnnotations(window.location.href);
      setAnnotations(data);

      data.forEach((ann: APIAnnotation) => {
        if (ann.selected_text) {
          highlightInDOM(ann);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const checkAuthAndFetch = useCallback(async () => {
    const isAuth = await authService.isAuthenticated();
    setIsAuthenticated(isAuth);
    if (isAuth) {
      try {
        const user = await authService.me();
        setCurrentUser(user);
        fetchAnnotations();
      } catch (e) {
        console.error("Failed to fetch user. Token might be invalid.", e);
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }
  }, [fetchAnnotations]);

  useEffect(() => {
    checkAuthAndFetch();

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setNewText(selection.toString().trim());
        setActiveAnnotationId(null);
        setView('thread');
      }
    };
    
    const handleOpenThread = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const annId = parseInt(detail.id, 10);
      setActiveAnnotationId(annId);
      setNewText('');
      setView('thread');
    };

    const handleResetView = () => {
      setView('list');
      setActiveAnnotationId(null);
      setNewText('');
    };

    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('anotationblog-open-thread', handleOpenThread);
    window.addEventListener('anotationblog-reset-view', handleResetView);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('anotationblog-open-thread', handleOpenThread);
      window.removeEventListener('anotationblog-reset-view', handleResetView);
    };
  }, [checkAuthAndFetch]);

  const filteredAnnotations = useMemo(() => {
    return annotations.filter(a => {
      const commentText = a.comments && a.comments.length > 0 ? a.comments[0].content : '';
      return commentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (a.selected_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [annotations, searchQuery]);

  const activeAnnotationData = useMemo(() => {
    return annotations.find(a => a.id === activeAnnotationId);
  }, [annotations, activeAnnotationId]);

  const openThreadAndScroll = (id: number) => {
    const el = document.querySelector(`span[data-annotation-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setActiveAnnotationId(id);
    setNewText('');
    setView('thread');
  };

  return (
    <div className="w-[380px] h-[600px] bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative font-sans text-zinc-100">
      
      <header className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#121212]/80 backdrop-blur-md sticky top-0 z-10 w-full box-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FACC15] rounded-lg flex items-center justify-center shrink-0">
            <StickyNote className="w-5 h-5 text-black" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-zinc-100">
            Annotately
          </h1>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <button
              onMouseDown={(e) => {
                window.dispatchEvent(new CustomEvent('anotationblog-start-drag', {
                  detail: { clientX: e.clientX, clientY: e.clientY }
                }));
              }}
              className="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to dock"
            >
              <GripHorizontal className="w-5 h-5" />
            </button>
            <button 
              onClick={async () => { await authService.logout(); setIsAuthenticated(false); setCurrentUser(null); }}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-md font-medium transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
        {!isAuthenticated ? (
          <Login onLoginSuccess={checkAuthAndFetch} />
        ) : (
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#FACC15] transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search annotations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FACC15]/50 focus:ring-1 focus:ring-[#FACC15]/20 transition-all text-zinc-100 placeholder:text-zinc-600 box-border"
                  />
                </div>

                <div className="space-y-3 pb-4">
                  {filteredAnnotations.length > 0 ? (
                    filteredAnnotations.map((item) => (
                      <div key={item.id} onClick={() => openThreadAndScroll(item.id)} className="cursor-pointer">
                        <AnnotationCard annotation={item} />
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-3">
                      <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6 text-zinc-700" />
                      </div>
                      <p className="text-zinc-500 text-sm">No annotations found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'thread' && (
              <ThreadView 
                key={activeAnnotationId || 'new'}
                annotation={activeAnnotationData || { selected_text: newText }} 
                currentUser={currentUser}
                onRefresh={(newAnnId?: number) => {
                  if (newAnnId) {
                    setActiveAnnotationId(newAnnId);
                  }
                  fetchAnnotations();
                }}
                onClose={() => { setView('list'); setActiveAnnotationId(null); fetchAnnotations(); }}
              />
            )}
          </AnimatePresence>
        )}
      </main>

      {isAuthenticated && view === 'list' && (
        <footer className="p-3 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-medium shrink-0">
          <span>{annotations.length} Annotations Documented</span>
        </footer>
      )}
    </div>
  );
}

const AnnotationCard: React.FC<{ annotation: APIAnnotation }> = ({ annotation }) => {
  return (
    <motion.div 
      layout
      className="group bg-zinc-900/40 border border-zinc-800 hover:border-zinc-500 rounded-xl p-4 transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono tracking-tighter">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(annotation.created_at)}</span>
        </div>
        <div className="flex items-center text-xs text-zinc-500 gap-1 bg-zinc-900 px-2 py-1 rounded-full">
            <MessageSquare className="w-3 h-3" /> {annotation.comments?.length || 0}
        </div>
      </div>

      <div className="relative mb-3 pl-3 border-l-2 border-[#FACC15]/30">
        <p className="text-xs text-zinc-300 italic line-clamp-3 leading-relaxed">
          &quot;{annotation.selected_text}&quot;
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#121212] border border-zinc-700 text-[10px] font-bold text-zinc-400">
            {annotation.comments && annotation.comments.length > 0 ? annotation.comments[0].user?.username.charAt(0).toUpperCase() : '?'}
        </div>
        <p className="text-sm text-zinc-400 truncate">
          {annotation.comments && annotation.comments.length > 0 ? annotation.comments[0].content : ''}
        </p>
      </div>
    </motion.div>
  );
}
