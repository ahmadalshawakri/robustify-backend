import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    DATABASE_URL: z.url(),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
    /** Directory of the built web app. Served when present so one container hosts everything. */
    WEB_DIST: z.string().optional(),
    /** Public demo: one-click sign-ins, a nightly reset, and a few destructive actions disabled. */
    DEMO_MODE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    /** Password for every seeded account. Required in demo mode, which reseeds by itself. */
    SEED_PASSWORD: z.string().min(8).optional(),
  })
  .refine((env) => !env.DEMO_MODE || env.SEED_PASSWORD, {
    path: ["SEED_PASSWORD"],
    message: "SEED_PASSWORD is required when DEMO_MODE is on",
  });

export type Env = z.infer<typeof schema>;

/** Parses the environment once at startup and exits with a readable message when it is invalid. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${problems}`);
  }
  return result.data;
}
