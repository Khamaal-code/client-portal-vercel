import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
  email?: string;
  qbState?: string;
};

const sessionPassword = process.env.SESSION_PASSWORD;

if (!sessionPassword) {
  throw new Error("SESSION_PASSWORD is not set");
}

export const sessionOptions = {
  password: sessionPassword,
  cookieName: "kbr_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
