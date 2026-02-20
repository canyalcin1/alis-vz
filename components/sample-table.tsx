"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";

interface SampleSection {
  title: string;
  rows: { parameter: string; value: string }[];
}

interface Sample {
  id: string;
  name: string;
  sections: SampleSection[];
  comment: string | null;
}

export function SampleTable({
  samples,
  fullAccess,
}: {
  samples: Sample[];
  fullAccess: boolean;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([""])
  );
  // YENİ: Tam ekran görsel state'i
  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);

  const allSections = new Map<string, Set<string>>();
  for (const sample of samples) {
    for (const section of sample.sections) {
      if (!allSections.has(section.title)) {
        allSections.set(section.title, new Set());
      }
      for (const row of section.rows) {
        allSections.get(section.title)!.add(row.parameter);
      }
    }
  }

  const toggleSection = (title: string) => {
    const next = new Set(expandedSections);
    if (next.has(title)) {
      next.delete(title);
    } else {
      next.add(title);
    }
    setExpandedSections(next);
  };

  const getValueForSample = (
    sample: Sample,
    sectionTitle: string,
    parameter: string
  ): string => {
    const section = sample.sections.find((s) => s.title === sectionTitle);
    if (!section) return "-";
    const row = section.rows.find((r) => r.parameter === parameter);
    return row?.value || "-";
  };

  return (
    <>
      {/* YENİ: Tam Ekran Görsel Modalı */}
      {fullScreenImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setFullScreenImg(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setFullScreenImg(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullScreenImg}
            alt="Detaylı Görsel"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="text-left px-4 py-3 text-xs font-semibold sticky left-0 bg-primary z-10 min-w-48">
                Analizler
              </th>
              {samples.map((s) => (
                <th
                  key={s.id}
                  className="text-center px-4 py-3 text-xs font-semibold min-w-36 whitespace-nowrap"
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(allSections.entries()).map(
              ([sectionTitle, parameters]) => {
                const isExpanded = expandedSections.has(sectionTitle);
                const paramArray = Array.from(parameters);

                return (
                  <SectionBlock
                    key={sectionTitle}
                    sectionTitle={sectionTitle}
                    parameters={paramArray}
                    samples={samples}
                    isExpanded={isExpanded}
                    onToggle={() => toggleSection(sectionTitle)}
                    getValueForSample={getValueForSample}
                    fullAccess={fullAccess}
                    onImageClick={(imgUrl) => setFullScreenImg(imgUrl)} // Modalı tetikleyen prop
                  />
                );
              }
            )}

            {samples.some((s) => s.comment) && (
              <>
                <tr className="bg-accent/10">
                  <td
                    colSpan={samples.length + 1}
                    className="px-4 py-2 text-xs font-semibold text-accent-foreground"
                  >
                    Analiz Yorum
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-xs text-muted-foreground sticky left-0 bg-card z-10">
                    Yorum
                  </td>
                  {samples.map((s) => (
                    <td
                      key={s.id}
                      className="px-4 py-3 text-xs text-foreground max-w-xs"
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {s.comment || "-"}
                      </div>
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SectionBlock({
  sectionTitle,
  parameters,
  samples,
  isExpanded,
  onToggle,
  getValueForSample,
  fullAccess,
  onImageClick,
}: {
  sectionTitle: string;
  parameters: string[];
  samples: Sample[];
  isExpanded: boolean;
  onToggle: () => void;
  getValueForSample: (
    sample: Sample,
    sectionTitle: string,
    parameter: string
  ) => string;
  fullAccess: boolean;
  onImageClick: (url: string) => void;
}) {
  return (
    <>
      {sectionTitle && (
        <tr
          className="bg-secondary/70 cursor-pointer hover:bg-secondary transition-colors"
          onClick={onToggle}
        >
          <td
            colSpan={samples.length + 1}
            className="px-4 py-2 text-xs font-semibold text-secondary-foreground"
          >
            <span className="flex items-center gap-1.5">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              {sectionTitle}
            </span>
          </td>
        </tr>
      )}

      {(isExpanded || !sectionTitle) &&
        parameters.map((param, idx) => (
          <tr
            key={`${sectionTitle}-${param}`}
            className={`border-t border-border ${idx % 2 === 0 ? "bg-card" : "bg-secondary/20"
              } hover:bg-primary/5 transition-colors`}
          >
            <td className="px-4 py-2.5 text-xs font-medium text-foreground sticky left-0 bg-inherit z-10 align-middle">
              {param}
            </td>
            {samples.map((s) => {
              const val = getValueForSample(s, sectionTitle, param);
              const isRestricted = !fullAccess && val === "***";

              if (isRestricted) {
                return (
                  <td key={s.id} className="px-4 py-2.5 text-center text-muted-foreground/40 italic align-middle">
                    ***
                  </td>
                );
              }

              // YENİ: Değerin içinde "data:image/" veya "|||" (birden fazla içerik birleşimi) var mı diye kontrol edip bölüyoruz
              if (typeof val === "string" && (val.includes("data:image/") || val.includes("|||"))) {
                const parts = val.split("|||");
                return (
                  <td key={s.id} className="px-4 py-4 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-4">
                      {parts.map((part, i) => {
                        if (part.startsWith("data:image/")) {
                          return (
                            <img
                              key={i}
                              src={part}
                              alt={`Analiz Görseli - ${param}`}
                              onClick={() => onImageClick(part)}
                              className="max-w-[320px] max-h-[240px] w-auto h-auto object-contain rounded-md border border-border/60 shadow-sm cursor-zoom-in hover:shadow-md hover:scale-[1.02] transition-all"
                            />
                          );
                        }
                        // Eğer hücrede fotoğrafla birlikte veya alt alta normal bir metin de varsa
                        return part ? <span key={i} className="text-sm font-medium whitespace-pre-wrap">{part}</span> : null;
                      })}
                    </div>
                  </td>
                );
              }

              return (
                <td key={s.id} className="px-4 py-2.5 text-xs text-center text-foreground align-middle">
                  {val || "-"}
                </td>
              );
            })}
          </tr>
        ))}
    </>
  );
}