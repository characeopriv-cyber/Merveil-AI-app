import { Injectable } from '@nestjs/common';
import { FormField, FormGenerationProvider, FormSchema } from './ai-form.types';

@Injectable()
export class AiFormBuilderService {
  constructor(private readonly provider?: FormGenerationProvider) {}

  async generate(prompt: string): Promise<FormSchema> {
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt || normalizedPrompt.length > 4000) throw new Error('invalid form prompt');
    if (!this.provider) throw new Error('AI form provider is not configured');
    return this.validate(await this.provider.generate(normalizedPrompt));
  }

  validate(value: unknown): FormSchema {
    if (!value || typeof value !== 'object') throw new Error('invalid form schema');
    const input = value as Record<string, unknown>;
    const formName = typeof input.formName === 'string' ? input.formName.trim() : '';
    if (!formName || formName.length > 120) throw new Error('invalid form name');
    if (!Array.isArray(input.fields) || input.fields.length === 0 || input.fields.length > 100) throw new Error('invalid form fields');

    const fields = input.fields.map((raw, index) => this.validateField(raw, index));
    const names = new Set<string>();
    for (const field of fields) {
      if (names.has(field.name)) throw new Error(`duplicate field: ${field.name}`);
      names.add(field.name);
    }
    return { version: 1, formName, fields };
  }

  private validateField(raw: unknown, index: number): FormField {
    if (!raw || typeof raw !== 'object') throw new Error(`invalid field ${index}`);
    const field = raw as Record<string, unknown>;
    const name = typeof field.name === 'string' ? field.name.trim() : '';
    const label = typeof field.label === 'string' ? field.label.trim() : '';
    const type = field.type;
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(name)) throw new Error(`invalid field name at ${index}`);
    if (!label || label.length > 160) throw new Error(`invalid field label at ${index}`);
    const allowed: FormField['type'][] = ['text', 'textarea', 'number', 'date', 'boolean', 'select', 'email'];
    if (!allowed.includes(type as FormField['type'])) throw new Error(`invalid field type at ${index}`);
    if (typeof field.required !== 'boolean') throw new Error(`invalid required flag at ${index}`);
    let options: string[] | undefined;
    if (type === 'select') {
      if (!Array.isArray(field.options) || field.options.length === 0 || field.options.length > 100) throw new Error(`select options required at ${index}`);
      options = field.options.map((x) => String(x).trim()).filter(Boolean).slice(0, 100);
      if (!options.length) throw new Error(`empty select options at ${index}`);
    }
    return { name, label, type: type as FormField['type'], required: field.required as boolean, ...(options ? { options } : {}) };
  }
}
