import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function BlockEditor({ subsectionId }: { subsectionId: string }) {
  const [type, setType] = useState<"text" | "video">("text");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleCreateBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:9999/api/v1/manuals/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, order, subsectionId }),
      });
      await res.json();
      setOrder(order + 1);
      setContent("");
    } catch (err) {
      console.error("Error creando bloque:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-4 mt-2 p-4 bg-white border rounded-lg">
      <div className="flex flex-col md:flex-row gap-2 mb-2">
        <Select value={type} onValueChange={v => setType(v as "text" | "video")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tipo de bloque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={1}
          value={order}
          onChange={e => setOrder(Number(e.target.value))}
          className="w-24"
          placeholder="Orden"
        />
      </div>
      <Textarea
        placeholder={type === "text" ? "Contenido de texto" : "URL del video"}
        value={content}
        onChange={e => setContent(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleCreateBlock} disabled={!content || loading}>
        Agregar bloque
      </Button>
    </div>
  );
}