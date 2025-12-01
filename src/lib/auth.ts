// D1Database type is available from the generated worker-configuration.d.ts
type D1Database = any; // Temporary fix for build
import { generateId, getCurrentTimestamp } from "./db";

const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  subscriptionTier: "free" | "enthusiast" | "professional" | "enterprise";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const salt = generateId().replace(/-/g, "").substring(0, 16);
  const saltedHash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(salt + hashHex)
  );
  const saltedHashArray = Array.from(new Uint8Array(saltedHash));
  const saltedHashHex = saltedHashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return `${salt}:${saltedHashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const saltedHash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(salt + hashHex)
  );
  const saltedHashArray = Array.from(new Uint8Array(saltedHash));
  const saltedHashHex = saltedHashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return saltedHashHex === hash;
}

export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> {
  const existingUser = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email.toLowerCase())
    .first();

  if (existingUser) {
    return { success: false, error: "Email already registered" };
  }

  const passwordHash = await hashPassword(password);
  const userId = generateId();
  const now = getCurrentTimestamp();

  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, full_name, subscription_tier, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'free', ?, ?)`
    )
    .bind(userId, email.toLowerCase(), passwordHash, fullName || null, now, now)
    .run();

  const session = await createSession(db, userId);

  const user: User = {
    id: userId,
    email: email.toLowerCase(),
    fullName: fullName || null,
    subscriptionTier: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: now,
    updatedAt: now,
  };

  return { success: true, user, session };
}

export async function authenticateUser(
  db: D1Database,
  email: string,
  password: string
): Promise<AuthResult> {
  const row = await db
    .prepare(
      `SELECT id, email, password_hash, full_name, subscription_tier,
              stripe_customer_id, stripe_subscription_id, created_at, updated_at
       FROM users WHERE email = ?`
    )
    .bind(email.toLowerCase())
    .first() as {
      id: string;
      email: string;
      password_hash: string;
      full_name: string | null;
      subscription_tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      created_at: string;
      updated_at: string;
    } | null;

  if (!row) {
    return { success: false, error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(password, row.password_hash);
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  const session = await createSession(db, row.id);

  const user: User = {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    subscriptionTier: row.subscription_tier as User["subscriptionTier"],
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return { success: true, user, session };
}

export async function createSession(db: D1Database, userId: string): Promise<Session> {
  const sessionId = generateId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const createdAt = getCurrentTimestamp();
  const expiresAtStr = expiresAt.toISOString().replace("T", " ").split(".")[0];

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(sessionId, userId, expiresAtStr, createdAt)
    .run();

  return {
    id: sessionId,
    userId,
    expiresAt: expiresAtStr,
    createdAt,
  };
}

export async function validateSession(
  db: D1Database,
  sessionId: string
): Promise<{ user: User; session: Session } | null> {
  const row = await db
    .prepare(
      `SELECT s.id as session_id, s.user_id, s.expires_at, s.created_at as session_created,
              u.id, u.email, u.full_name, u.subscription_tier,
              u.stripe_customer_id, u.stripe_subscription_id, u.created_at, u.updated_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`
    )
    .bind(sessionId)
    .first() as {
      session_id: string;
      user_id: string;
      expires_at: string;
      session_created: string;
      id: string;
      email: string;
      full_name: string | null;
      subscription_tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      created_at: string;
      updated_at: string;
    } | null;

  if (!row) {
    return null;
  }

  const expiresAt = new Date(row.expires_at.replace(" ", "T") + "Z");
  if (expiresAt < new Date()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    return null;
  }

  const user: User = {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    subscriptionTier: row.subscription_tier as User["subscriptionTier"],
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const session: Session = {
    id: row.session_id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.session_created,
  };

  return { user, session };
}

export async function invalidateSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}

export async function invalidateAllUserSessions(db: D1Database, userId: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

export async function updateUserPassword(
  db: D1Database,
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const row = await db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .bind(userId)
    .first() as { password_hash: string } | null;

  if (!row) {
    return { success: false, error: "User not found" };
  }

  const isValid = await verifyPassword(currentPassword, row.password_hash);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

  const newHash = await hashPassword(newPassword);
  const now = getCurrentTimestamp();

  await db
    .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .bind(newHash, now, userId)
    .run();

  await invalidateAllUserSessions(db, userId);

  return { success: true };
}

export async function updateUserProfile(
  db: D1Database,
  userId: string,
  updates: { fullName?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.fullName !== undefined) {
    fields.push("full_name = ?");
    values.push(updates.fullName);
  }

  if (updates.email !== undefined) {
    const existing = await db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .bind(updates.email.toLowerCase(), userId)
      .first();

    if (existing) {
      return { success: false, error: "Email already in use" };
    }

    fields.push("email = ?");
    values.push(updates.email.toLowerCase());
  }

  if (fields.length === 0) {
    return { success: true };
  }

  fields.push("updated_at = ?");
  values.push(getCurrentTimestamp());
  values.push(userId);

  await db
    .prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return { success: true };
}

export async function updateUserSubscription(
  db: D1Database,
  userId: string,
  tier: User["subscriptionTier"],
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const now = getCurrentTimestamp();

  await db
    .prepare(
      `UPDATE users
       SET subscription_tier = ?, stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(tier, stripeCustomerId || null, stripeSubscriptionId || null, now, userId)
    .run();
}

export async function getUserById(db: D1Database, userId: string): Promise<User | null> {
  const row = await db
    .prepare(
      `SELECT id, email, full_name, subscription_tier,
              stripe_customer_id, stripe_subscription_id, created_at, updated_at
       FROM users WHERE id = ?`
    )
    .bind(userId)
    .first() as {
      id: string;
      email: string;
      full_name: string | null;
      subscription_tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      created_at: string;
      updated_at: string;
    } | null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    subscriptionTier: row.subscription_tier as User["subscriptionTier"],
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const row = await db
    .prepare(
      `SELECT id, email, full_name, subscription_tier,
              stripe_customer_id, stripe_subscription_id, created_at, updated_at
       FROM users WHERE email = ?`
    )
    .bind(email.toLowerCase())
    .first() as {
      id: string;
      email: string;
      full_name: string | null;
      subscription_tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      created_at: string;
      updated_at: string;
    } | null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    subscriptionTier: row.subscription_tier as User["subscriptionTier"],
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canAccessFeature(
  user: User | null,
  feature: "realtime_data" | "water_quality" | "alerts" | "water_rights" | "api_access" | "multi_location"
): boolean {
  if (!user) {
    return false;
  }

  const tierLevel: Record<User["subscriptionTier"], number> = {
    free: 0,
    enthusiast: 1,
    professional: 2,
    enterprise: 3,
  };

  const featureRequirements: Record<typeof feature, number> = {
    realtime_data: 1,
    water_quality: 1,
    alerts: 1,
    water_rights: 2,
    api_access: 2,
    multi_location: 2,
  };

  return tierLevel[user.subscriptionTier] >= featureRequirements[feature];
}

export function cleanupExpiredSessions(db: D1Database): Promise<void> {
  const now = getCurrentTimestamp();
  return db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run().then(() => {});
}