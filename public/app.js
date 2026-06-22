const sampleText = `الفصل الأول: الخلية ووظائفها
الخلية هي الوحدة الأساسية في بناء الكائنات الحية. تحتوي الخلية على غشاء خلوي ينظم دخول المواد وخروجها. النواة تحمل المادة الوراثية وتتحكم في معظم أنشطة الخلية. السيتوبلازم وسط هلامي تحدث فيه تفاعلات حيوية مهمة.

الفصل الثاني: الطاقة في الأنظمة البيئية
تبدأ الطاقة في معظم الأنظمة البيئية من الشمس. تستخدم النباتات البناء الضوئي لصنع الغذاء. تنتقل الطاقة من المنتجات إلى المستهلكات عبر السلاسل الغذائية. يقل مقدار الطاقة المتاحة كلما انتقلنا إلى مستوى غذائي أعلى.

الفصل الثالث: التغيرات الكيميائية
التغير الكيميائي ينتج مادة جديدة بخصائص مختلفة. من علامات حدوث التفاعل تغير اللون أو انطلاق غاز أو تكون راسب. حفظ الكتلة يعني أن كتلة المواد المتفاعلة تساوي كتلة المواد الناتجة في نظام مغلق.`;

const state = {
  chapters: [],
  questions: [],
  quiz: [],
  quizIndex: 0,
  score: 0,
  answered: new Map(),
};

const panels = document.querySelectorAll(".panel");
const navItems = document.querySelectorAll(".nav-item");
const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const syllabusText = document.querySelector("#syllabusText");
const generateButton = document.querySelector("#generateButton");
const loadMathButton = document.querySelector("#loadMathButton");
const sampleButton = document.querySelector("#sampleButton");
const resetButton = document.querySelector("#resetButton");
const chapterCount = document.querySelector("#chapterCount");
const questionCount = document.querySelector("#questionCount");
const chapterList = document.querySelector("#chapterList");
const chapterFilter = document.querySelector("#chapterFilter");
const quizChapter = document.querySelector("#quizChapter");
const quizSize = document.querySelector("#quizSize");
const quizSizeOutput = document.querySelector("#quizSizeOutput");
const startQuiz = document.querySelector("#startQuiz");
const quizProgress = document.querySelector("#quizProgress");
const quizScore = document.querySelector("#quizScore");
const quizQuestion = document.querySelector("#quizQuestion");
const answers = document.querySelector("#answers");
const prevQuestion = document.querySelector("#prevQuestion");
const nextQuestion = document.querySelector("#nextQuestion");
const questionBank = document.querySelector("#questionBank");
const bankChapter = document.querySelector("#bankChapter");
const exportButton = document.querySelector("#exportButton");
const extractionPanel = document.querySelector("#extractionPanel");
const extractionTitle = document.querySelector("#extractionTitle");
const ocrButton = document.querySelector("#ocrButton");
const pageTotal = document.querySelector("#pageTotal");
const charTotal = document.querySelector("#charTotal");
const qualityLabel = document.querySelector("#qualityLabel");
const extractProgress = document.querySelector("#extractProgress");
const extractedPreview = document.querySelector("#extractedPreview");

const aiStatus = document.querySelector("#aiStatus");

let lastPdfFile = null;

navItems.forEach((item) => {
  item.addEventListener("click", () => showPanel(item.dataset.panel));
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  const [file] = event.dataTransfer.files;
  if (file) readFile(file);
});

fileInput.addEventListener("change", () => {
  const [file] = fileInput.files;
  if (file) readFile(file);
});

generateButton.addEventListener("click", async () => {
  await buildStudySet(syllabusText.value);
});
loadMathButton.addEventListener("click", loadBundledMathCurriculum);
sampleButton.addEventListener("click", async () => {
  syllabusText.value = sampleText;
  await buildStudySet(sampleText);
});

resetButton.addEventListener("click", () => {
  state.chapters = [];
  state.questions = [];
  state.quiz = [];
  state.quizIndex = 0;
  state.score = 0;
  state.answered.clear();
  syllabusText.value = "";
  lastPdfFile = null;
  extractionPanel.hidden = true;
  extractProgress.value = 0;
  extractedPreview.value = "";
  renderAll();
  showPanel("uploadPanel");
});

chapterFilter.addEventListener("change", renderChapters);
bankChapter.addEventListener("change", renderBank);
quizSize.addEventListener("input", () => {
  quizSizeOutput.textContent = quizSize.value;
});
startQuiz.addEventListener("click", createQuiz);
prevQuestion.addEventListener("click", () => moveQuestion(-1));
nextQuestion.addEventListener("click", () => moveQuestion(1));
exportButton.addEventListener("click", exportQuestions);
ocrButton.addEventListener("click", () => {
  if (lastPdfFile) readPdf(lastPdfFile, { forceOcr: true });
});

function showPanel(panelId) {
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.panel === panelId));
}

function readFile(file) {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    lastPdfFile = file;
    readPdf(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const content = String(reader.result || "");
    if (file.name.toLowerCase().endsWith(".json") && tryLoadQuestionBank(content)) {
      return;
    }
    syllabusText.value = content;
    await buildStudySet(syllabusText.value);
  };
  reader.readAsText(file, "utf-8");
}

async function loadBundledMathCurriculum() {
  try {
    const response = await fetch("data/math3-clean-question-bank.json");
    if (!response.ok) {
      throw new Error("LOAD_FAILED");
    }
    const content = await response.text();
    if (!tryLoadQuestionBank(content)) {
      throw new Error("INVALID_BANK");
    }
  } catch {
    renderEmpty("تعذر تحميل ملف الرياضيات تلقائيًا. افتح التطبيق عبر خادم محلي أو ارفع الملف من مجلد data يدويًا.");
    showPanel("chaptersPanel");
  }
}

function tryLoadQuestionBank(content) {
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data.questions) || !data.questions.length) {
      return false;
    }

    const chapters = Array.isArray(data.chapters) && data.chapters.length
      ? data.chapters
      : makeChaptersFromQuestions(data.questions);

    state.chapters = chapters.map((chapter, index) => ({
      id: chapter.id || `chapter-${index + 1}`,
      title: chapter.title || chapter.chapterTitle || `الفصل ${index + 1}`,
      body: chapter.body || "",
      sentences: chapter.sentences || [],
      keywords: chapter.keywords || [],
    }));
    state.questions = data.questions.map((question, index) => ({
      id: question.id || `imported-question-${index + 1}`,
      chapterId: question.chapterId || state.chapters[0]?.id || "chapter-1",
      chapterTitle: question.chapterTitle || state.chapters.find((chapter) => chapter.id === question.chapterId)?.title || "الفصل",
      type: question.type || "اختيار من متعدد",
      prompt: question.prompt || question.question || "",
      answer: String(question.answer || ""),
      options: Array.isArray(question.options) && question.options.length ? question.options.map(String) : [String(question.answer || "")],
      source: question.source || question.lesson || "",
    }));
    state.quiz = [];
    state.quizIndex = 0;
    state.score = 0;
    state.answered.clear();
    syllabusText.value = `تم تحميل بنك أسئلة جاهز: ${data.title || "بدون عنوان"}\nعدد الفصول: ${state.chapters.length}\nعدد الأسئلة: ${state.questions.length}`;
    renderAll();
    showPanel("chaptersPanel");
    return true;
  } catch {
    return false;
  }
}

function makeChaptersFromQuestions(questions) {
  const chapters = new Map();
  questions.forEach((question) => {
    const id = question.chapterId || question.chapterTitle || "chapter-1";
    if (!chapters.has(id)) {
      chapters.set(id, {
        id,
        title: question.chapterTitle || "الفصل",
        body: "",
        sentences: [],
        keywords: [],
      });
    }
  });
  return [...chapters.values()];
}

async function readPdf(file, options = {}) {
  try {
    if (!window.pdfjsLib) {
      throw new Error("PDF_READER_UNAVAILABLE");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    setExtractionStatus("جاري قراءة ملف PDF...", 3);
    dropZone.querySelector("strong").textContent = "جاري قراءة ملف PDF...";

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = textItemsToLines(content.items);
      pages.push(`صفحة ${pageNumber}\n${pageText}`);
      setExtractionStatus(`استخراج النص من الصفحة ${pageNumber} من ${pdf.numPages}`, 5 + (pageNumber / pdf.numPages) * 35);
    }

    let extractedText = pages.join("\n\n").trim();
    let quality = assessTextQuality(extractedText);
    renderExtractionDiagnostics({
      title: quality.isGood ? "تم استخراج النص من PDF" : "النص المستخرج ضعيف",
      pageCount: pdf.numPages,
      text: extractedText,
      quality,
      progress: 45,
      allowOcr: true,
    });

    if ((options.forceOcr || !quality.isGood) && window.Tesseract) {
      const ocrText = await extractPdfWithOcr(pdf);
      const ocrQuality = assessTextQuality(ocrText);
      if (ocrQuality.score >= quality.score || options.forceOcr) {
        extractedText = ocrText;
        quality = ocrQuality;
      }
    }

    if (!extractedText) {
      throw new Error("EMPTY_PDF_TEXT");
    }

    renderExtractionDiagnostics({
      title: quality.isGood ? "جاهز لتوليد الأسئلة" : "تم استخراج نص محدود",
      pageCount: pdf.numPages,
      text: extractedText,
      quality,
      progress: 100,
      allowOcr: true,
    });
    syllabusText.value = extractedText;
    await buildStudySet(extractedText);
  } catch (error) {
    const message = getPdfErrorMessage(error);
    setExtractionStatus(message, 100);
    renderEmpty(message);
    showPanel("chaptersPanel");
  } finally {
    dropZone.querySelector("strong").textContent = "اسحب ملف المنهج هنا";
  }
}

function textItemsToLines(items) {
  const rows = [];
  const tolerance = 4;

  items.forEach((item) => {
    const text = String(item.str || "").trim();
    if (!text) return;

    const y = Math.round(item.transform[5] / tolerance) * tolerance;
    let row = rows.find((entry) => Math.abs(entry.y - y) <= tolerance);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x: item.transform[4], text });
  });

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => row.parts.sort((a, b) => b.x - a.x).map((part) => part.text).join(" "))
    .join("\n");
}

async function extractPdfWithOcr(pdf) {
  if (!window.Tesseract) {
    throw new Error("OCR_READER_UNAVAILABLE");
  }

  const texts = [];
  const pageLimit = Math.min(pdf.numPages, 40);

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    setExtractionStatus(`OCR للصفحة ${pageNumber} من ${pageLimit}`, 45 + (pageNumber / pageLimit) * 50);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.7 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;

    const result = await Tesseract.recognize(canvas, "ara+eng", {
      logger: (event) => {
        if (event.status === "recognizing text") {
          const pageProgress = event.progress || 0;
          const totalProgress = 45 + ((pageNumber - 1 + pageProgress) / pageLimit) * 50;
          setExtractionStatus(`OCR للصفحة ${pageNumber} من ${pageLimit}`, totalProgress);
        }
      },
    });
    texts.push(`صفحة ${pageNumber}\n${result.data.text}`);
  }

  if (pdf.numPages > pageLimit) {
    texts.push(`تنبيه: تم تشغيل OCR على أول ${pageLimit} صفحة فقط لتجنب بطء المتصفح. يمكن تقسيم الملف أو استخدام PDF نصي كامل.`);
  }

  return texts.join("\n\n").trim();
}

function assessTextQuality(text) {
  const clean = normalizeText(text);
  const arabicChars = (clean.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (clean.match(/[a-zA-Z]/g) || []).length;
  const words = clean.split(/\s+/).filter((word) => word.length > 2).length;
  const score = Math.min(100, Math.round((clean.length / 12) + arabicChars / 10 + words / 2));
  return {
    score,
    isGood: clean.length > 500 && words > 80 && (arabicChars > 100 || latinChars > 100),
    label: score >= 75 ? "ممتازة" : score >= 45 ? "متوسطة" : "ضعيفة",
  };
}

function renderExtractionDiagnostics({ title, pageCount, text, quality, progress, allowOcr }) {
  extractionPanel.hidden = false;
  extractionTitle.textContent = title;
  pageTotal.textContent = pageCount;
  charTotal.textContent = normalizeText(text).length;
  qualityLabel.textContent = quality.label;
  extractProgress.value = Math.max(0, Math.min(100, progress));
  extractedPreview.value = text.slice(0, 5000);
  ocrButton.hidden = !allowOcr;
}

function setExtractionStatus(message, progress) {
  extractionPanel.hidden = false;
  extractionTitle.textContent = message;
  extractProgress.value = Math.max(0, Math.min(100, progress));
}

function getPdfErrorMessage(error) {
  if (error.message === "PDF_READER_UNAVAILABLE") {
    return "تعذر تحميل قارئ PDF. تأكد من اتصال الإنترنت أو استخدم ملفًا نصيًا.";
  }
  if (error.message === "OCR_READER_UNAVAILABLE") {
    return "تعذر تحميل OCR. تأكد من اتصال الإنترنت ثم أعد المحاولة.";
  }
  return "لم أستطع استخراج نص كافٍ من هذا PDF. قد يكون الملف مصورًا أو محميًا.";
}

async function buildStudySet(rawText) {
  const cleaned = normalizeText(rawText);
  if (!cleaned) {
    renderEmpty("أضف محتوى المنهج أولًا.");
    return;
  }

  const chapters = splitChapters(cleaned);
  setAIStatus('جاري توليد الأسئلة بالذكاء الاصطناعي...', 'loading');
  generateButton.disabled = true;
  generateButton.textContent = 'جاري التوليد...';

  let questions = null;
  try {
    questions = await generateQuestionsWithAI(chapters);
  } catch {
    questions = null;
  }

  if (questions && questions.length) {
    setAIStatus(`تم توليد ${questions.length} سؤالًا بالذكاء الاصطناعي`, 'success');
  } else {
    questions = chapters.flatMap((chapter) => generateQuestions(chapter));
    setAIStatus('تم التوليد التلقائي — شغّل الخادم وأضف مفتاح API للحصول على أسئلة أذكى', 'warning');
  }

  generateButton.disabled = false;
  generateButton.textContent = 'توليد بنك الأسئلة';

  state.chapters = chapters;
  state.questions = questions;
  state.quiz = [];
  state.quizIndex = 0;
  state.score = 0;
  state.answered.clear();
  renderAll();
  showPanel("chaptersPanel");
}

async function generateQuestionsWithAI(chapters) {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapters }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (err.error === 'API_KEY_MISSING') return null;
    throw new Error(err.error ?? 'SERVER_ERROR');
  }

  const data = await response.json();
  return Array.isArray(data.questions) && data.questions.length ? data.questions : null;
}

function setAIStatus(message, type = '') {
  aiStatus.hidden = false;
  aiStatus.textContent = message;
  aiStatus.className = `ai-status${type ? ` ai-status--${type}` : ''}`;
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitChapters(text) {
  const chapterPattern = /(?=(?:^|\n)\s*(?:الفصل|الوحدة|الباب|الدرس|Chapter|Unit|Lesson)\s+[^:\n]*[:：]?)/gi;
  const parts = text.split(chapterPattern).map((part) => part.trim()).filter(Boolean);
  const sourceParts = parts.length > 1 ? parts : splitByParagraphs(text);

  return sourceParts.map((part, index) => {
    const lines = part.split("\n").map((line) => line.trim()).filter(Boolean);
    const titleCandidate = lines[0] || `الفصل ${index + 1}`;
    const title = titleCandidate.length < 90 ? titleCandidate.replace(/[:：]$/, "") : `الفصل ${index + 1}`;
    const body = titleCandidate === title || titleCandidate.replace(/[:：]$/, "") === title ? lines.slice(1).join(" ") : part;
    const sentences = getSentences(body || part);
    return {
      id: `chapter-${index + 1}`,
      title,
      body: body || part,
      sentences,
      keywords: extractKeywords(body || part).slice(0, 8),
    };
  });
}

function splitByParagraphs(text) {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const usefulParagraphs = paragraphs.filter((part) => part.length > 80);
  if (usefulParagraphs.length > 1) return usefulParagraphs;

  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 10);
  if (lines.length < 18) return [text];

  const chunkSize = 28;
  const chunks = [];
  for (let index = 0; index < lines.length; index += chunkSize) {
    chunks.push(`جزء ${Math.floor(index / chunkSize) + 1}\n${lines.slice(index, index + chunkSize).join("\n")}`);
  }
  return chunks;
}

function getSentences(text) {
  const sentenceCandidates = normalizeText(text)
    .split(/(?<=[.؟!؛])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 14);

  if (sentenceCandidates.length) return sentenceCandidates;

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 8);
}

function extractKeywords(text) {
  const stopWords = new Set(["على", "إلى", "الى", "عن", "من", "في", "هو", "هي", "هذا", "هذه", "ذلك", "تلك", "التي", "الذي", "كما", "عند", "بين", "بعد", "قبل", "كل", "مع", "أو", "وهي", "وهو"]);
  const words = normalizeText(text)
    .replace(/[^\u0600-\u06FFa-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^(ال|و|ف|ب|ك|ل)/, "").trim())
    .filter((word) => word.length > 3 && !stopWords.has(word));

  const counts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function generateQuestions(chapter) {
  const questions = [];
  const sentences = chapter.sentences.length ? chapter.sentences : getSentences(chapter.body);
  const keywords = chapter.keywords.length ? chapter.keywords : extractKeywords(chapter.body);
  const studyItems = sentences.length ? sentences : makeStudyItems(chapter.body);

  studyItems.slice(0, 7).forEach((sentence, index) => {
    const answer = findAnswerTerm(sentence, keywords) || keywords[index % Math.max(keywords.length, 1)] || "المفهوم الرئيسي";
    questions.push({
      id: `${chapter.id}-mcq-${index}`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      type: "اختيار من متعدد",
      prompt: makeCloze(sentence, answer),
      answer,
      options: shuffle([answer, ...makeDistractors(answer, keywords)]).slice(0, 4),
      source: sentence,
    });
  });

  studyItems.slice(0, 5).forEach((sentence, index) => {
    questions.push({
      id: `${chapter.id}-tf-${index}`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      type: "صح وخطأ",
      prompt: sentence,
      answer: "صح",
      options: ["صح", "خطأ"],
      source: sentence,
    });
  });

  keywords.slice(0, 3).forEach((keyword, index) => {
    const source = studyItems.find((sentence) => sentence.includes(keyword)) || studyItems[index] || chapter.body;
    questions.push({
      id: `${chapter.id}-card-${index}`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      type: "بطاقة مراجعة",
      prompt: `ما المقصود بـ "${keyword}" حسب هذا الفصل؟`,
      answer: source,
      options: [source],
      source,
    });
  });

  return questions;
}

function makeStudyItems(text) {
  return normalizeText(text)
    .split(/\n+|[،,:：؛.؟!]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 8)
    .slice(0, 20);
}

function findAnswerTerm(sentence, keywords) {
  return keywords.find((keyword) => sentence.includes(keyword));
}

function makeCloze(sentence, answer) {
  if (!answer) return `أكمل العبارة: ${sentence}`;
  return `أكمل العبارة: ${sentence.replace(answer, "_____")}`;
}

function makeDistractors(answer, keywords) {
  const pool = keywords.filter((keyword) => keyword !== answer);
  const fallback = ["التجربة", "الطاقة", "النظام", "الملاحظة", "المادة"];
  return [...pool, ...fallback].filter((item, index, arr) => item && arr.indexOf(item) === index).slice(0, 5);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderAll() {
  chapterCount.textContent = state.chapters.length;
  questionCount.textContent = state.questions.length;
  renderFilters();
  renderChapters();
  renderBank();
  renderQuiz();
}

function renderFilters() {
  const options = [`<option value="all">كل الفصول</option>`]
    .concat(state.chapters.map((chapter) => `<option value="${chapter.id}">${escapeHtml(chapter.title)}</option>`))
    .join("");
  chapterFilter.innerHTML = options;
  quizChapter.innerHTML = options;
  bankChapter.innerHTML = options;
}

function renderChapters() {
  const selected = chapterFilter.value || "all";
  const chapters = selected === "all" ? state.chapters : state.chapters.filter((chapter) => chapter.id === selected);
  if (!chapters.length) {
    chapterList.innerHTML = `<div class="empty-state">لم يتم استخراج فصول بعد.</div>`;
    return;
  }

  chapterList.innerHTML = chapters.map((chapter) => {
    const questionTotal = state.questions.filter((question) => question.chapterId === chapter.id).length;
    return `<article class="chapter-card">
      <h3>${escapeHtml(chapter.title)}</h3>
      <p>${escapeHtml((chapter.sentences[0] || chapter.body).slice(0, 220))}</p>
      <div class="tag-row">
        <span class="tag">${questionTotal} سؤال</span>
        ${chapter.keywords.slice(0, 5).map((keyword) => `<span class="tag">${escapeHtml(keyword)}</span>`).join("")}
      </div>
    </article>`;
  }).join("");
}

function renderBank() {
  if (!state.questions.length) {
    questionBank.innerHTML = `<div class="empty-state">سيظهر بنك الأسئلة هنا بعد رفع المنهج.</div>`;
    return;
  }

  const selected = bankChapter.value || "all";
  const chapters = selected === "all"
    ? state.chapters
    : state.chapters.filter((ch) => ch.id === selected);

  const html = chapters.map((chapter) => {
    const chapterQuestions = state.questions.filter((q) => q.chapterId === chapter.id);
    if (!chapterQuestions.length) return "";

    const cards = chapterQuestions.map((q) => `<article class="question-card">
      <div class="tag-row">
        <span class="tag">${escapeHtml(q.type)}</span>
      </div>
      <h3>${escapeHtml(q.prompt)}</h3>
      <p>الإجابة: ${escapeHtml(q.answer)}</p>
    </article>`).join("");

    return `<div class="bank-chapter-group">
      <div class="bank-chapter-head">
        <h3>${escapeHtml(chapter.title)}</h3>
        <span class="tag">${chapterQuestions.length} سؤال</span>
      </div>
      <div class="bank-chapter-questions">${cards}</div>
    </div>`;
  }).join("");

  questionBank.innerHTML = html || `<div class="empty-state">لا توجد أسئلة لهذا الفصل.</div>`;
}

function createQuiz() {
  const selected = quizChapter.value || "all";
  const size = Number(quizSize.value);
  const pool = state.questions.filter((question) => {
    const matchesChapter = selected === "all" || question.chapterId === selected;
    return matchesChapter && question.options.length > 1;
  });

  state.quiz = shuffle(pool).slice(0, size);
  state.quizIndex = 0;
  state.score = 0;
  state.answered.clear();
  renderQuiz();
}

function renderQuiz() {
  const question = state.quiz[state.quizIndex];
  quizProgress.textContent = `السؤال ${state.quiz.length ? state.quizIndex + 1 : 0} من ${state.quiz.length}`;
  quizScore.textContent = `${state.score} نقطة`;
  answers.innerHTML = "";

  if (!question) {
    quizQuestion.textContent = state.questions.length ? "اختر إعدادات المسابقة ثم ابدأ." : "ولّد بنك الأسئلة أولًا لبدء المسابقة.";
    return;
  }

  quizQuestion.textContent = question.prompt;
  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => answerQuestion(question, option, button));
    const saved = state.answered.get(question.id);
    if (saved) markAnswer(button, option, question.answer, saved);
    answers.appendChild(button);
  });
}

function answerQuestion(question, option, button) {
  if (!state.answered.has(question.id) && option === question.answer) {
    state.score += 1;
  }
  state.answered.set(question.id, option);
  [...answers.children].forEach((child) => markAnswer(child, child.textContent, question.answer, option));
  quizScore.textContent = `${state.score} نقطة`;
}

function markAnswer(button, option, answer, selected) {
  button.classList.toggle("correct", option === answer);
  button.classList.toggle("wrong", option === selected && option !== answer);
}

function moveQuestion(delta) {
  if (!state.quiz.length) return;
  state.quizIndex = Math.min(Math.max(state.quizIndex + delta, 0), state.quiz.length - 1);
  renderQuiz();
}

function exportQuestions() {
  if (!state.questions.length) return;
  const data = JSON.stringify({ chapters: state.chapters, questions: state.questions }, null, 2);
  const blob = new Blob([data], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "question-bank.json";
  link.click();
  URL.revokeObjectURL(url);
}

function renderEmpty(message) {
  chapterList.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderAll();
