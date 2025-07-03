import { useState } from "react";
import BlockEditor from "./Blockeditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";

interface Block { type: string; content?: string; videoId?: string }
interface Subsection { id: string; title: string; blocks: Block[] }

interface SubsectionEditorProps {
  sectionId: string;
  subsections: Subsection[];
  setSubsections: (newSubsections: Subsection[]) => void;
}

export default function SubsectionEditor({
  sectionId,
  subsections,
  setSubsections
}: SubsectionEditorProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // --- BLOQUES ---
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [showBlockEditor, setShowBlockEditor] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await backendAuthFetch("http://localhost:9999/api/v1/manuals/subsection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sectionId }),
      });
      const data = await res.json();
      setSubsections([...subsections, { ...data, blocks: [] }]);
      setTitle("");
    } catch (err) {
      console.error("Error creando subsección:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = (subId: string) => {
    setEditingSubId(subId);
    setShowBlockEditor(true);
  };

  // ---- SOLUCIÓN COMPLETA ---
  const handleSaveBlock = async (block: Block) => {
    if (!editingSubId) return;

    const order = subsections.find((s) => s.id === editingSubId)?.blocks.length ?? 0;

    // El content debe ser texto o el ID del video, nunca undefined
    const payload = {
      type: block.type,
      content: block.type === "text"
        ? block.content
        : block.videoId, // GUARDA el videoId como content
      subsectionId: editingSubId,
      order,
    };

    try {
      const res = await backendAuthFetch("http://localhost:9999/api/v1/manuals/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSubsections(subsections.map(sub =>
        sub.id === editingSubId
          ? { ...sub, blocks: [...(sub.blocks || []), data] }
          : sub
      ));
    } catch (err) {
      console.error("Error guardando bloque:", err);
    }
    setShowBlockEditor(false);
    setEditingSubId(null);
  };

  const handleCancelBlock = () => {
    setShowBlockEditor(false);
    setEditingSubId(null);
  };

  return (
    <div className="ml-4">
      <div className="flex gap-2 mb-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título subsección"
          disabled={loading}
        />
        <Button onClick={handleCreate} disabled={!title || loading}>
          Agregar subsección
        </Button>
      </div>
      <div className="space-y-4">
        {subsections.map((subsection) => (
          <Card key={subsection.id} className="bg-blue-50 border-blue-100">
            <CardHeader>
              <Input
                value={subsection.title}
                readOnly
                className="font-semibold text-blue-700"
              />
            </CardHeader>
            <CardContent>
              {/* LISTA DE BLOQUES */}
              <div className="mb-2">
                {(subsection.blocks || []).map((block, idx) => (
                  <div key={idx} className="p-2 border rounded my-1">
                    {block.type === "text"
                      ? block.content
                      : block.content // Aquí siempre hay un ID de video (no undefined)
                        ? `Video: ${block.content}`
                        : <span style={{color:'red'}}>Video no definido</span>
                    }
                  </div>
                ))}
              </div>
              <Button onClick={() => handleAddBlock(subsection.id)}>
                Agregar bloque
              </Button>
              {showBlockEditor && editingSubId === subsection.id && (
                <BlockEditor
                  onSave={handleSaveBlock}
                  onCancel={handleCancelBlock}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
