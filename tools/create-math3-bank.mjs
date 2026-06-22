import fs from "node:fs/promises";
import path from "node:path";

const outDir = process.argv[2] || "generated-curriculum";
await fs.mkdir(outDir, { recursive: true });

const chapters = [
  {
    id: "chapter-01",
    title: "الفصل الأول: القيمة المنزلية",
    lessons: [
      "الجبر: الأنماط العددية",
      "مهارة حل المسألة: استعمال الخطوات الأربع",
      "القيمة المنزلية",
      "القيمة المنزلية ضمن الألوف",
      "القيمة المنزلية ضمن عشرات الألوف",
      "مقارنة الأعداد",
      "ترتيب الأعداد",
      "التقريب إلى أقرب عشرة وإلى أقرب مئة",
      "التقريب إلى أقرب ألف",
    ],
  },
  {
    id: "chapter-02",
    title: "الفصل الثاني: الجمع",
    lessons: [
      "الجبر: خصائص الجمع",
      "تقدير نواتج الجمع",
      "مهارة حل المسألة: الجواب الدقيق أم التقديري",
      "جمع الأعداد المكونة من رقمين",
      "جمع الأعداد المكونة من ثلاثة أرقام",
      "جمع الأعداد مع إعادة التجميع",
    ],
  },
  {
    id: "chapter-03",
    title: "الفصل الثالث: الطرح",
    lessons: [
      "طرح الأعداد المكونة من رقمين",
      "تقدير نواتج الطرح",
      "مهارة حل المسألة: معقولية الإجابة",
      "طرح الأعداد المكونة من ثلاثة أرقام مع إعادة التجميع",
      "طرح الأعداد المكونة من أربعة أرقام مع إعادة التجميع",
      "الطرح مع وجود الأصفار",
    ],
  },
];

const allQuestions = [];
const chapterPayloads = [];

for (const chapter of chapters) {
  const questions = buildChapterQuestions(chapter);
  const chapterRecord = {
    id: chapter.id,
    title: chapter.title,
    body: chapter.lessons.join("\n"),
    sentences: chapter.lessons,
    keywords: chapter.lessons.flatMap((lesson) => lesson.split(/\s+/)).filter((word) => word.length > 3).slice(0, 12),
  };
  const payload = { chapters: [chapterRecord], questions };
  chapterPayloads.push({ ...chapterRecord, questionCount: questions.length });
  allQuestions.push(...questions);

  await fs.writeFile(path.join(outDir, `${chapter.id}-clean-questions.json`), JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(path.join(outDir, `${chapter.id}-clean-questions.md`), toMarkdown(chapter.title, questions), "utf8");
}

await fs.writeFile(path.join(outDir, "math3-clean-question-bank.json"), JSON.stringify({
  source: "math3-1.pdf",
  title: "رياضيات الصف الثالث الابتدائي - الفصل الدراسي الأول",
  chapters: chapterPayloads.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    body: chapter.body,
    sentences: chapter.sentences,
    keywords: chapter.keywords,
  })),
  questions: allQuestions,
}, null, 2), "utf8");

await fs.writeFile(path.join(outDir, "math3-clean-question-bank.md"), toMarkdown("رياضيات الصف الثالث الابتدائي - الفصل الدراسي الأول", allQuestions), "utf8");

console.log(JSON.stringify({
  outputDir: outDir,
  chapters: chapters.length,
  questions: allQuestions.length,
}, null, 2));

function buildChapterQuestions(chapter) {
  if (chapter.id === "chapter-01") return placeValueQuestions(chapter);
  if (chapter.id === "chapter-02") return additionQuestions(chapter);
  return subtractionQuestions(chapter);
}

function placeValueQuestions(chapter) {
  const numbers = [3482, 7056, 12409, 56031, 9870, 43018, 20675, 8192, 30045];
  const questions = [];
  const lesson = (index) => chapter.lessons[index];

  questions.push(mcq(chapter, lesson(0), "ما العدد التالي في النمط: 5، 10، 15، 20، ...؟", "25", ["22", "24", "25", "30"], "يزداد النمط بمقدار 5 كل مرة."));
  questions.push(mcq(chapter, lesson(0), "ما قاعدة النمط: 3، 6، 12، 24؟", "أضرب في 2", ["أضيف 2", "أضرب في 2", "أطرح 3", "أقسم على 2"], "كل عدد يساوي ضعف العدد السابق."));
  questions.push(tf(chapter, lesson(1), "تبدأ خطوات حل المسألة بفهم المعطيات والمطلوب.", "صح"));
  questions.push(mcq(chapter, lesson(1), "أي خطوة تأتي بعد وضع خطة لحل المسألة؟", "تنفيذ الخطة", ["قراءة السؤال فقط", "تنفيذ الخطة", "تغيير المعطيات", "ترك التحقق"], "الخطوات الأربع: أفهم، أخطط، أحل، أتحقق."));

  for (const number of numbers) {
    const digits = String(number).split("").map(Number);
    const ones = digits.at(-1);
    const tens = digits.at(-2) || 0;
    const hundreds = digits.at(-3) || 0;
    const thousands = digits.at(-4) || 0;
    questions.push(mcq(chapter, lesson(2), `ما منزلة الرقم ${hundreds} في العدد ${number}؟`, "المئات", ["الآحاد", "العشرات", "المئات", "الألوف"], "تحدد القيمة المنزلية مكان الرقم في العدد."));
    questions.push(mcq(chapter, lesson(3), `ما قيمة الرقم ${thousands} في العدد ${number}؟`, String(thousands * 1000), [String(thousands), String(thousands * 10), String(thousands * 100), String(thousands * 1000)], "القيمة تساوي الرقم مضروبًا في منزلته."));
    questions.push(tf(chapter, lesson(3), `في العدد ${number}، قيمة رقم الآحاد ${ones}.`, "صح"));
    if (number >= 10000) {
      questions.push(mcq(chapter, lesson(4), `ما الرقم في منزلة عشرات الألوف في العدد ${number}؟`, String(digits.at(-5) || 0), [String(digits.at(-5) || 0), String(thousands), String(hundreds), String(tens)], "عشرات الألوف هي المنزلة الخامسة من اليمين."));
    }
  }

  questions.push(mcq(chapter, lesson(5), "أي العددين أكبر: 7432 أم 7342؟", "7432", ["7342", "7432", "العددان متساويان", "لا يمكن المقارنة"], "نقارن من أعلى منزلة ثم ننتقل للمنزلة التالية."));
  questions.push(mcq(chapter, lesson(6), "رتب الأعداد تصاعديًا: 4500، 4050، 5400", "4050، 4500، 5400", ["5400، 4500، 4050", "4050، 4500، 5400", "4500، 4050، 5400", "4050، 5400، 4500"], "الترتيب التصاعدي من الأصغر إلى الأكبر."));
  questions.push(mcq(chapter, lesson(7), "قرب العدد 347 إلى أقرب عشرة.", "350", ["300", "340", "350", "400"], "ننظر إلى منزلة الآحاد."));
  questions.push(mcq(chapter, lesson(7), "قرب العدد 347 إلى أقرب مئة.", "300", ["300", "340", "350", "400"], "ننظر إلى منزلة العشرات."));
  questions.push(mcq(chapter, lesson(8), "قرب العدد 3620 إلى أقرب ألف.", "4000", ["3000", "3600", "4000", "5000"], "ننظر إلى منزلة المئات عند التقريب للألف."));

  return withIds(questions);
}

function additionQuestions(chapter) {
  const questions = [];
  const lesson = (index) => chapter.lessons[index];
  const pairs = [[24, 35], [48, 27], [136, 241], [276, 389], [509, 182], [742, 158], [67, 18], [455, 267]];

  questions.push(mcq(chapter, lesson(0), "أي خاصية توضح أن 7 + 0 = 7؟", "خاصية العنصر المحايد", ["خاصية الإبدال", "خاصية التجميع", "خاصية العنصر المحايد", "خاصية الطرح"], "إضافة الصفر لا تغير العدد."));
  questions.push(mcq(chapter, lesson(0), "أي مثال يمثل خاصية الإبدال في الجمع؟", "4 + 9 = 9 + 4", ["4 + 9 = 13", "4 + 9 = 9 + 4", "4 + 0 = 4", "(2 + 3) + 5 = 2 + (3 + 5)"], "تبديل ترتيب العددين لا يغير ناتج الجمع."));

  for (const [a, b] of pairs) {
    const sum = a + b;
    questions.push(mcq(chapter, lesson(a < 100 && b < 100 ? 3 : 4), `ما ناتج ${a} + ${b}؟`, String(sum), optionsAround(sum), "نجمع الآحاد ثم العشرات ثم المئات عند وجودها."));
    questions.push(tf(chapter, lesson(a < 100 && b < 100 ? 3 : 4), `${a} + ${b} = ${sum}.`, "صح"));
    questions.push(mcq(chapter, lesson(1), `قدر ناتج ${a} + ${b} بتقريب كل عدد لأقرب عشرة.`, String(round10(a) + round10(b)), optionsAround(round10(a) + round10(b), 10), "نقرب الأعداد ثم نجمع للحصول على تقدير."));
  }

  questions.push(mcq(chapter, lesson(2), "إذا سألك السؤال: كم قلمًا تقريبًا؟ فما نوع الإجابة المناسب؟", "تقديرية", ["دقيقة", "تقديرية", "خاطئة", "لا توجد إجابة"], "كلمة تقريبًا تدل على أن الجواب التقديري مناسب."));
  questions.push(mcq(chapter, lesson(5), "عند جمع 68 + 47، لماذا نعيد التجميع؟", "لأن مجموع الآحاد أكبر من 9", ["لأن العددين متساويان", "لأن مجموع الآحاد أكبر من 9", "لأن الناتج أقل من 10", "لأننا نطرح"], "نعيد تجميع 10 آحاد في عشرة واحدة."));
  questions.push(card(chapter, lesson(5), "إعادة التجميع في الجمع", "تحويل 10 آحاد إلى عشرة واحدة أو 10 عشرات إلى مئة واحدة عند الحاجة."));

  return withIds(questions);
}

function subtractionQuestions(chapter) {
  const questions = [];
  const lesson = (index) => chapter.lessons[index];
  const pairs = [[76, 34], [92, 58], [438, 126], [604, 278], [5000, 2368], [7020, 1457], [85, 29], [913, 458]];

  for (const [a, b] of pairs) {
    const diff = a - b;
    const lessonIndex = a < 100 ? 0 : a < 1000 ? 3 : 4;
    questions.push(mcq(chapter, lesson(lessonIndex), `ما ناتج ${a} - ${b}؟`, String(diff), optionsAround(diff), "نطرح الآحاد ثم العشرات ثم المئات، ونستخدم إعادة التجميع عند الحاجة."));
    questions.push(tf(chapter, lesson(lessonIndex), `${a} - ${b} = ${diff}.`, "صح"));
    questions.push(mcq(chapter, lesson(1), `قدر ناتج ${a} - ${b} بتقريب كل عدد لأقرب عشرة.`, String(round10(a) - round10(b)), optionsAround(round10(a) - round10(b), 10), "التقدير يساعد على معرفة معقولية الناتج."));
  }

  questions.push(mcq(chapter, lesson(2), "كيف نتحقق من معقولية ناتج الطرح؟", "نقارن الناتج بتقدير قريب", ["نحذف السؤال", "نقارن الناتج بتقدير قريب", "نغير العملية إلى ضرب", "نختار أكبر عدد"], "التقدير يساعد على كشف الإجابات غير المعقولة."));
  questions.push(mcq(chapter, lesson(5), "ما ناتج 400 - 175؟", "225", ["125", "175", "225", "325"], "في الطرح مع الأصفار نعيد التجميع من المنزلة الأعلى."));
  questions.push(mcq(chapter, lesson(5), "عند طرح 3005 - 1287، ما سبب الحاجة إلى إعادة التجميع؟", "وجود أصفار في بعض المنازل", ["لأن العددين صغيران", "وجود أصفار في بعض المنازل", "لأن العملية جمع", "لأن الناتج صفر"], "الأصفار تحتاج إعادة تجميع من منزلة أعلى."));
  questions.push(card(chapter, lesson(2), "معقولية الإجابة", "هي التأكد من أن الناتج قريب من التقدير ولا يخالف معنى المسألة."));

  return withIds(questions);
}

function mcq(chapter, lesson, prompt, answer, options, source) {
  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    lesson,
    type: "اختيار من متعدد",
    prompt,
    question: prompt,
    answer,
    options: shuffle(unique(options)).slice(0, 4),
    source,
  };
}

function tf(chapter, lesson, prompt, answer) {
  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    lesson,
    type: "صح وخطأ",
    prompt,
    question: prompt,
    answer,
    options: ["صح", "خطأ"],
    source: prompt,
  };
}

function card(chapter, lesson, prompt, answer) {
  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    lesson,
    type: "بطاقة مراجعة",
    prompt,
    question: prompt,
    answer,
    options: [answer],
    source: answer,
  };
}

function withIds(questions) {
  return questions.map((question, index) => ({
    id: `${question.chapterId}-q-${String(index + 1).padStart(3, "0")}`,
    ...question,
  }));
}

function optionsAround(answer, step = 1) {
  const value = Number(answer);
  return unique([value, value + step, Math.max(0, value - step), value + step * 2].map(String));
}

function round10(value) {
  return Math.round(value / 10) * 10;
}

function unique(items) {
  return [...new Set(items.filter((item) => item !== undefined && item !== null))];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function toMarkdown(title, questions) {
  return [
    `# ${title}`,
    "",
    `عدد الأسئلة: ${questions.length}`,
    "",
    ...questions.map((question, index) => [
      `## ${index + 1}. ${question.type}`,
      `الفصل: ${question.chapterTitle}`,
      `الدرس: ${question.lesson}`,
      "",
      question.prompt,
      "",
      question.options?.length > 1 ? question.options.map((option) => `- ${option}`).join("\n") : "",
      "",
      `الإجابة: ${question.answer}`,
      "",
      `المصدر/المهارة: ${question.source}`,
      "",
    ].join("\n")),
  ].join("\n");
}
