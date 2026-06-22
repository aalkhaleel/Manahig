import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';
const MAX_CHAPTERS = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'API_KEY_MISSING' });
  }

  const { chapters } = req.body;
  if (!Array.isArray(chapters) || !chapters.length) {
    return res.status(400).json({ error: 'INVALID_INPUT' });
  }

  const targetChapters = chapters.slice(0, MAX_CHAPTERS);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const allQuestions = [];

  try {
    for (const chapter of targetChapters) {
      const chapterText = `${chapter.title}\n${chapter.body ?? ''}`.slice(0, 3000);
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: buildPrompt(chapter.title, chapterText) }],
      });

      const raw = message.content[0]?.text?.trim() ?? '';
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) continue;

      let parsed;
      try { parsed = JSON.parse(match[0]); } catch { continue; }

      parsed.forEach((q, i) => {
        if (!q.prompt || !q.answer) return;
        allQuestions.push({
          id: `${chapter.id}-ai-${i}`,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          type: q.type ?? 'اختيار من متعدد',
          prompt: q.prompt,
          answer: String(q.answer),
          options: Array.isArray(q.options) && q.options.length > 1
            ? q.options.map(String)
            : [String(q.answer)],
          source: 'AI',
        });
      });
    }

    res.json({ questions: allQuestions, chaptersProcessed: targetChapters.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function buildPrompt(title, text) {
  return `أنت مساعد تعليمي متخصص في إنشاء أسئلة دراسية باللغة العربية الفصحى.

اقرأ الفصل الدراسي التالي وأنشئ بنك أسئلة يختبر الفهم الحقيقي.

عنوان الفصل: ${title}
---
${text}
---

أنشئ بالضبط هذه الأسئلة:
- 5 أسئلة اختيار من متعدد (4 خيارات لكل سؤال، خيار صحيح واحد فقط)
- 3 أسئلة صح وخطأ (عبارات مبنية على النص)
- 2 بطاقة تعريف لمصطلح مهم

القواعد الإلزامية:
- الأسئلة تختبر الفهم لا الحفظ الحرفي
- الخيارات الخاطئة في MCQ يجب أن تكون معقولة وليست واضحة الخطأ
- اللغة عربية فصحى واضحة

أجب بـ JSON صالح فقط بدون أي نص قبله أو بعده:
[
  {"type":"اختيار من متعدد","prompt":"نص السؤال؟","answer":"الإجابة الصحيحة","options":["الإجابة الصحيحة","خطأ1","خطأ2","خطأ3"]},
  {"type":"صح وخطأ","prompt":"عبارة لتحديد صحتها","answer":"صح","options":["صح","خطأ"]},
  {"type":"بطاقة مراجعة","prompt":"ما تعريف [مصطلح]؟","answer":"التعريف الكامل للمصطلح","options":["التعريف الكامل للمصطلح"]}
]`;
}
