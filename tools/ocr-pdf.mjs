import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

const input = process.argv[2] || "math3-1.pdf";
const outputDir = process.argv[3] || "generated-curriculum";
const sample = process.argv.includes("--sample");
const startArg = readNumberArg("--start", 1);
const endArg = readNumberArg("--end", 0);
const scale = readNumberArg("--scale", 1.8);

await fs.mkdir(outputDir, { recursive: true });

const bytes = await fs.readFile(input);
const pdf = await getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false }).promise;
const firstPage = Math.max(1, startArg);
const lastPage = sample ? Math.min(pdf.numPages, firstPage + 7) : (endArg ? Math.min(pdf.numPages, endArg) : pdf.numPages);
const outputText = path.join(outputDir, "curriculum-ocr-readable.txt");
const worker = await createWorker("ara+eng", 1, {
  logger: (event) => {
    if (event.status === "recognizing text") {
      process.stdout.write(` OCR ${Math.round((event.progress || 0) * 100)}%\r`);
    }
  },
});

const pages = [];
try {
  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport }).promise;
    const png = canvas.toBuffer("image/png");
    const result = await worker.recognize(png);
    const text = cleanOcrText(result.data.text);
    pages.push(`صفحة ${pageNumber}\n${text}`);
    await fs.writeFile(outputText, pages.join("\n\n"), "utf8");
    console.log(`page ${pageNumber}/${lastPage}: ${text.length} chars`);
  }
} finally {
  await worker.terminate();
}

console.log(JSON.stringify({
  outputText,
  pageCount: pdf.numPages,
  extractedPages: pages.length,
}, null, 2));

function readNumberArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

function cleanOcrText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}
