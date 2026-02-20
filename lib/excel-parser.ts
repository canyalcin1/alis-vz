import ExcelJS from "exceljs";
import type { ParsedExcelResult, SampleSection, AnalysisRow } from "./types";

export async function parseExcelBuffer(buffer: Buffer): Promise<ParsedExcelResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { title: "", samples: [], footnotes: [], analysisTypes: [] };
  }

  const imageMap = new Map<string, string[]>();

  let maxRow = sheet.rowCount;
  let maxCol = sheet.columnCount;

  for (const image of sheet.getImages()) {
    const img = workbook.getImage(image.imageId);
    if (img && img.buffer) {
      const ext = img.extension || "png";
      const base64 = `data:image/${ext};base64,${img.buffer.toString("base64")}`;

      const r = Math.floor(image.range.tl.nativeRow);
      const c = Math.floor(image.range.tl.nativeCol);

      if (r + 1 > maxRow) maxRow = r + 1;
      if (c + 1 > maxCol) maxCol = c + 1;

      const key = `${r},${c}`;
      if (!imageMap.has(key)) {
        imageMap.set(key, []);
      }
      imageMap.get(key)!.push(base64);
    }
  }

  const rawRows: (string | number | null)[][] = [];

  for (let r = 1; r <= maxRow; r++) {
    const row = sheet.getRow(r);
    const rowData: (string | number | null)[] = [];

    for (let c = 1; c <= maxCol; c++) {
      const cell = row.getCell(c);
      let val = cell.value;

      if (val && typeof val === "object") {
        if ("result" in val) {
          val = val.result;
        } else if ("richText" in val && Array.isArray(val.richText)) {
          val = val.richText.map((rt: any) => rt.text).join("");
        }
      }

      let finalVal = val !== null && val !== undefined ? String(val).trim() : "";

      const imgKey = `${r - 1},${c - 1}`;
      if (imageMap.has(imgKey)) {
        const imgs = imageMap.get(imgKey)!.join("|||");
        finalVal = finalVal ? `${finalVal}|||${imgs}` : imgs;
      }

      rowData.push(finalVal || null);
    }
    rawRows.push(rowData);
  }

  if (rawRows.length < 2) {
    return { title: "", samples: [], footnotes: [], analysisTypes: [] };
  }

  let title = "";
  let headerRowIndex = -1;

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    const joined = row
      .filter(Boolean)
      .map((c) => String(c).trim())
      .join(" ");

    if (
      joined.toUpperCase().includes("ANALIZ LABORATUVARI") ||
      joined.toUpperCase().includes("IS ISTEGI YANITI") ||
      joined.toUpperCase().includes("LABORATUVARI")
    ) {
      title = joined;
      continue;
    }

    const nonEmpty = row.filter((c) => c !== null && String(c).trim() !== "");
    if (nonEmpty.length >= 2 && headerRowIndex === -1) {
      const firstCell = String(row[0] || "").trim().toLowerCase();
      if (
        firstCell === "analizler" ||
        firstCell === "analiz" ||
        firstCell === "" ||
        firstCell.includes("analiz")
      ) {
        headerRowIndex = i;
        break;
      }
      if (title && nonEmpty.length >= 2) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    for (let i = 0; i < rawRows.length; i++) {
      const nonEmpty = rawRows[i].filter(
        (c) => c !== null && String(c).trim() !== ""
      );
      if (nonEmpty.length >= 2) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    return { title, samples: [], footnotes: [], analysisTypes: [] };
  }

  const headerRow = rawRows[headerRowIndex];
  const sampleColumns: { index: number; name: string; isComment: boolean }[] = [];

  for (let col = 1; col < headerRow.length; col++) {
    const cellVal = String(headerRow[col] || "").trim();
    if (!cellVal) continue;

    const isComment =
      cellVal.toLowerCase().includes("analiz yorum") ||
      cellVal.toLowerCase().includes("yorum");

    sampleColumns.push({
      index: col,
      name: cellVal,
      isComment,
    });
  }

  const dataRows = rawRows.slice(headerRowIndex + 1);
  const footnotes: string[] = [];
  const analysisTypes: string[] = [];

  const sampleData: Map<
    number,
    {
      name: string;
      isComment: boolean;
      sections: SampleSection[];
      currentSection: SampleSection;
      comment: string | null;
    }
  > = new Map();

  for (const sc of sampleColumns) {
    sampleData.set(sc.index, {
      name: sc.name,
      isComment: sc.isComment,
      sections: [],
      currentSection: { title: "", rows: [] },
      comment: null,
    });
  }

  let lastParameter = "";

  for (const row of dataRows) {
    const firstCell = String(row[0] || "").trim();

    const isRowEmpty = row.every((c) => !c || String(c).trim() === "");
    if (!firstCell && isRowEmpty) {
      continue;
    }

    if (
      firstCell.startsWith("*") ||
      firstCell.toUpperCase().startsWith("NOT:") ||
      firstCell.toUpperCase().startsWith("DIPNOT")
    ) {
      const fullNote = row
        .filter(Boolean)
        .map((c) => String(c).trim())
        .join(" ");
      footnotes.push(fullNote);
      continue;
    }

    const isSectionHeader = isSectionHeaderRow(firstCell, row, sampleColumns);
    if (isSectionHeader) {
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!;
        if (sd.currentSection.rows.length > 0) {
          sd.sections.push({ ...sd.currentSection });
        }
        sd.currentSection = { title: firstCell, rows: [] };
      }
      continue;
    }

    if (firstCell.toUpperCase() === "TOPLAM") {
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!;
        const val = String(row[sc.index] || "").trim();
        sd.currentSection.rows.push({ parameter: "TOPLAM", value: val });
      }
      continue;
    }

    if (
      firstCell.toLowerCase().includes("analiz yorum") ||
      firstCell.toLowerCase() === "yorum"
    ) {
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!;
        const val = String(row[sc.index] || "").trim();
        if (val) {
          sd.comment = val;
        }
      }
      continue;
    }

    // YENİ MANTIK BURADA: 
    if (firstCell) {
      lastParameter = firstCell;
      analysisTypes.push(firstCell);

      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!;
        const val = String(row[sc.index] || "").trim();

        // Aynı başlık zaten listeye eklendiyse yeni satır açma, üstüne ekle (Örn: "FTIR yapı" alt alta 2 kere yazıldıysa)
        const existingRow = sd.currentSection.rows.find((r) => r.parameter === firstCell);

        if (existingRow) {
          if (val) {
            existingRow.value = existingRow.value ? `${existingRow.value}|||${val}` : val;
          }
        } else {
          sd.currentSection.rows.push({
            parameter: firstCell,
            value: val,
          });
        }
      }
    }
    // Sol taraf tamamen boşsa ama önceden analiz başlığı gördüysek, üstüne ekle
    else if (lastParameter) {
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!;
        const val = String(row[sc.index] || "").trim();

        if (val) {
          const existingRow = sd.currentSection.rows.find(r => r.parameter === lastParameter);
          if (existingRow) {
            existingRow.value = existingRow.value ? `${existingRow.value}|||${val}` : val;
          }
        }
      }
    }
  }

  for (const sc of sampleColumns) {
    const sd = sampleData.get(sc.index)!;
    if (sd.currentSection.rows.length > 0) {
      sd.sections.push({ ...sd.currentSection });
    }
  }

  const samples: ParsedExcelResult["samples"] = [];
  for (const sc of sampleColumns) {
    const sd = sampleData.get(sc.index)!;

    if (sd.isComment) {
      continue;
    }

    samples.push({
      name: sd.name,
      sections: sd.sections,
      comment: sd.comment,
    });
  }

  const uniqueAnalysisTypes = [...new Set(analysisTypes)];

  return {
    title: title || "Analiz Raporu",
    samples,
    footnotes,
    analysisTypes: uniqueAnalysisTypes,
  };
}

function isSectionHeaderRow(
  firstCell: string,
  row: (string | number | null)[],
  sampleColumns: { index: number }[]
): boolean {
  const lower = firstCell.toLowerCase();

  if (
    lower.includes("solvent kompozisyon") ||
    lower.includes("kompozisyon") ||
    lower.includes("monomer kompozisyon") ||
    lower.includes("pigment kompozisyon")
  ) {
    const hasData = sampleColumns.some((sc) => {
      const val = String(row[sc.index] || "").trim();
      return val !== "" && val !== "0" && val !== "0.00";
    });
    return !hasData;
  }

  return false;
}