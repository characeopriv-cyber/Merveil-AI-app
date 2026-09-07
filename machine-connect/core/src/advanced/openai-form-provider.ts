import { Injectable } from '@nestjs/common';
import { FormGenerationProvider } from './ai-form.types';

@Injectable()
export class OpenAiFormProvider implements FormGenerationProvider {
  async generate(prompt: string): Promise<unknown> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    const model = process.env.OPENAI_FORM_MODEL;
    if (!model) throw new Error('OPENAI_FORM_MODEL is not configured');

    const response = await fetch(process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: 'Generate a JSON form schema only. Shape: {"formName": string, "fields": [{"name": string, "label": string, "type": "text"|"textarea"|"number"|"date"|"boolean"|"select"|"email", "required": boolean, "options"?: string[]}]}. Never generate SQL, code, permissions, or executable instructions.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI form generation failed: ${response.status}`);
    const payload = await response.json() as { output_text?: string };
    if (!payload.output_text) throw new Error('OpenAI returned no structured form output');
    return JSON.parse(payload.output_text);
  }
}
