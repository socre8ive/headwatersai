// D1Database type is available from the generated worker-configuration.d.ts
type D1Database = any;

export interface CloudflareEnv {
  DB: D1Database;
}

export function getDB(env: CloudflareEnv): D1Database {
  return env.DB;
}

export async function executeQuery<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await db.prepare(query).bind(...params).all() as { results: T[] };
  return result.results;
}

export async function executeRun(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<any> {
  return await db.prepare(query).bind(...params).run();
}

export async function executeFirst<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  return await db.prepare(query).bind(...params).first() as T | null;
}

export interface D1Result {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}