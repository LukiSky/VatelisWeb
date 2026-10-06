import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const defaultModel = 'gemini-2.5-flash';
const maxMessageLength = 4000;
const siteContext = `
You are the Vatelis website assistant. Use the following website context when answering questions:

- Vatelis is presented as a "multiversal experience" with a cinematic Three.js background, floating physics-based interface elements, a mascot stage, and a chat space.
- The main navigation has these routes: Home (/), About (/about), Services (/services), Portfolio (/portfolio), and Contact (/contact).
- Home currently welcomes visitors to the multiverse and shows the mascot, interactive floating navigation, and chat experience.
- About, Services, Portfolio, and Contact are currently placeholder pages. Their visible copy says that more content is coming soon or is sample placeholder text; do not invent specific services, projects, contact details, prices, or company claims that are not present on the website.
- If asked about something not documented here, say that the website does not currently provide that information and invite the visitor to use the Contact page.

Answer as a helpful, concise representative of Vatelis. Describe only the current website accurately.
`;

type ChatMessage = {
	role: 'user' | 'model';
	text: string;
};

export const POST: RequestHandler = async ({ request, fetch }) => {
	const body = await request.json().catch(() => null);
	const messages: unknown[] = Array.isArray(body?.messages) ? body.messages : [];
	const apiKey = env.GEMINI_API_KEY;
	const model = env.GEMINI_MODEL ?? defaultModel;

	if (!apiKey) {
		return json({ error: 'Gemini is not configured. Set GEMINI_API_KEY on the server.' }, { status: 503 });
	}

	const validMessages = messages.filter(
		(message: unknown): message is { role: ChatMessage['role']; text: string } =>
			typeof message === 'object' &&
			message !== null &&
			'role' in message &&
			'text' in message &&
			((message as { role: string }).role === 'user' ||
				(message as { role: string }).role === 'model') &&
			typeof (message as { text: unknown }).text === 'string'
	);
	const contents: ChatMessage[] = validMessages
		.map((message) => ({
			role: message.role,
			text: message.text.trim().slice(0, maxMessageLength)
		}))
		.filter((message) => message.text.length > 0)
		.slice(-20);

	if (contents.length === 0 || contents.at(-1)?.role !== 'user') {
		return json({ error: 'A user message is required.' }, { status: 400 });
	}

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				systemInstruction: {
					parts: [
						{
							text: siteContext
						}
					]
				},
				contents: contents.map((message) => ({
					role: message.role,
					parts: [{ text: message.text }]
				})),
				generationConfig: {
					temperature: 0.7,
					maxOutputTokens: 500
				}
			})
		}
	);

	if (!response.ok) {
		const details = await response.text();
		console.error('Gemini request failed', response.status, details);
		return json({ error: 'Gemini could not answer right now.' }, { status: 502 });
	}

	const result = await response.json();
	const reply = result.candidates?.[0]?.content?.parts
		?.map((part: { text?: string }) => part.text ?? '')
		.join('')
		.trim();

	if (!reply) {
		return json({ error: 'Gemini returned an empty response.' }, { status: 502 });
	}

	return json({ reply });
};
