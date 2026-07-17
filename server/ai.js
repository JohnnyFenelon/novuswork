/** Ollama / Qwen 2.5 7B chat proxy for the NovusWork AI assistant. */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = 'qwen2.5:7b';

const SYSTEM_PROMPT = `You are NovusWork AI, a friendly and professional assistant built into the NovusWork platform — a marketplace that connects workers with companies.

You help users with the following tasks:
- Filling out profile forms: suggest a compelling headline, profession, skills list, bio, and other fields.
- Writing cover letters for job applications tailored to the job description and the user's experience.
- Improving profile descriptions to sound more professional and engaging.
- Suggesting job postings for companies: help draft titles, descriptions, requirements, and budgets.
- Answering questions about how the NovusWork platform works.

Guidelines:
- Keep responses concise and actionable.
- When filling forms, return the suggested values clearly so they can be copy-pasted.
- Adapt your tone to the user's role: supportive and encouraging for workers, professional and strategic for companies.
- If you don't know something specific about the platform, say so honestly rather than guessing.`;

/**
 * Send a message to the local Ollama instance and return the assistant reply.
 *
 * @param {string}  message  – the user's message
 * @param {object}  [context] – optional context (currentPage, formState, role…)
 * @returns {Promise<string>} the AI response text
 */
export async function chatWithAI(message, context) {
  const userContent = context
    ? `[Context: ${JSON.stringify(context)}]\n\n${message}`
    : message;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      console.error('[ai] Ollama error', res.status, await res.text().catch(() => ''));
      return 'Sorry, the AI assistant is temporarily unavailable. Please try again later.';
    }

    const data = await res.json();
    return data.message?.content || 'Sorry, I could not generate a response.';
  } catch (err) {
    console.error('[ai] Ollama request failed:', err.message);
    return 'Sorry, the AI assistant is temporarily unavailable. Please try again later.';
  }
}
