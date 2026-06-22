import fs from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const input = process.argv[2] || "math3-1.pdf";
const outputDir = process.argv[3] || "generated-curriculum";
const mode = process.argv.includes("--sample") ? "sample" : "full";
const textInputIndex = process.argv.indexOf("--text-input");
const textInput = textInputIndex >= 0 ? process.argv[textInputIndex + 1] : "";

const arabicNumberWords = new Map([
  ["الأول", 1],
  ["الاول", 1],
  ["الثاني", 2],
  ["الثالث", 3],
  ["الرابع", 4],
  ["الخامس", 5],
  ["السادس", 6],
  ["السابع", 7],
  ["الثامن", 8],
  ["التاسع", 9],
  ["العاشر", 10],
]);

const stopWords = new Set([
  "على", "إلى", "الى", "عن", "من", "في", "هو", "هي", "هذا", "هذه", "ذلك", "تلك", "التي", "الذي",
  "كما", "عند", "بين", "بعد", "قبل", "كل", "مع", "أو", "وهي", "وهو", "كان", "كانت", "يكون",
  "يمكن", "إذا", "ثم", "أمام", "خلال", "ضمن", "كتاب", "طالب", "الفصل", "الدرس", "صفحة",
]);

await fs.mkdir(outputDir, { recursive: true });

let pdf = null;
let pages = [];
let maxPages = 0;
let pageCount = 0;

if (textInput) {
  const source = await fs.readFile(textInput, "utf8");
  pages = parsePageText(source);
  maxPages = pages.length;
  pageCount = pages.length;
} else {
  const bytes = await fs.readFile(input);
  pdf = await getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false }).promise;
  pageCount = pdf.numPages;
  maxPages = mode === "sample" ? Math.min(pdf.numPages, 8) : pdf.numPages;

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const text = itemsToLines(content.items);
    pages.push({ page: pageNumber, text });
    console.log(`page ${pageNumber}/${maxPages}: ${text.length} chars`);
  }
}

const readableText = pages.map((page) => `صفحة ${page.page}\n${page.text}`).join("\n\n");
await fs.writeFile(path.join(outputDir, "curriculum-readable.txt"), readableText, "utf8");

const chapters = splitCurriculum(pages);
const questionFiles = [];

for (const [index, chapter] of chapters.entries()) {
  const questions = generateQuestions(chapter);
  const slug = `chapter-${String(index + 1).padStart(2, "0")}`;
  const payload = {
    id: slug,
    title: chapter.title,
    pageStart: chapter.pageStart,
    pageEnd: chapter.pageEnd,
    lessonCount: chapter.lessons.length,
    questions,
  };
  const jsonFile = path.join(outputDir, `${slug}-questions.json`);
  const mdFile = path.join(outputDir, `${slug}-questions.md`);
  await fs.writeFile(jsonFile, JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(mdFile, questionsToMarkdown(payload), "utf8");
  questionFiles.push({ jsonFile, mdFile, questions: questions.length });
}

await fs.writeFile(path.join(outputDir, "curriculum-structured.json"), JSON.stringify({
  source: input,
  pageCount,
  extractedPages: maxPages,
  chapters,
  questionFiles,
}, null, 2), "utf8");

console.log(JSON.stringify({
  outputDir,
  pageCount,
  extractedPages: maxPages,
  chapters: chapters.length,
  questions: questionFiles.reduce((sum, file) => sum + file.questions, 0),
}, null, 2));

function itemsToLines(items) {
  const rows = [];
  const tolerance = 4;

  for (const item of items) {
    const text = String(item.str || "").trim();
    if (!text) continue;
    const transform = item.transform || [0, 0, 0, 0, 0, 0];
    const y = Math.round(transform[5] / tolerance) * tolerance;
    let row = rows.find((entry) => Math.abs(entry.y - y) <= tolerance);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x: transform[4], text });
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => row.parts.sort((a, b) => b.x - a.x).map((part) => part.text).join(" "))
    .map(cleanLine)
    .filter(Boolean)
    .join("\n");
}

function parsePageText(source) {
  const blocks = source.split(/(?=^صفحة\s+\d+)/gm).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    const match = block.match(/^صفحة\s+(\d+)/);
    return {
      page: match ? Number(match[1]) : index + 1,
      text: block.replace(/^صفحة\s+\d+\s*/, "").trim(),
    };
  });
}

function cleanLine(line) {
  return line
    .replace(/\s+/g, " ")
    .replace(/[ـ]+/g, "")
    .replace(/\b\d+\b\s*$/, "")
    .trim();
}

function splitCurriculum(pages) {
  const lines = pages.flatMap((page) => page.text.split("\n").map((line) => ({
    page: page.page,
    text: line.trim(),
  }))).filter((line) => line.text.length > 1);

  const chapterStarts = [];
  let lastChapterNumber = 0;
  lines.forEach((line, index) => {
    const chapter = parseChapterHeading(line.text);
    if (chapter && chapter.number > lastChapterNumber) {
      chapterStarts.push({ index, page: line.page, title: chapter.title, number: chapter.number });
      lastChapterNumber = chapter.number;
    }
  });

  if (!chapterStarts.length) {
    chapterStarts.push({ index: 0, page: lines[0]?.page || 1, title: "الفصل الأول" });
  }

  return chapterStarts.map((start, chapterIndex) => {
    const next = chapterStarts[chapterIndex + 1];
    const chunk = lines.slice(start.index, next ? next.index : lines.length);
    const body = chunk.map((line) => line.text).join("\n");
    const lessons = splitLessons(chunk, chapterIndex + 1);
    return {
      title: start.title,
      pageStart: start.page,
      pageEnd: chunk.at(-1)?.page || start.page,
      text: body,
      keywords: extractKeywords(body).slice(0, 14),
      lessons,
    };
  }).filter((chapter) => chapter.text.length > 80);
}

function parseChapterHeading(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/الفصل\s+(الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|\d+)\s*[:؛،-]?\s*([^|٠-٩0-9]*)/);
  if (!match || normalized.length > 130) {
    return null;
  }
  const number = arabicNumberWords.get(match[1]) || Number(match[1]) || 0;
  if (!number) return null;
  const topic = cleanLine(match[2] || "").replace(/[^\u0600-\u06FFa-zA-Z ]/g, " ").replace(/\s+/g, " ").trim();
  return {
    number,
    title: normalizeHeading(`الفصل ${match[1]}${topic ? `: ${topic}` : ""}`),
  };
}

function normalizeHeading(text) {
  return text.replace(/\s+/g, " ").replace(/[:：]$/, "").trim();
}

function splitLessons(lines, chapterNumber) {
  const starts = [];
  lines.forEach((line, index) => {
    if (isLessonHeading(line.text)) {
      starts.push({ index, page: line.page, title: normalizeHeading(line.text) });
    }
  });

  if (!starts.length) {
    return [{ title: `محتوى الفصل ${chapterNumber}`, pageStart: lines[0]?.page || 1, text: lines.map((line) => line.text).join("\n") }];
  }

  return starts.map((start, index) => {
    const next = starts[index + 1];
    const chunk = lines.slice(start.index, next ? next.index : lines.length);
    return {
      title: start.title,
      pageStart: start.page,
      pageEnd: chunk.at(-1)?.page || start.page,
      text: chunk.map((line) => line.text).join("\n"),
    };
  }).filter((lesson) => lesson.text.length > 40);
}

function isLessonHeading(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return /^(الدرس|درس)\s+(\d+|الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر)/.test(normalized)
    || /^\d+[-–]\d+\s+/.test(normalized);
}

function generateQuestions(chapter) {
  const questions = [];
  const keywords = chapter.keywords.length ? chapter.keywords : extractKeywords(chapter.text).slice(0, 10);
  const lessons = chapter.lessons.length ? chapter.lessons : [{ title: chapter.title, text: chapter.text }];

  for (const lesson of lessons) {
    const facts = extractFacts(lesson.text);
    const lessonKeywords = extractKeywords(lesson.text).slice(0, 8);
    const pool = lessonKeywords.length ? lessonKeywords : keywords;

    for (const [index, fact] of facts.slice(0, 6).entries()) {
      const answer = pool.find((word) => fact.includes(word)) || pool[index % Math.max(pool.length, 1)] || "المفهوم الرئيسي";
      questions.push({
        type: "اختيار من متعدد",
        lesson: lesson.title,
        question: `أكمل العبارة: ${fact.replace(answer, "_____")}`,
        options: unique([answer, ...pool.filter((word) => word !== answer).slice(0, 3), ...keywords.slice(0, 3)]).slice(0, 4),
        answer,
        source: fact,
      });
    }

    for (const fact of facts.slice(0, 4)) {
      questions.push({
        type: "صح وخطأ",
        lesson: lesson.title,
        question: fact,
        options: ["صح", "خطأ"],
        answer: "صح",
        source: fact,
      });
    }

    for (const keyword of pool.slice(0, 3)) {
      const source = facts.find((fact) => fact.includes(keyword)) || lesson.text.split("\n").find((line) => line.includes(keyword)) || lesson.text.slice(0, 180);
      questions.push({
        type: "بطاقة مراجعة",
        lesson: lesson.title,
        question: `اشرح/ي باختصار: ${keyword}`,
        answer: source,
        source,
      });
    }
  }

  return questions.map((question, index) => ({
    id: `${slugify(chapter.title)}-${index + 1}`,
    chapterTitle: chapter.title,
    ...question,
  }));
}

function extractFacts(text) {
  const lines = text.split(/\n+/).map(cleanLine).filter((line) => {
    if (line.length < 10 || line.length > 220) return false;
    if (/^[\d\s+\-*/=().,]+$/.test(line)) return false;
    if (/^(صفحة|الفصل|الدرس|تدرب|تحقق|مثال|الحل)$/.test(line)) return false;
    return /[\u0600-\u06FFa-zA-Z]/.test(line);
  });

  const joined = lines.join(" ");
  const sentences = joined.split(/(?<=[.؟!؛])\s+/).map(cleanLine).filter((line) => line.length > 25 && line.length < 240);
  return unique([...sentences, ...lines]).slice(0, 30);
}

function extractKeywords(text) {
  const words = text
    .replace(/[^\u0600-\u06FFa-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^(ال|و|ف|ب|ك|ل)/, "").trim())
    .filter((word) => word.length > 3 && !stopWords.has(word));

  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word]) => word);
}

function questionsToMarkdown(chapter) {
  return [
    `# ${chapter.title}`,
    "",
    `الصفحات: ${chapter.pageStart} - ${chapter.pageEnd}`,
    `عدد الدروس: ${chapter.lessonCount}`,
    `عدد الأسئلة: ${chapter.questions.length}`,
    "",
    ...chapter.questions.map((question, index) => [
      `## ${index + 1}. ${question.type}`,
      `الدرس: ${question.lesson}`,
      "",
      question.question,
      "",
      question.options ? question.options.map((option) => `- ${option}`).join("\n") : "",
      "",
      `الإجابة: ${question.answer}`,
      "",
      `المصدر: ${question.source}`,
      "",
    ].join("\n")),
  ].join("\n");
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function slugify(value) {
  return value
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "chapter";
}
