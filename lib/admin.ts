import { auth, currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hello@tryclean.ai").split(",").map((e) => e.trim().toLowerCase());

export async function requireAdmin(): Promise<{ userId: string; email: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) return null;

  return { userId, email };
}
