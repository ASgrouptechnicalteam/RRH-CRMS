import { AIProvider, AIIntentResponse, AISearchContext } from '../types';
import { SYSTEM_PROMPT } from '../prompts';
import { validateAIIntent } from '../schema';

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gemini-1.5-flash';
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  async parseSearchIntent(input: string, context?: AISearchContext): Promise<AIIntentResponse> {
    if (!this.apiKey) {
      throw new Error('AI_PROVIDER_UNCONFIGURED');
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `User Query: "${input}"\n\nContext: ${JSON.stringify(context || {})}` }],
        },
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new Error('AI_PROVIDER_RATE_LIMIT');
      }

      if (!response.ok) {
        throw new Error(`AI_PROVIDER_ERROR: ${response.status}`);
      }

      const data = await response.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error('AI_INVALID_OUTPUT');
      }

      const parsedJSON = JSON.parse(textOutput);
      return validateAIIntent(parsedJSON);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('AI_PROVIDER_TIMEOUT');
      }
      if (error instanceof SyntaxError) {
        throw new Error('AI_INVALID_OUTPUT');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
