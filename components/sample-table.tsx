"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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

  // Collect all unique section titles
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

  // Build value lookup per sample
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
                />
              );
            }
          )}

          {/* Comments row */}
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
}) {
  return (
    <>
      {/* Section header row */}
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

      {/* Data rows */}
      {(isExpanded || !sectionTitle) &&
        parameters.map((param, idx) => (
          <tr
            key={`${sectionTitle}-${param}`}
            className={`border-t border-border ${
              idx % 2 === 0 ? "bg-card" : "bg-secondary/20"
            } hover:bg-primary/5 transition-colors`}
          >
            <td className="px-4 py-2.5 text-xs font-medium text-foreground sticky left-0 bg-inherit z-10">
              {param}
            </td>
            {samples.map((s) => {
              const val = getValueForSample(s, sectionTitle, param);
              const isRestricted = !fullAccess && val === "***";
              return (
                <td
                  key={s.id}
                  className={`px-4 py-2.5 text-xs text-center ${
                    isRestricted
                      ? "text-muted-foreground/40 italic"
                      : "text-foreground"
                  }`}
                >
                  {isRestricted ? "***" : val || "-"}
                </td>
              );
            })}
          </tr>
        ))}
    </>
  );
}
