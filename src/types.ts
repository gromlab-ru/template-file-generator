export type ParsedArgs = {
  templateName?: string;
  positionalName?: string;
  positionalOutDir?: string;
  vars: Record<string, string>;
  overwrite: boolean;
  skipUpdate: boolean;
  help: boolean;
  extra: string[];
};

export type PlanItem = {
  source: string;
  target: string;
};

export type ValidationError = {
  title: string;
  details?: string[];
  hint?: string;
  showHelp?: boolean;
};

export type TemplateContext = {
  templateDir: string;
  files: string[];
};
