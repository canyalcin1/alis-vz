import * as XLSX from "xlsx"
import type { ParsedExcelResult, SampleSection, AnalysisRow } from "./types"

/**
 * Parse an Excel file buffer and extract structured lab analysis data.
 * Supports multiple formats:
 * - Format A: Samples in columns, analyses in rows with optional section headers
 * - Format B: Samples in columns, mixed analysis types + comments
 * - Format C: Samples in columns, "Analiz Yorum" as row-level comment
 * - Format D: Samples with sub-groups (e.g., hareli/haresiz)
 */
export function parseExcelBuffer(buffer: Buffer): ParsedExcelResult {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to array of arrays (raw rows)
  const rawRows: (string | number | null)[][] = XLSX.utils.sheet_to_json(
    sheet,
    {
      header: 1,
      defval: null,
      blankrows: true,
      raw: false,
    }
  )

  if (rawRows.length < 2) {
    return { title: "", samples: [], footnotes: [], analysisTypes: [] }
  }

  // Step 1: Find title row
  let title = ""
  let headerRowIndex = -1

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i]
    const joined = row
      .filter(Boolean)
      .map((c) => String(c).trim())
      .join(" ")

    if (
      joined.toUpperCase().includes("ANALIZ LABORATUVARI") ||
      joined.toUpperCase().includes("IS ISTEGI YANITI") ||
      joined.toUpperCase().includes("LABORATUVARI")
    ) {
      title = joined
      continue
    }

    // Find the header row: the row that contains sample names in columns
    // It's typically the first row after title that has multiple non-empty cells
    const nonEmpty = row.filter(
      (c) => c !== null && String(c).trim() !== ""
    )
    if (nonEmpty.length >= 2 && headerRowIndex === -1) {
      // Check if first cell looks like an analysis label
      const firstCell = String(row[0] || "").trim().toLowerCase()
      if (
        firstCell === "analizler" ||
        firstCell === "analiz" ||
        firstCell === "" ||
        firstCell.includes("analiz")
      ) {
        headerRowIndex = i
        break
      }
      // Also accept if we already found a title and this has multiple columns
      if (title && nonEmpty.length >= 2) {
        headerRowIndex = i
        break
      }
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: use second non-empty row
    for (let i = 0; i < rawRows.length; i++) {
      const nonEmpty = rawRows[i].filter(
        (c) => c !== null && String(c).trim() !== ""
      )
      if (nonEmpty.length >= 2) {
        headerRowIndex = i
        break
      }
    }
  }

  if (headerRowIndex === -1) {
    return { title, samples: [], footnotes: [], analysisTypes: [] }
  }

  // Step 2: Extract sample names from header row
  const headerRow = rawRows[headerRowIndex]
  const sampleColumns: { index: number; name: string; isComment: boolean }[] =
    []

  for (let col = 1; col < headerRow.length; col++) {
    const cellVal = String(headerRow[col] || "").trim()
    if (!cellVal) continue

    const isComment =
      cellVal.toLowerCase().includes("analiz yorum") ||
      cellVal.toLowerCase().includes("yorum")

    sampleColumns.push({
      index: col,
      name: cellVal,
      isComment,
    })
  }

  // Step 3: Parse data rows
  const dataRows = rawRows.slice(headerRowIndex + 1)
  const footnotes: string[] = []
  const analysisTypes: string[] = []

  // Per-sample data collection
  const sampleData: Map<
    number,
    {
      name: string
      isComment: boolean
      sections: SampleSection[]
      currentSection: SampleSection
      comment: string | null
    }
  > = new Map()

  for (const sc of sampleColumns) {
    sampleData.set(sc.index, {
      name: sc.name,
      isComment: sc.isComment,
      sections: [],
      currentSection: { title: "", rows: [] },
      comment: null,
    })
  }

  for (const row of dataRows) {
    const firstCell = String(row[0] || "").trim()

    // Skip completely empty rows
    if (!firstCell && row.every((c) => !c || String(c).trim() === "")) {
      continue
    }

    // Check for footnotes (starts with * or NOT: or Dipnot)
    if (
      firstCell.startsWith("*") ||
      firstCell.toUpperCase().startsWith("NOT:") ||
      firstCell.toUpperCase().startsWith("DIPNOT")
    ) {
      const fullNote = row
        .filter(Boolean)
        .map((c) => String(c).trim())
        .join(" ")
      footnotes.push(fullNote)
      continue
    }

    // Check for section headers (e.g., "Solvent Kompozisyonu (%)")
    const isSectionHeader = isSectionHeaderRow(firstCell, row, sampleColumns)
    if (isSectionHeader) {
      // Finalize current section and start new one
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!
        if (sd.currentSection.rows.length > 0) {
          sd.sections.push({ ...sd.currentSection })
        }
        sd.currentSection = { title: firstCell, rows: [] }
      }
      continue
    }

    // Check for "TOPLAM" row
    if (firstCell.toUpperCase() === "TOPLAM") {
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!
        const val = String(row[sc.index] || "").trim()
        sd.currentSection.rows.push({ parameter: "TOPLAM", value: val })
      }
      continue
    }

    // Check if this is "Analiz Yorum" row
    if (
      firstCell.toLowerCase().includes("analiz yorum") ||
      firstCell.toLowerCase() === "yorum"
    ) {
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!
        const val = String(row[sc.index] || "").trim()
        if (val) {
          sd.comment = val
        }
      }
      continue
    }

    // Regular data row
    if (firstCell) {
      analysisTypes.push(firstCell)
      for (const sc of sampleColumns) {
        const sd = sampleData.get(sc.index)!
        const val = String(row[sc.index] || "").trim()
        const analysisRow: AnalysisRow = {
          parameter: firstCell,
          value: val,
        }
        sd.currentSection.rows.push(analysisRow)
      }
    }
  }

  // Finalize last sections
  for (const sc of sampleColumns) {
    const sd = sampleData.get(sc.index)!
    if (sd.currentSection.rows.length > 0) {
      sd.sections.push({ ...sd.currentSection })
    }
  }

  // Build samples (exclude comment-only columns)
  const samples: ParsedExcelResult["samples"] = []
  for (const sc of sampleColumns) {
    const sd = sampleData.get(sc.index)!

    if (sd.isComment) {
      // This column is a comment column; distribute its values
      // as comments to any prior sample that doesn't have one
      continue
    }

    samples.push({
      name: sd.name,
      sections: sd.sections,
      comment: sd.comment,
    })
  }

  // Deduplicate analysis types
  const uniqueAnalysisTypes = [...new Set(analysisTypes)]

  return {
    title: title || "Analiz Raporu",
    samples,
    footnotes,
    analysisTypes: uniqueAnalysisTypes,
  }
}

function isSectionHeaderRow(
  firstCell: string,
  row: (string | number | null)[],
  sampleColumns: { index: number }[]
): boolean {
  const lower = firstCell.toLowerCase()

  // Common section headers
  if (
    lower.includes("solvent kompozisyon") ||
    lower.includes("kompozisyon") ||
    lower.includes("monomer kompozisyon") ||
    lower.includes("pigment kompozisyon")
  ) {
    // Check if data columns are mostly empty for this row
    const hasData = sampleColumns.some((sc) => {
      const val = String(row[sc.index] || "").trim()
      return val !== "" && val !== "0" && val !== "0.00"
    })
    return !hasData
  }

  return false
}
