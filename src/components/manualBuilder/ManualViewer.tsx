import { useState, useEffect, useContext, useRef, useMemo, useCallback, memo } from 'react';
import { 
  Play, 
  Edit, 
  Trash2, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Video as VideoIcon,
  Save,
  X,
  Menu,
  BookOpen,
  Navigation,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthContext } from '../../contexts/AuthProvider';
import { backendAuthFetch } from '../../lib/utils';
import videoService from '../../services/video';
import manualService from '../../services/manual';
import Header from '../Header';

// Hook personalizado para localStorage draft
const useLocalStorageDraft = (key: string, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: any) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  const clearValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue];
};

// Hook para debounce
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface Block {
  id: string;
  type: "text" | "video";
  content: string;
  videoId?: string;  // Para bloques de video
  order: number;
}

interface Subsection {
  id: string;
  title: string;
  order: number;
  blocks: Block[];
}

interface Section {
  id: string;
  title: string;
  order: number;
  subsections: Subsection[];
}

interface Manual {
  id: string;
  title: string;
  sections: Section[];
}

interface Video {
  id: string;
  title: string;
  fileUrl: string;
}

// Componente de Sidebar moderno con funcionalidad de edición - Optimizado
const ModernSidebar = memo(function ModernSidebar({
  manual,
  selectedSectionId,
  selectedSubsectionId,
  onSectionSelect,
  onSubsectionSelect,
  editMode,
  onUpdateManual,
}: {
  manual: Manual | null;
  selectedSectionId: string | null;
  selectedSubsectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
  onSubsectionSelect: (sectionId: string, subId: string) => void;
  editMode: boolean;
  onUpdateManual: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{type: 'manual' | 'section' | 'subsection', id: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddDialog, setShowAddDialog] = useState<{type: 'section' | 'subsection', parentId?: string} | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  
  // localStorage para drafts de edición
  const [editDrafts, setEditDrafts] = useLocalStorageDraft('manual-edit-drafts', {});
  
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "administrador";

  // Debounce para auto-guardar drafts
  const debouncedEditValue = useDebounce(editValue, 500);
  
  useEffect(() => {
    if (editingItem && debouncedEditValue) {
      const draftKey = `${editingItem.type}-${editingItem.id}`;
      setEditDrafts((prev: Record<string, any>) => ({
        ...prev,
        [draftKey]: debouncedEditValue
      }));
    }
  }, [editingItem, debouncedEditValue, setEditDrafts]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleEdit = useCallback((type: 'manual' | 'section' | 'subsection', id: string, currentTitle: string) => {
    setEditingItem({type, id});
    
    // Restaurar draft si existe
    const draftKey = `${type}-${id}`;
    const draft = (editDrafts as Record<string, any>)[draftKey];
    
    if (draft && typeof draft === 'string') {
      setEditValue(draft);
    } else {
      setEditValue(currentTitle);
    }
  }, [editDrafts]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingItem || !editValue.trim()) return;

    try {
      let endpoint = '';
      let body = {};

      switch (editingItem.type) {
        case 'manual':
          endpoint = `${import.meta.env.VITE_API_URL}/manuals/${editingItem.id}`;
          body = { title: editValue.trim() };
          break;
        case 'section':
          endpoint = `${import.meta.env.VITE_API_URL}/manuals/section/${editingItem.id}`;
          body = { title: editValue.trim() };
          break;
        case 'subsection':
          endpoint = `${import.meta.env.VITE_API_URL}/manuals/subsection/${editingItem.id}`;
          body = { title: editValue.trim() };
          break;
      }

      await backendAuthFetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Limpiar draft después de guardar
      const draftKey = `${editingItem.type}-${editingItem.id}`;
      setEditDrafts((prev: Record<string, any>) => {
        const newDrafts = {...prev};
        delete newDrafts[draftKey];
        return newDrafts;
      });

      setEditingItem(null);
      setEditValue('');
      onUpdateManual();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  }, [editingItem, editValue, onUpdateManual, setEditDrafts]);

  const handleDelete = useCallback(async (type: 'section' | 'subsection', id: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar esta ${type === 'section' ? 'sección' : 'subsección'}?`)) return;

    try {
      const endpoint = `${import.meta.env.VITE_API_URL}/manuals/${type}/${id}`;
      await backendAuthFetch(endpoint, { method: 'DELETE' });
      onUpdateManual();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, [onUpdateManual]);

  const handleAdd = useCallback(async () => {
    if (!showAddDialog || !newItemTitle.trim()) return;

    try {
      let endpoint = '';
      let body = {};

      if (showAddDialog.type === 'section') {
        endpoint = `${import.meta.env.VITE_API_URL}/manuals/section`;
        body = {
          title: newItemTitle.trim(),
          manualId: manual?.id,
          order: manual?.sections?.length || 0
        };
      } else {
        endpoint = `${import.meta.env.VITE_API_URL}/manuals/subsection`;
        const section = manual?.sections.find(s => s.id === showAddDialog.parentId);
        body = {
          title: newItemTitle.trim(),
          sectionId: showAddDialog.parentId,
          order: section?.subsections?.length || 0
        };
      }

      await backendAuthFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setShowAddDialog(null);
      setNewItemTitle('');
      onUpdateManual();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  }, [showAddDialog, newItemTitle, manual, onUpdateManual]);

  if (!manual) return null;

  return (
    <aside className="w-80 min-h-screen bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 relative">
      {/* Header del manual */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="flex-1">
            {editingItem?.type === 'manual' && editingItem.id === manual.id ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
                <Button size="sm" onClick={handleSaveEdit} className="px-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="px-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{manual.title}</h2>
                {editMode && isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('manual', manual.id, manual.title)}
                    className="p-1 h-6 w-6 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {manual.sections.length} {manual.sections.length === 1 ? 'sección' : 'secciones'}
        </p>
      </div>

      {/* Lista de secciones */}
      <div className="p-4 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto">
        {manual.sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const isSelected = section.id === selectedSectionId;
          
          return (
            <div key={section.id} className="space-y-1">
              {/* Sección */}
              <div className={`group flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleSection(section.id)}
                  className="p-1 h-6 w-6 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
                
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSectionSelect(section.id);
                    if (!isExpanded) toggleSection(section.id);
                  }}
                >
                  {editingItem?.type === 'section' && editingItem.id === section.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm h-6"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <Button size="sm" onClick={handleSaveEdit} className="px-1 h-6 bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="px-1 h-6 text-slate-600 dark:text-slate-400">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                      {section.title}
                    </span>
                  )}
                </div>

                {editMode && isAdmin && editingItem?.type !== 'section' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('section', section.id, section.title)}
                      className="p-1 h-6 w-6 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddDialog({type: 'subsection', parentId: section.id})}
                      className="p-1 h-6 w-6 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete('section', section.id)}
                      className="p-1 h-6 w-6 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Subsecciones */}
              {isExpanded && section.subsections.map((subsection) => {
                const isSubSelected = subsection.id === selectedSubsectionId;
                
                return (
                  <div 
                    key={subsection.id}
                    className={`group ml-8 flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isSubSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onSubsectionSelect(section.id, subsection.id)}
                    >
                      {editingItem?.type === 'subsection' && editingItem.id === subsection.id ? (
                        <div className="flex gap-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-xs h-5"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <Button size="sm" onClick={handleSaveEdit} className="px-1 h-5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                            <Save className="w-2 h-2" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="px-1 h-5 text-slate-600 dark:text-slate-400">
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100">
                          {subsection.title}
                        </span>
                      )}
                    </div>

                    {editMode && isAdmin && editingItem?.type !== 'subsection' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit('subsection', subsection.id, subsection.title)}
                          className="p-1 h-5 w-5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Edit className="w-2 h-2" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete('subsection', subsection.id)}
                          className="p-1 h-5 w-5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-2 h-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Botón para agregar nueva sección */}
        {editMode && (
          <Button
            onClick={() => setShowAddDialog({type: 'section'})}
            variant="ghost"
            className="w-full justify-start gap-2 mt-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            <Plus className="w-4 h-4" />
            Agregar sección
          </Button>
        )}
      </div>

      {/* Dialog para agregar elementos */}
      <Dialog open={!!showAddDialog} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>
              Agregar nueva {showAddDialog?.type === 'section' ? 'sección' : 'subsección'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={`Título de la ${showAddDialog?.type === 'section' ? 'sección' : 'subsección'}`}
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowAddDialog(null)} className="text-slate-600 dark:text-slate-400">
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!newItemTitle.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
});

// Componente de bloque de video moderno - Optimizado
const ModernVideoBlock = memo(function ModernVideoBlock({ 
  src, 
  videoId,
  editMode, 
  onEdit, 
  onDelete 
}: { 
  src: string;
  videoId?: string;
  editMode: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string>(src);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Obtener URL firmada si tenemos videoId - memoizado
  const getSignedUrl = useCallback(async () => {
    if (!videoId) return;
    
    setLoading(true);
    try {
      const url = await manualService.getVideoSignedUrl(videoId);
      setSignedUrl(url);
    } catch (error) {
      console.error('Error getting signed URL:', error);
      setSignedUrl(src);
    } finally {
      setLoading(false);
    }
  }, [videoId, src]);

  useEffect(() => {
    getSignedUrl();
  }, [getSignedUrl]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    setTimeout(() => videoRef.current?.play(), 100);
  }, []);

  if (!src) return null;

  if (loading) {
    return (
      <div className="relative group mb-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-6">
          <div className="w-full h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group mb-6">
      {editMode && (
        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 border border-slate-200 dark:border-slate-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 border border-slate-200 dark:border-slate-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-6">
        {!playing ? (
          <div
            className="relative cursor-pointer rounded-lg overflow-hidden group/video"
            onClick={handlePlay}
          >
            <video
              ref={videoRef}
              src={signedUrl}
              className="w-full h-64 object-cover rounded-lg"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/video:bg-black/30 transition-colors">
              <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-4 border-2 border-white/30 group-hover/video:scale-105 transition-transform">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={signedUrl}
            controls
            autoPlay
            className="w-full rounded-lg"
          />
        )}
      </div>
    </div>
  );
});

// Componente de bloque de texto moderno - Optimizado
const ModernTextBlock = memo(function ModernTextBlock({ 
  content, 
  editMode, 
  onEdit, 
  onDelete 
}: { 
  content: string; 
  editMode: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="relative group mb-6">
      {editMode && (
        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 border border-slate-200 dark:border-slate-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 border border-slate-200 dark:border-slate-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-6 border-l-4 border-l-blue-500">
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
});

// Componente principal del viewer - Optimizado
export default function ManualViewer({
  manualId,
  onEdit,
  onBack,
}: {
  manualId: string;
  onEdit?: () => void;
  onBack?: () => void;
}) {
  const [manual, setManual] = useState<Manual | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estados para edición de bloques con localStorage para drafts
  const [editingBlock, setEditingBlock] = useState<{blockId: string, type: 'text' | 'video'} | null>(null);
  const [blockContent, setBlockContent] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [showAddBlockDialog, setShowAddBlockDialog] = useState<{subsectionId: string} | null>(null);
  const [newBlockType, setNewBlockType] = useState<'text' | 'video'>('text');
  
  // localStorage para drafts de bloques
  const [blockDrafts, setBlockDrafts] = useLocalStorageDraft(`manual-block-drafts-${manualId}`, {});
  
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "administrador";
  const editMode = false; // Modo edición deshabilitado - solo "Editor avanzado" disponible
  const subsectionRefs = useRef<{ [subId: string]: HTMLDivElement | null }>({});

  // Memoizar videos para evitar re-renders innecesarios
  const videoOptions = useMemo(() => 
    videos.map(video => ({ id: video.id, title: video.title, fileUrl: video.fileUrl })),
    [videos]
  );

  // Función auxiliar para obtener videoId a partir de la URL - memoizada
  const getVideoIdFromUrl = useCallback((url: string): string | undefined => {
    const video = videoOptions.find(v => v.fileUrl === url);
    return video?.id;
  }, [videoOptions]);

  // Debounce para contenido de bloque
  const debouncedBlockContent = useDebounce(blockContent, 500);

  // Auto-guardar draft de bloque cuando cambia el contenido
  useEffect(() => {
    if (editingBlock && debouncedBlockContent) {
      const draftKey = `${editingBlock.type}-${editingBlock.blockId}`;
      setBlockDrafts((prev: Record<string, any>) => ({
        ...prev,
        [draftKey]: {
          content: debouncedBlockContent,
          videoId: selectedVideoId,
          timestamp: Date.now()
        }
      }));
    }
  }, [editingBlock, debouncedBlockContent, selectedVideoId, setBlockDrafts]);

  // Cargar manual - optimizado con useCallback
  const loadManual = useCallback(async () => {
    try {
      setLoading(true);
      const response = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/${manualId}`);
      const data = await response.json();
      setManual(data.data || data);
      
      // Auto-seleccionar primera sección si no hay ninguna seleccionada
      if ((data.data || data).sections?.[0] && !selectedSectionId) {
        setSelectedSectionId((data.data || data).sections[0].id);
        // Auto-seleccionar primera subsección también
        if ((data.data || data).sections[0].subsections?.[0]) {
          setSelectedSubsectionId((data.data || data).sections[0].subsections[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading manual:', error);
    } finally {
      setLoading(false);
    }
  }, [manualId, selectedSectionId]);

  // Cargar videos para selector - optimizado con useCallback
  const loadVideos = useCallback(async () => {
    try {
      const data = await videoService.fetchAllVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  }, []);

  useEffect(() => {
    loadManual();
    loadVideos();
  }, [loadManual, loadVideos]);

  // Auto-scroll a subsección seleccionada - optimizado
  useEffect(() => {
    if (selectedSubsectionId && subsectionRefs.current[selectedSubsectionId]) {
      const timeoutId = setTimeout(() => {
        subsectionRefs.current[selectedSubsectionId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedSubsectionId]);

  // Efecto para expandir automáticamente secciones seleccionadas - optimizado
  useEffect(() => {
    if (selectedSectionId && manual) {
      const section = manual.sections.find(s => s.id === selectedSectionId);
      if (section) {
        // Si la sección no tiene subsecciones, limpiar subsección seleccionada
        if (!section.subsections || section.subsections.length === 0) {
          setSelectedSubsectionId(null);
        } else if (!selectedSubsectionId) {
          // Auto-seleccionar primera subsección si no hay ninguna seleccionada
          setSelectedSubsectionId(section.subsections[0].id);
        }
      }
    }
  }, [selectedSectionId, manual, selectedSubsectionId]);

  // Handlers para bloques - optimizados con useCallback
  const handleEditBlock = useCallback((blockId: string, type: 'text' | 'video', currentContent: string) => {
    setEditingBlock({blockId, type});
    
    // Restaurar draft si existe
    const draftKey = `${type}-${blockId}`;
    const draft = (blockDrafts as Record<string, any>)[draftKey];
    
    if (draft && draft.timestamp > Date.now() - 24 * 60 * 60 * 1000) { // 24 horas
      setBlockContent(draft.content || currentContent);
      if (type === 'video') {
        setSelectedVideoId(draft.videoId || '');
      }
    } else {
      setBlockContent(currentContent);
      if (type === 'video') {
        const video = videoOptions.find(v => v.fileUrl === currentContent);
        setSelectedVideoId(video?.id || '');
      }
    }
  }, [blockDrafts, videoOptions]);

  const handleSaveBlock = useCallback(async () => {
    if (!editingBlock) return;

    try {
      const content = editingBlock.type === 'video' 
        ? videoOptions.find(v => v.id === selectedVideoId)?.fileUrl || ''
        : blockContent;

      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block/${editingBlock.blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      // Limpiar draft después de guardar
      const draftKey = `${editingBlock.type}-${editingBlock.blockId}`;
      setBlockDrafts((prev: Record<string, any>) => {
        const newDrafts = {...prev};
        delete newDrafts[draftKey];
        return newDrafts;
      });

      setEditingBlock(null);
      setBlockContent('');
      setSelectedVideoId('');
      loadManual();
    } catch (error) {
      console.error('Error updating block:', error);
    }
  }, [editingBlock, blockContent, selectedVideoId, videoOptions, setBlockDrafts, loadManual]);

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bloque?')) return;

    try {
      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block/${blockId}`, {
        method: 'DELETE',
      });
      loadManual();
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  }, [loadManual]);

  const handleAddBlock = useCallback(async () => {
    if (!showAddBlockDialog) return;

    try {
      const content = newBlockType === 'video' 
        ? videoOptions.find(v => v.id === selectedVideoId)?.fileUrl || ''
        : blockContent;

      if (!content.trim()) return;

      const subsection = manual?.sections
        .flatMap(s => s.subsections)
        .find(sub => sub.id === showAddBlockDialog.subsectionId);

      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newBlockType,
          content,
          subsectionId: showAddBlockDialog.subsectionId,
          order: subsection?.blocks?.length || 0,
        }),
      });

      // Limpiar draft del nuevo bloque
      const draftKey = `new-${newBlockType}-${showAddBlockDialog.subsectionId}`;
      setBlockDrafts((prev: Record<string, any>) => {
        const newDrafts = {...prev};
        delete newDrafts[draftKey];
        return newDrafts;
      });

      setShowAddBlockDialog(null);
      setBlockContent('');
      setSelectedVideoId('');
      setNewBlockType('text');
      loadManual();
    } catch (error) {
      console.error('Error adding block:', error);
    }
  }, [showAddBlockDialog, newBlockType, blockContent, selectedVideoId, videoOptions, manual, setBlockDrafts, loadManual]);

  // Memoizar sección seleccionada
  const selectedSection = useMemo(() => 
    manual?.sections?.find(s => s.id === selectedSectionId) || manual?.sections?.[0],
    [manual?.sections, selectedSectionId]
  );

  // Funciones de navegación optimizadas
  const handleSectionSelect = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId);
  }, []);

  const handleSubsectionSelect = useCallback((sectionId: string, subId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedSubsectionId(subId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 dark:border-slate-600 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Cargando manual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header de usuario */}
      <Header />
      
      {/* Header superior */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Menu className="w-5 h-5" />
              </Button>
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="gap-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg px-4 py-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la lista
                </Button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  {manual?.title || 'Manual'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  Documentación técnica
                </p>
              </div>
            </div>
            
            {onEdit && isAdmin && (
              <Button
                onClick={onEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editor avanzado
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <ModernSidebar
            manual={manual}
            selectedSectionId={selectedSectionId}
            selectedSubsectionId={selectedSubsectionId}
            onSectionSelect={handleSectionSelect}
            onSubsectionSelect={handleSubsectionSelect}
            editMode={editMode}
            onUpdateManual={loadManual}
          />
        )}

        {/* Área principal de contenido */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-900">
          {/* Contenido */}
          <div className="p-8 max-h-[calc(100vh-180px)] overflow-y-auto">
            {selectedSection && selectedSection.subsections && selectedSection.subsections.length > 0 ? (
              selectedSection.subsections.map((subsection) => (
                <div
                  key={subsection.id}
                  ref={(el) => { subsectionRefs.current[subsection.id] = el; }}
                  className={`mb-12 transition-all ${
                    selectedSubsectionId === subsection.id 
                      ? 'ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-6' 
                      : ''
                  }`}
                >
                  {/* Header de subsección */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3 ${
                      selectedSubsectionId === subsection.id ? 'text-blue-700 dark:text-blue-300' : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedSubsectionId === subsection.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Navigation className="w-4 h-4" />
                      </div>
                      {subsection.title}
                    </h2>
                    
                    {editMode && (
                      <Button
                        onClick={() => setShowAddBlockDialog({subsectionId: subsection.id})}
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar bloque
                      </Button>
                    )}
                  </div>

                  {/* Bloques */}
                  <div className="space-y-4">
                    {subsection.blocks && subsection.blocks.length > 0 ? (
                      subsection.blocks
                        .sort((a, b) => a.order - b.order)
                        .map((block) => (
                          block.type === 'text' ? (
                            <ModernTextBlock
                              key={block.id}
                              content={block.content}
                              editMode={editMode}
                              onEdit={() => handleEditBlock(block.id, 'text', block.content)}
                              onDelete={() => handleDeleteBlock(block.id)}
                            />
                          ) : (
                            <ModernVideoBlock
                              key={block.id}
                              src={block.content}
                              videoId={block.videoId || getVideoIdFromUrl(block.content)}
                              editMode={editMode}
                              onEdit={() => handleEditBlock(block.id, 'video', block.content)}
                              onDelete={() => handleDeleteBlock(block.id)}
                            />
                          )
                        ))
                    ) : (
                      <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                        <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <FileText className="w-10 h-10 opacity-50" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Sin contenido disponible</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500">Esta subsección aún no tiene bloques de contenido</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                <div className="w-24 h-24 mx-auto mb-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 opacity-50" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Sección sin subsecciones</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Esta sección no tiene subsecciones definidas. {isAdmin ? 'Usa el "Editor avanzado" para añadir contenido.' : 'Contacta al administrador para añadir contenido.'}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Diálogos de edición */}
        <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
          <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Editar bloque de {editingBlock?.type === 'text' ? 'texto' : 'video'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingBlock?.type === 'text' ? (
                <Textarea
                  value={blockContent}
                  onChange={(e) => setBlockContent(e.target.value)}
                  placeholder="Contenido del bloque..."
                  className="min-h-[200px] bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                />
              ) : (
                <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Selecciona un video" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                    {videoOptions.map((video) => (
                      <SelectItem key={video.id} value={video.id} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">
                        {video.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setEditingBlock(null)} className="text-slate-600 dark:text-slate-400">
                  Cancelar
                </Button>
                <Button onClick={handleSaveBlock} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Guardar cambios
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!showAddBlockDialog} onOpenChange={() => setShowAddBlockDialog(null)}>
          <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar nuevo bloque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newBlockType} onValueChange={(value: 'text' | 'video') => setNewBlockType(value)}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                  <SelectItem value="text" className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Bloque de texto
                    </div>
                  </SelectItem>
                  <SelectItem value="video" className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <VideoIcon className="w-4 h-4" />
                      Bloque de video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {newBlockType === 'text' ? (
                <Textarea
                  value={blockContent}
                  onChange={(e) => setBlockContent(e.target.value)}
                  placeholder="Contenido del bloque..."
                  className="min-h-[200px] bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                />
              ) : (
                <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Selecciona un video" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                    {videoOptions.map((video) => (
                      <SelectItem key={video.id} value={video.id} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">
                        {video.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowAddBlockDialog(null)} className="text-slate-600 dark:text-slate-400">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddBlock}
                  disabled={newBlockType === 'text' ? !blockContent.trim() : !selectedVideoId}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Agregar bloque
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
