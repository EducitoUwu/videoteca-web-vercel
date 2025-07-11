import { useState, useEffect, useRef, useContext } from 'react';
import { Button } from '../ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
import { AuthContext } from '../../contexts/AuthProvider';
import { backendAuthFetch } from '../../lib/utils';
import videoService from '../../services/video';
import manualService from '../../services/manual';
import Header from '../Header';

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

// Componente de Sidebar moderno con funcionalidad de edición
function ModernSidebar({
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
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === "administrador";

  // Auto-expandir sección seleccionada
  useEffect(() => {
    if (selectedSectionId) {
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedSectionId);
        return newSet;
      });
    }
  }, [selectedSectionId]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleEdit = (type: 'manual' | 'section' | 'subsection', id: string, currentTitle: string) => {
    setEditingItem({type, id});
    setEditValue(currentTitle);
  };

  const handleSaveEdit = async () => {
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

      setEditingItem(null);
      setEditValue('');
      onUpdateManual();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDelete = async (type: 'section' | 'subsection', id: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar esta ${type === 'section' ? 'sección' : 'subsección'}?`)) return;

    try {
      const endpoint = `${import.meta.env.VITE_API_URL}/manuals/${type}/${id}`;
      await backendAuthFetch(endpoint, { method: 'DELETE' });
      onUpdateManual();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleAdd = async () => {
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
  };

  if (!manual) return null;
  return (
    <aside className="w-80 min-h-screen bg-slate-900/95 backdrop-blur-xl border-r border-blue-400/20 text-white relative">
      {/* Header del manual */}
      <div className="p-6 border-b border-blue-400/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            {editingItem?.type === 'manual' && editingItem.id === manual.id ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-slate-800 border-blue-400/30 text-white text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
                <Button size="sm" onClick={handleSaveEdit} className="px-2">
                  <Save className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="px-2">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white truncate">{manual.title}</h2>
                {editMode && isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('manual', manual.id, manual.title)}
                    className="p-1 h-6 w-6 text-gray-400 hover:text-white"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400">
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
              <div className={`group flex items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
                isSelected 
                  ? 'bg-blue-500/20 border border-blue-400/40' 
                  : 'hover:bg-slate-800/60'
              }`}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleSection(section.id)}
                  className="p-1 h-6 w-6 text-gray-400 hover:text-white"
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
                        className="bg-slate-800 border-blue-400/30 text-white text-sm h-6"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <Button size="sm" onClick={handleSaveEdit} className="px-1 h-6">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="px-1 h-6">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white">
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
                      className="p-1 h-6 w-6 text-gray-400 hover:text-blue-400"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddDialog({type: 'subsection', parentId: section.id})}
                      className="p-1 h-6 w-6 text-gray-400 hover:text-green-400"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete('section', section.id)}
                      className="p-1 h-6 w-6 text-gray-400 hover:text-red-400"
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
                    className={`group ml-8 flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                      isSubSelected 
                        ? 'bg-cyan-500/20 border border-cyan-400/40' 
                        : 'hover:bg-slate-800/40'
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
                            className="bg-slate-800 border-blue-400/30 text-white text-xs h-5"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <Button size="sm" onClick={handleSaveEdit} className="px-1 h-5 text-xs">
                            <Save className="w-2 h-2" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="px-1 h-5">
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 group-hover:text-white">
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
                          className="p-1 h-5 w-5 text-gray-400 hover:text-blue-400"
                        >
                          <Edit className="w-2 h-2" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete('subsection', subsection.id)}
                          className="p-1 h-5 w-5 text-gray-400 hover:text-red-400"
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
            className="w-full justify-start gap-2 mt-4 text-gray-400 hover:text-white hover:bg-slate-800/60"
          >
            <Plus className="w-4 h-4" />
            Agregar sección
          </Button>
        )}
      </div>

      {/* Dialog para agregar elementos */}
      <Dialog open={!!showAddDialog} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-slate-800 border-blue-400/30 text-white">
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
              className="bg-slate-700 border-blue-400/30 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowAddDialog(null)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!newItemTitle.trim()}>
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

// Componente de bloque de video moderno
function ModernVideoBlock({ 
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

  // Obtener URL firmada si tenemos videoId
  useEffect(() => {
    const getSignedUrl = async () => {
      if (!videoId) return;
      
      setLoading(true);
      try {
        const url = await manualService.getVideoSignedUrl(videoId);
        setSignedUrl(url);
      } catch (error) {
        console.error('Error getting signed URL:', error);
        // Usar la URL original como fallback
        setSignedUrl(src);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [videoId, src]);

  if (!src) return null;

  if (loading) {
    return (
      <div className="relative group mb-6">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
          <div className="w-full h-64 bg-gray-700 rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group mb-6">
      {editMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="bg-slate-800/90 text-blue-400 hover:text-blue-300 p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="bg-slate-800/90 text-red-400 hover:text-red-300 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
        {!playing ? (
          <div
            className="relative cursor-pointer rounded-xl overflow-hidden group/video"
            onClick={() => {
              setPlaying(true);
              setTimeout(() => videoRef.current?.play(), 100);
            }}
          >
            <video
              ref={videoRef}
              src={signedUrl}
              className="w-full h-64 object-cover rounded-xl"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/video:bg-black/30 transition-colors">
              <div className="bg-blue-500/90 backdrop-blur-sm rounded-full p-4 border-2 border-white/30 group-hover/video:scale-110 transition-transform">
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
            className="w-full rounded-xl"
          />
        )}
      </div>
    </div>
  );
}

// Componente de bloque de texto moderno
function ModernTextBlock({ 
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
            className="bg-slate-800/90 text-blue-400 hover:text-blue-300 p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="bg-slate-800/90 text-red-400 hover:text-red-300 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20 border-l-4 border-l-blue-500">
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}

// Componente principal del viewer
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
  
  // Estados para edición de bloques
  const [editingBlock, setEditingBlock] = useState<{blockId: string, type: 'text' | 'video'} | null>(null);
  const [blockContent, setBlockContent] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [showAddBlockDialog, setShowAddBlockDialog] = useState<{subsectionId: string} | null>(null);
  const [newBlockType, setNewBlockType] = useState<'text' | 'video'>('text');
  
  // Función auxiliar para obtener videoId a partir de la URL
  const getVideoIdFromUrl = (url: string): string | undefined => {
    const video = videos.find(v => v.fileUrl === url);
    return video?.id;
  };
  
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "administrador";
  const editMode = false; // Modo edición deshabilitado - solo "Editor avanzado" disponible
  const subsectionRefs = useRef<{ [subId: string]: HTMLDivElement | null }>({});

  // Cargar manual
  const loadManual = async () => {
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
  };

  // Cargar videos para selector
  const loadVideos = async () => {
    try {
      const data = await videoService.fetchAllVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  useEffect(() => {
    loadManual();
    loadVideos();
  }, [manualId]);

  // Auto-scroll a subsección seleccionada
  useEffect(() => {
    if (selectedSubsectionId && subsectionRefs.current[selectedSubsectionId]) {
      setTimeout(() => {
        subsectionRefs.current[selectedSubsectionId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [selectedSubsectionId]);

  // Efecto para expandir automáticamente secciones seleccionadas
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
  }, [selectedSectionId, manual]);

  // Handlers para bloques
  const handleEditBlock = (blockId: string, type: 'text' | 'video', currentContent: string) => {
    setEditingBlock({blockId, type});
    setBlockContent(currentContent);
    if (type === 'video') {
      const video = videos.find(v => v.fileUrl === currentContent);
      setSelectedVideoId(video?.id || '');
    }
  };

  const handleSaveBlock = async () => {
    if (!editingBlock) return;

    try {
      const content = editingBlock.type === 'video' 
        ? videos.find(v => v.id === selectedVideoId)?.fileUrl || ''
        : blockContent;

      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block/${editingBlock.blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      setEditingBlock(null);
      setBlockContent('');
      setSelectedVideoId('');
      loadManual();
    } catch (error) {
      console.error('Error updating block:', error);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bloque?')) return;

    try {
      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block/${blockId}`, {
        method: 'DELETE',
      });
      loadManual();
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  const handleAddBlock = async () => {
    if (!showAddBlockDialog) return;

    try {
      const content = newBlockType === 'video' 
        ? videos.find(v => v.id === selectedVideoId)?.fileUrl || ''
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

      setShowAddBlockDialog(null);
      setBlockContent('');
      setSelectedVideoId('');
      setNewBlockType('text');
      loadManual();
    } catch (error) {
      console.error('Error adding block:', error);
    }
  };

  const selectedSection = manual?.sections?.find(s => s.id === selectedSectionId) || manual?.sections?.[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Cargando manual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
      {/* Header de usuario */}
      <Header />
      
      {/* Header superior azul con botón de volver */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 backdrop-blur-lg border-b border-blue-400/30 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-blue-100 hover:text-white hover:bg-blue-700/50"
              >
                <Menu className="w-5 h-5" />
              </Button>
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="gap-2 bg-blue-800/60 border-blue-400/30 text-blue-100 hover:bg-blue-700/60 hover:border-blue-400/60 hover:text-white backdrop-blur-md rounded-xl px-4 py-2 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la lista
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-200" />
                  {manual?.title || 'Manual'}
                </h1>
                <p className="text-blue-200 text-sm mt-1">
                  Documentación técnica
                </p>
              </div>
            </div>
            
            {onEdit && isAdmin && (
              <Button
                onClick={onEdit}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editor avanzado
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Efectos de fondo optimizados */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-xl"></div>
        </div>

      {/* Sidebar */}
      {!sidebarCollapsed && (
        <ModernSidebar
          manual={manual}
          selectedSectionId={selectedSectionId}
          selectedSubsectionId={selectedSubsectionId}
          onSectionSelect={setSelectedSectionId}
          onSubsectionSelect={(sectionId: string, subId: string) => {
            setSelectedSectionId(sectionId);
            setSelectedSubsectionId(subId);
          }}
          editMode={editMode}
          onUpdateManual={loadManual}
        />
      )}

      {/* Área principal de contenido */}
      <main className="flex-1 relative z-10">
        {/* Contenido */}
        <div className="p-8 max-h-[calc(100vh-180px)] overflow-y-auto">
          {selectedSection && selectedSection.subsections && selectedSection.subsections.length > 0 ? (
            selectedSection.subsections.map((subsection) => (
              <div
                key={subsection.id}
                ref={(el) => { subsectionRefs.current[subsection.id] = el; }}
                className={`mb-12 transition-all duration-300 ${
                  selectedSubsectionId === subsection.id 
                    ? 'ring-2 ring-blue-400/30 bg-slate-800/20 rounded-2xl p-6' 
                    : ''
                }`}
              >
                {/* Header de subsección */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold text-white flex items-center gap-3 transition-colors ${
                    selectedSubsectionId === subsection.id ? 'text-blue-300' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      selectedSubsectionId === subsection.id 
                        ? 'bg-gradient-to-br from-blue-400 to-cyan-500' 
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}>
                      <Navigation className="w-4 h-4 text-white" />
                    </div>
                    {subsection.title}
                  </h2>
                  
                  {editMode && (
                    <Button
                      onClick={() => setShowAddBlockDialog({subsectionId: subsection.id})}
                      variant="outline"
                      size="sm"
                      className="border-green-400/30 text-green-400 hover:bg-green-500/10"
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
                    <div className="text-center py-16 text-gray-400">
                      <div className="w-20 h-20 mx-auto mb-6 bg-slate-800/60 rounded-full flex items-center justify-center">
                        <FileText className="w-10 h-10 opacity-50" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Sin contenido disponible</h3>
                      <p className="text-sm text-gray-500">Esta subsección aún no tiene bloques de contenido</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="w-24 h-24 mx-auto mb-8 bg-slate-800/60 rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 opacity-50" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Sección sin subsecciones</h3>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                Esta sección no tiene subsecciones definidas. {isAdmin ? 'Usa el "Editor avanzado" para añadir contenido.' : 'Contacta al administrador para añadir contenido.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Diálogos de edición */}
      <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
        <DialogContent className="bg-slate-800 border-blue-400/30 text-white max-w-2xl">
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
                className="min-h-[200px] bg-slate-700 border-blue-400/30 text-white"
              />
            ) : (
              <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                <SelectTrigger className="bg-slate-700 border-blue-400/30 text-white">
                  <SelectValue placeholder="Selecciona un video" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  {videos.map((video) => (
                    <SelectItem key={video.id} value={video.id} className="text-white hover:bg-slate-700">
                      {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEditingBlock(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBlock}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddBlockDialog} onOpenChange={() => setShowAddBlockDialog(null)}>
        <DialogContent className="bg-slate-800 border-blue-400/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar nuevo bloque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newBlockType} onValueChange={(value: 'text' | 'video') => setNewBlockType(value)}>
              <SelectTrigger className="bg-slate-700 border-blue-400/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-gray-600">
                <SelectItem value="text" className="text-white hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Bloque de texto
                  </div>
                </SelectItem>
                <SelectItem value="video" className="text-white hover:bg-slate-700">
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
                className="min-h-[200px] bg-slate-700 border-blue-400/30 text-white"
              />
            ) : (
              <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                <SelectTrigger className="bg-slate-700 border-blue-400/30 text-white">
                  <SelectValue placeholder="Selecciona un video" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-gray-600">
                  {videos.map((video) => (
                    <SelectItem key={video.id} value={video.id} className="text-white hover:bg-slate-700">
                      {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowAddBlockDialog(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddBlock}
                disabled={newBlockType === 'text' ? !blockContent.trim() : !selectedVideoId}
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
