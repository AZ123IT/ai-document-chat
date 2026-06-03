import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  extractDocumentText,
  extractTextFromPdf,
  extractTextFromTxt,
} from "./extract-text";

const fixturePath = join(process.cwd(), "src/test/fixtures/sample.txt");

describe("extractTextFromTxt", () => {
  it("extracts UTF-8 text from a TXT buffer", async () => {
    const buffer = await readFile(fixturePath);

    const result = extractTextFromTxt(buffer, {
      fileName: "sample.txt",
      mimeType: "text/plain",
    });

    expect(result).toEqual({
      text: expect.stringContaining("Project Atlas Notes"),
      pages: undefined,
      metadata: {
        fileName: "sample.txt",
        fileType: "txt",
        mimeType: "text/plain",
      },
    });
  });
});

describe("extractDocumentText", () => {
  it("routes TXT files to the TXT extractor", async () => {
    const buffer = await readFile(fixturePath);

    const result = await extractDocumentText(buffer, {
      fileName: "sample.txt",
      mimeType: "text/plain",
    });

    expect(result.text).toContain("source citations");
    expect(result.metadata.fileType).toBe("txt");
  });

  it("rejects unsupported file types", async () => {
    await expect(
      extractDocumentText(Buffer.from("hello"), {
        fileName: "sample.md",
        mimeType: "text/markdown",
      }),
    ).rejects.toThrow("Unsupported document type");
  });
});

describe("extractTextFromPdf", () => {
  it("extracts PDF text and page metadata from a PDF buffer", async () => {
    const result = await extractTextFromPdf(makeSinglePagePdf("Portfolio PDF Text"), {
      fileName: "portfolio.pdf",
      mimeType: "application/pdf",
    });

    expect(result.text).toContain("Portfolio PDF Text");
    expect(result.pages).toEqual([
      {
        page_number: 1,
        text: "Portfolio PDF Text",
      },
    ]);
    expect(result.metadata).toEqual({
      fileName: "portfolio.pdf",
      fileType: "pdf",
      mimeType: "application/pdf",
    });
  });

  it("routes PDF files to the PDF extractor", async () => {
    const result = await extractDocumentText(makeSinglePagePdf("PDF routing works"), {
      fileName: "routing.pdf",
      mimeType: "application/pdf",
    });

    expect(result.text).toContain("PDF routing works");
    expect(result.metadata.fileType).toBe("pdf");
  });
});

function makeSinglePagePdf(text: string) {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  const escapedText = text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const stream = `BT\n/F1 12 Tf\n72 720 Td\n(${escapedText}) Tj\nET`;
  objects.push(
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream\nendobj\n`,
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "ascii");
}
