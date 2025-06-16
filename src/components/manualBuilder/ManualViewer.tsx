import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Sidebar docs-style
function Sidebar({
  sections,
  selectedSectionId,
  selectedSubsectionId,
  onSectionSelect,
  onSubsectionSelect,
}: {
  sections: any[];
  selectedSectionId: string | null;
  selectedSubsectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
  onSubsectionSelect: (sectionId: string, subId: string) => void;
}) {
  return (
    <aside className="w-80 min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white px-4 pt-8 pb-8 rounded-r-3xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Secciones</h2>
      <ul>
        {sections.map((section: any) => (
          <li key={section.id} className="mb-3">
            <button
              onClick={() => onSectionSelect(section.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-lg transition-all ${
                section.id === selectedSectionId
                  ? "bg-blue-600 text-white shadow"
                  : "bg-blue-800 hover:bg-blue-600"
              }`}
            >
              {section.title}
            </button>
            {/* subsecciones como índice */}
            {section.id === selectedSectionId && (
              <ul className="ml-2 mt-2">
                {section.subsections.map((sub: any) => (
                  <li key={sub.id}>
                    <button
                      onClick={() => onSubsectionSelect(section.id, sub.id)}
                      className={`block w-full text-left px-4 py-2 my-1 rounded-md transition-all ${
                        sub.id === selectedSubsectionId
                          ? "bg-cyan-400 text-blue-900 font-bold"
                          : "bg-blue-100 text-blue-900 hover:bg-cyan-100"
                      }`}
                    >
                      {sub.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function VideoBlock({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex flex-col items-center mb-8">
      {!playing ? (
        <div
          className="relative cursor-pointer rounded-xl shadow-lg border-2 border-blue-400 overflow-hidden"
          onClick={() => {
            setPlaying(true);
            setTimeout(() => videoRef.current?.play(), 100);
          }}
        >
          <video
            ref={videoRef}
            src={src}
            width={300}
            className="object-cover rounded-xl opacity-70"
            poster="https://img.icons8.com/fluency/48/play-button-circled.png"
            muted
          />
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="bg-white/70 rounded-full p-3 border-4 border-blue-300">
              <svg width={32} height={32} fill="#1e40af" viewBox="0 0 24 24">
                <path d="M7 6v12l10-6z" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <video
          src={src}
          width={360}
          controls
          autoPlay
          className="rounded-xl border-2 border-blue-300"
          ref={videoRef}
        />
      )}
    </div>
  );
}

export default function ManualViewerDocs({
  manualId,
  onEdit,
}: {
  manualId: string;
  onEdit: () => void;
}) {
  const [manual, setManual] = useState<any>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  // para scroll automático
  const subsectionRefs = useRef<{ [subId: string]: HTMLDivElement | null }>({});
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:9999/api/v1/manuals/${manualId}`)
      .then((res) => res.json())
      .then((data) => {
        setManual(data);
        console.log("MANUAL:", data);

        if (data.sections?.[0]) {
          setSelectedSectionId(data.sections[0].id);
        }
      })
      .catch((err) => console.error("Error cargando manual:", err));
  }, [manualId]);

  // Scroll automático al seleccionar subsección
  useEffect(() => {
    if (scrollTarget && subsectionRefs.current[scrollTarget]) {
      subsectionRefs.current[scrollTarget]!.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setScrollTarget(null);
    }
  }, [scrollTarget, manual]);

  const selectedSection =
    manual?.sections?.find((s: any) => s.id === selectedSectionId) || manual?.sections?.[0];

  return (
    <div className="flex min-h-screen bg-gradient-to-tr from-blue-50 via-white to-cyan-100">
      {/* Sidebar */}
      <Sidebar
        sections={manual?.sections || []}
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={scrollTarget}
        onSectionSelect={(secId) => setSelectedSectionId(secId)}
        onSubsectionSelect={(_, subId) => setScrollTarget(subId)}
      />
      {/* Main docs area */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-800 drop-shadow">{selectedSection?.title || manual?.title || "Manual"}</h1>
          <Button onClick={onEdit} className="bg-cyan-700 hover:bg-cyan-800 text-lg px-6 py-2 rounded-xl shadow">
            📝 Seguir editando
          </Button>
        </div>
        {/* Renderiza toda la sección, con todas las subsecciones y sus bloques */}
        {selectedSection?.subsections && selectedSection.subsections.length > 0 ? (
          selectedSection.subsections.map((sub: any) => (
            <div
              key={sub.id}
              ref={(el) => {
                subsectionRefs.current[sub.id] = el;
              }}
              className="mb-14"
            >
              <h2 className="text-2xl text-cyan-800 font-bold bg-cyan-100 px-3 py-2 rounded-xl border-l-8 border-blue-500 mb-4 drop-shadow-sm">
                {sub.title}
              </h2>
              {/* Bloques */}
              {Array.isArray(sub.blocks) && sub.blocks.length > 0 ? (
                sub.blocks.map((block: any, idx: number) =>
                  block.type === "text" ? (
                    <p
                      key={idx}
                      className="text-lg mb-6 bg-white/60 rounded-xl p-5 border-l-4 border-blue-300 text-blue-900 shadow"
                    >
                      {block.content}
                    </p>
                  ) : (
                    <VideoBlock key={idx} src={block.content} />
                  )
                )
              ) : (
                <p className="italic text-slate-400 mb-4 ml-2">
                  (No hay bloques en esta subsección)
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400 italic mt-16">
            No hay subsecciones en esta sección.
          </div>
        )}
      </main>
    </div>
  );
}
