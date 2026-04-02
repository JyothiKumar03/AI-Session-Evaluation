type Env = {
  PORT: number;
  DATABASE_URL: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
};

export const ENV: Env = {
  PORT:               Number(process.env.PORT) || 3001,
  DATABASE_URL:       process.env.DATABASE_URL ?? "",
  ANTHROPIC_API_KEY:  process.env.ANTHROPIC_API_KEY ?? "",
  OPENAI_API_KEY:     process.env.OPENAI_API_KEY ?? "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
};
