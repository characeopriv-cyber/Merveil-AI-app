import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FormField, FormSchema } from './ai-form.types';
import { OpenAiFormProvider } from './openai-form-provider';

interface StoredForm { id: string; tenantId: string; createdBy: string; schema: FormSchema; published: boolean; createdAt: string; }

@Injectable()
export class AiFormBuilderService {
  private readonly forms = new Map<string, StoredForm>();
  constructor(private readonly provider: OpenAiFormProvider) {}

  async generate(input: { tenantId: string; actorId: string; prompt: string }): Promise<StoredForm> {
    const normalizedPrompt = input.prompt.trim();
    if (!input.tenantId || !input.actorId || !normalizedPrompt || normalizedPrompt.length > 4000) throw new Error('invalid form request');
    const schema = this.validate(await this.provider.generate(normalizedPrompt));
    const form: StoredForm = { id: randomUUID(), tenantId: input.tenantId, createdBy: input.actorId, schema, published: false, createdAt: new Date().toISOString() };
    this.forms.set(form.id, form);
    return form;
  }

  publish(tenantId: string, actorId: string, formId: string): StoredForm {
    const form = this.forms.get(formId);
    if (!form || form.tenantId !== tenantId) throw new Error('form not found');
    if (form.createdBy !== actorId) throw new Error('only the form owner may publish');
    form.published = true;
    return form;
  }

  get(tenantId: string, formId: string): StoredForm {
    const form = this.forms.get(formId);
    if (!form || form.tenantId !== tenantId) throw new Error('form not found');
    return form;
  }

  validate(value: unknown): FormSchema {
    if (!value || typeof value !== 'object') throw new Error('invalid form schema');
    const input = value as Record<string, unknown>;
    const formName = typeof input.formName === 'string' ? input.formName.trim() : '';
    if (!formName || formName.length > 120) throw new Error('invalid form name');
    if (!Array.isArray(input.fields) || input.fields.length === 0 || input.fields.length > 100) throw new Error('invalid form fields');
    const fields = input.fields.map((raw, index) => this.validateField(raw, index));
    const names = new Set<string>();
    for (const field of fields) { if (names.has(field.name)) throw new Error(`duplicate field: ${field.name}`); names.add(field.name); }
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
    if (type !== 'select') return { name, label, type: type as FormField['type'], required: field.required as boolean };
    if (!Array.isArray(field.options) || field.options.length === 0 || field.options.length > 100) throw new Error(`select options required at ${index}`);
    const options = field.options.map((x) => String(x).trim()).filter(Boolean).slice(0, 100);
    if (!options.length) throw new Error(`empty select options at ${index}`);
    return { name, label, type: 'select', required: field.required as boolean, options };
  }
}
