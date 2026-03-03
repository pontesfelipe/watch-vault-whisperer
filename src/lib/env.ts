const requiredVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
] as const;

export function validateEnv() {
  const missing = requiredVars.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}\n\nCheck your .env file.`
    );
  }
}

export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID as string,
};
