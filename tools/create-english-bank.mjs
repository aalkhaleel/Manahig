import fs from "node:fs/promises";
import path from "node:path";

const outDir = process.argv[2] || "generated-english";
await fs.mkdir(outDir, { recursive: true });

const units = [
  {
    id: "unit-01",
    title: "Unit 1: Lifestyles",
    pages: "2-11",
    topics: ["daily routines", "free time activities", "habits", "adverbs of frequency"],
    vocabulary: ["always", "usually", "often", "sometimes", "rarely", "never", "lifestyle", "routine", "hobby", "exercise"],
    grammar: ["Simple present tense", "Adverbs of frequency", "Yes/No questions", "Wh-questions"],
    lessons: [
      { title: "Lesson 1: What's your routine?", content: "Students talk about daily routines using the simple present tense and adverbs of frequency." },
      { title: "Lesson 2: Free Time", content: "Students describe hobbies and free time activities." },
      { title: "Lesson 3: Healthy Lifestyles", content: "Students discuss healthy habits and exercise routines." },
    ],
  },
  {
    id: "unit-02",
    title: "Unit 2: Life Stories",
    pages: "12-21",
    topics: ["past events", "biographies", "childhood memories", "simple past"],
    vocabulary: ["was born", "grew up", "studied", "worked", "moved", "married", "graduated", "became", "lived", "died"],
    grammar: ["Simple past tense", "Regular and irregular verbs", "Past time expressions"],
    lessons: [
      { title: "Lesson 1: Famous People", content: "Students read and talk about the life stories of famous people." },
      { title: "Lesson 2: My Story", content: "Students talk about their own past experiences and childhood." },
      { title: "Lesson 3: Historical Events", content: "Students discuss important past events." },
    ],
  },
  {
    id: "unit-03",
    title: "Unit 3: When Are You Traveling?",
    pages: "22-31",
    topics: ["travel plans", "future tense", "transportation", "booking tickets"],
    vocabulary: ["travel", "flight", "hotel", "reservation", "destination", "passport", "luggage", "depart", "arrive", "cancel"],
    grammar: ["Future with 'going to'", "Future with 'will'", "Present continuous for future plans"],
    lessons: [
      { title: "Lesson 1: Travel Plans", content: "Students discuss future travel plans using 'going to' and 'will'." },
      { title: "Lesson 2: At the Airport", content: "Students practice airport and travel vocabulary." },
      { title: "Lesson 3: Making Reservations", content: "Students learn to book hotels and make travel reservations." },
    ],
  },
  {
    id: "unit-04",
    title: "Unit 4: What Do I Need to Buy?",
    pages: "38-47",
    topics: ["shopping", "quantities", "food items", "countable and uncountable nouns"],
    vocabulary: ["grocery", "supermarket", "quantity", "dozen", "loaf", "bottle", "can", "bag", "pound", "kilo"],
    grammar: ["Countable and uncountable nouns", "Some / any / a lot of / much / many", "How much / How many"],
    lessons: [
      { title: "Lesson 1: At the Supermarket", content: "Students practice shopping vocabulary and quantities." },
      { title: "Lesson 2: How Much / How Many", content: "Students use countable and uncountable nouns." },
      { title: "Lesson 3: Making a Shopping List", content: "Students write and discuss shopping lists." },
    ],
  },
  {
    id: "unit-05",
    title: "Unit 5: Since When?",
    pages: "48-57",
    topics: ["experiences", "present perfect", "for and since", "how long"],
    vocabulary: ["already", "yet", "just", "ever", "never", "recently", "for", "since", "experience", "achievement"],
    grammar: ["Present perfect tense", "For and since", "Already / yet / just / ever / never"],
    lessons: [
      { title: "Lesson 1: Have You Ever?", content: "Students talk about life experiences using the present perfect." },
      { title: "Lesson 2: For and Since", content: "Students practice using for and since with the present perfect." },
      { title: "Lesson 3: Achievements", content: "Students discuss personal achievements and experiences." },
    ],
  },
  {
    id: "unit-06",
    title: "Unit 6: Do You Know Where It Is?",
    pages: "58-67",
    topics: ["giving directions", "locations", "embedded questions", "prepositions of place"],
    vocabulary: ["turn left", "turn right", "straight ahead", "corner", "block", "intersection", "next to", "across from", "between", "behind"],
    grammar: ["Embedded questions (indirect questions)", "Prepositions of place", "Imperatives for directions"],
    lessons: [
      { title: "Lesson 1: Asking for Directions", content: "Students practice asking for and giving directions." },
      { title: "Lesson 2: Embedded Questions", content: "Students use indirect questions to ask politely." },
      { title: "Lesson 3: Reading a Map", content: "Students describe locations using prepositions." },
    ],
  },
  {
    id: "unit-07",
    title: "Unit 7: It's a Good Deal, Isn't It?",
    pages: "74-83",
    topics: ["shopping", "tag questions", "prices", "confirming information"],
    vocabulary: ["bargain", "deal", "price tag", "discount", "garage sale", "secondhand", "receipt", "exchange", "refund", "afford"],
    grammar: ["Tag questions (affirmative and negative)", "Negative questions", "Expressing ability with 'be able to'"],
    lessons: [
      { title: "Lesson 1: Garage Sales", content: "Students talk about buying and selling items at garage sales." },
      { title: "Lesson 2: Tag Questions", content: "Students practice forming and using tag questions." },
      { title: "Lesson 3: Confirming Information", content: "Students use negative questions to confirm information." },
    ],
  },
  {
    id: "unit-08",
    title: "Unit 8: Drive Slowly!",
    pages: "84-93",
    topics: ["cars", "driving", "traffic rules", "modals of obligation", "adverbs of manner"],
    vocabulary: ["speed limit", "traffic sign", "seatbelt", "license", "fine", "pedestrian", "intersection", "overtake", "brake", "horn"],
    grammar: ["Modal auxiliaries: must / mustn't / should / shouldn't", "Adverbs of manner", "Requests and commands with can/could/will/would"],
    lessons: [
      { title: "Lesson 1: Traffic Rules", content: "Students discuss traffic signs and road rules using modal verbs." },
      { title: "Lesson 2: Adverbs of Manner", content: "Students describe how people do things using adverbs." },
      { title: "Lesson 3: Requests and Commands", content: "Students practice making polite requests using modals." },
    ],
  },
  {
    id: "unit-09",
    title: "Unit 9: All Kinds of People",
    pages: "94-103",
    topics: ["personality", "past events interrupted", "relative pronouns", "past progressive"],
    vocabulary: ["personality", "character", "ambitious", "generous", "stubborn", "patient", "honest", "reliable", "cheerful", "shy"],
    grammar: ["Past progressive with when and while", "Relative pronouns: who, that, which", "Can/may/could for possibility"],
    lessons: [
      { title: "Lesson 1: Describing Personality", content: "Students describe people's personalities and character traits." },
      { title: "Lesson 2: Past Progressive", content: "Students talk about past events that were interrupted." },
      { title: "Lesson 3: Relative Clauses", content: "Students use relative pronouns to give more information." },
    ],
  },
  {
    id: "unit-10",
    title: "Unit 10: Who Used My Toothpaste?",
    pages: "110-119",
    topics: ["chores", "complaints", "past perfect", "household items"],
    vocabulary: ["toothpaste", "chore", "messy", "tidy", "dishwasher", "laundry", "vacuum", "mop", "complaint", "responsibility"],
    grammar: ["Past perfect tense", "Already / yet with past perfect", "Reported speech for complaints"],
    lessons: [
      { title: "Lesson 1: Household Chores", content: "Students discuss household responsibilities and chores." },
      { title: "Lesson 2: Making Complaints", content: "Students practice making and responding to complaints." },
      { title: "Lesson 3: Past Perfect", content: "Students use the past perfect to talk about completed past actions." },
    ],
  },
  {
    id: "unit-11",
    title: "Unit 11: Making Choices",
    pages: "120-129",
    topics: ["decisions", "conditionals", "advice", "hypothetical situations"],
    vocabulary: ["decision", "choice", "option", "consequence", "prefer", "consider", "weigh", "pros", "cons", "alternative"],
    grammar: ["Real conditionals (if + present, will)", "Unreal conditionals (if + past, would)", "Should for advice"],
    lessons: [
      { title: "Lesson 1: Making Decisions", content: "Students talk about making important choices in life." },
      { title: "Lesson 2: Real Conditionals", content: "Students use real conditionals to talk about possible results." },
      { title: "Lesson 3: Unreal Conditionals", content: "Students use unreal conditionals for hypothetical situations." },
    ],
  },
  {
    id: "unit-12",
    title: "Unit 12: Culture Shock",
    pages: "130-139",
    topics: ["cultures", "customs", "comparisons", "cultural differences"],
    vocabulary: ["culture", "custom", "tradition", "shock", "adapt", "homesick", "diverse", "respect", "attitude", "value"],
    grammar: ["Comparatives and superlatives review", "Passive voice introduction", "Connectors: although, however, despite"],
    lessons: [
      { title: "Lesson 1: Cultural Differences", content: "Students discuss customs and traditions around the world." },
      { title: "Lesson 2: Adapting to New Cultures", content: "Students talk about experiencing culture shock." },
      { title: "Lesson 3: Comparing Cultures", content: "Students compare and contrast different cultural practices." },
    ],
  },
];

const allQuestions = [];
const chapterRecords = [];
const chapterPayloads = [];

for (const unit of units) {
  const questions = buildUnitQuestions(unit);
  const chapterRecord = {
    id: unit.id,
    title: unit.title,
    body: [
      `Pages: ${unit.pages}`,
      `Topics: ${unit.topics.join(", ")}`,
      `Vocabulary: ${unit.vocabulary.join(", ")}`,
      `Grammar: ${unit.grammar.join(", ")}`,
      ...unit.lessons.map((l) => `${l.title}: ${l.content}`),
    ].join("\n"),
    sentences: unit.lessons.map((l) => l.content),
    keywords: [...unit.vocabulary.slice(0, 8), ...unit.topics.slice(0, 4)],
  };

  const payload = {
    id: unit.id,
    title: unit.title,
    pages: unit.pages,
    questions,
  };

  chapterRecords.push(chapterRecord);
  chapterPayloads.push(payload);
  allQuestions.push(...questions);

  const jsonFile = path.join(outDir, `${unit.id}-questions.json`);
  await fs.writeFile(jsonFile, JSON.stringify(payload, null, 2), "utf8");
  console.log(`${unit.title}: ${questions.length} questions`);
}

const bank = {
  title: "SuperGoal 3 - English Question Bank",
  source: "كتاب-انجليزي-ثالث-متوسط-ف2-كتبي.pdf",
  chapters: chapterRecords,
  questions: allQuestions,
};

const bankFile = path.join(outDir, "english-question-bank.json");
await fs.writeFile(bankFile, JSON.stringify(bank, null, 2), "utf8");
console.log(`\nTotal: ${allQuestions.length} questions in ${units.length} units`);
console.log(`Saved to: ${bankFile}`);

function buildUnitQuestions(unit) {
  const questions = [];
  const vocab = unit.vocabulary;
  const grammar = unit.grammar;

  // Vocabulary MCQ questions
  for (let i = 0; i < Math.min(vocab.length, 6); i++) {
    const word = vocab[i];
    const distractors = vocab.filter((v) => v !== word).slice(0, 3);
    questions.push({
      id: `${unit.id}-vocab-${i + 1}`,
      chapterId: unit.id,
      chapterTitle: unit.title,
      type: "اختيار من متعدد",
      prompt: `Which word is related to the topic "${unit.topics[0]}"? → "${word}" means:`,
      answer: word,
      options: shuffle([word, ...distractors]),
      source: `Vocabulary: ${unit.topics[0]}`,
    });
  }

  // Grammar MCQ questions
  for (let i = 0; i < grammar.length; i++) {
    const rule = grammar[i];
    const others = grammar.filter((g) => g !== rule);
    questions.push({
      id: `${unit.id}-grammar-${i + 1}`,
      chapterId: unit.id,
      chapterTitle: unit.title,
      type: "اختيار من متعدد",
      prompt: `Which grammar point is studied in "${unit.title}"?`,
      answer: rule,
      options: shuffle([rule, ...others.slice(0, 3)]),
      source: `Grammar focus: ${unit.title}`,
    });
  }

  // True/False based on lessons
  for (const lesson of unit.lessons) {
    questions.push({
      id: `${unit.id}-tf-${lesson.title.slice(0, 10).replace(/\W+/g, "-")}`,
      chapterId: unit.id,
      chapterTitle: unit.title,
      type: "صح وخطأ",
      prompt: lesson.content,
      answer: "صح",
      options: ["صح", "خطأ"],
      source: lesson.title,
    });
  }

  // Flashcard for each topic
  for (const topic of unit.topics.slice(0, 3)) {
    questions.push({
      id: `${unit.id}-card-${topic.replace(/\W+/g, "-")}`,
      chapterId: unit.id,
      chapterTitle: unit.title,
      type: "بطاقة مراجعة",
      prompt: `What grammar or vocabulary is covered under the topic: "${topic}"?`,
      answer: `In Unit "${unit.title}", the topic "${topic}" covers: ${unit.grammar.join(", ")}. Key vocabulary: ${unit.vocabulary.slice(0, 5).join(", ")}.`,
      options: [`In Unit "${unit.title}", the topic "${topic}" covers: ${unit.grammar.join(", ")}. Key vocabulary: ${unit.vocabulary.slice(0, 5).join(", ")}.`],
      source: `Unit overview: ${unit.title}`,
    });
  }

  return questions;
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
