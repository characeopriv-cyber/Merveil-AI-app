export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'email';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
}

export interface FormSchema {
  version: 1;
  formName: string;
  fields: FormField[];
}

export interface FormGenerationProvider {
  generate(prompt: string): Promise<unknown>;
}
