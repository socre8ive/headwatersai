import { getCloudflareContext } from "@opennextjs/cloudflare";
import { D1Database } from "@cloudflare/workers-types";

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