import { getCloudflareContext } from "@opennextjs/cloudflare";

// D1Database type is available from the generated worker-configuration.d.ts
type D1Database = any;

export interface Env {
  DB: D1Database;
}

export async function getEnv(): Promise<Env> {
  const { env } = await getCloudflareContext();
  return env as Env;
}

export async function getDB(): Promise<D1Database> {
  const env = await getEnv();
  return env.DB;
}