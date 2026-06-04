import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

import type { DocumentInput, ExtractedDocumentText } from "./types";

export function extractTextFromTxt(
  buffer: Buffer,
  input: DocumentInput,
): ExtractedDocumentText {
  return {
    text: buffer.toString("utf8"),
    pages: undefined,
    metadata: {
      fileName: input.fileName,
      fileType: "txt",
      mimeType: input.mimeType,
    },
  };
}

export async function extractDocumentText(
  buffer: Buffer,
  input: DocumentInput,
): Promise<ExtractedDocumentText> {
  if (isTxt(input)) {
    return extractTextFromTxt(buffer, input);
  }

  if (isPdf(input)) {
    return extractTextFromPdf(buffer, input);
  }

  throw new Error(`Unsupported document type for ${input.fileName}`);
}

export async function extractTextFromPdf(
  buffer: Buffer,
  input: DocumentInput,
): Promise<ExtractedDocumentText> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return {
      text: result.text,
      pages: result.pages.map((page, index) => ({
        page_number: index + 1,
        text: page.text,
      })),
      metadata: {
        fileName: input.fileName,
        fileType: "pdf",
        mimeType: input.mimeType,
      },
    };
  } finally {
    await parser.destroy();
  }
}

function isTxt(input: DocumentInput) {
  return (
    input.mimeType === "text/plain" || input.fileName.toLowerCase().endsWith(".txt")
  );
}

function isPdf(input: DocumentInput) {
  return (
    input.mimeType === "application/pdf" ||
    input.fileName.toLowerCase().endsWith(".pdf")
  );
}
