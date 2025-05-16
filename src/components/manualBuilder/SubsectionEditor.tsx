import { useState } from "react";
import BlockEditor from "./Blockeditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SubsectionEditor({ sectionId }: { sectionId: string }) {
  const [title, setTitle] = useState("");
  const [subsections, setSubsections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:9999/api/v1/manuals/subsection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sectionId }),
      });
      const data = await res.json();
      setSubsections([...subsections, data]);
      setTitle("");
    } catch (err) {
      console.error("Error creando subsección:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number, newTitle: string) => {
    const updated = [...subsections];
    updated[index].title = newTitle;
    setSubsections(updated);
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
        {subsections.map((subsection, i) => (
          <Card key={subsection.id} className="bg-blue-50 border-blue-100">
            <CardHeader>
              <Input
                value={subsection.title}
                onChange={(e) => handleEdit(i, e.target.value)}
                className="font-semibold text-blue-700"
              />
            </CardHeader>
            <CardContent>
              <BlockEditor subsectionId={subsection.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}