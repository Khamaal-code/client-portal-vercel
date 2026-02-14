import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 15;

export function generateOtp() {
  const code = Array.from({ length: OTP_LENGTH }, () => Math.floor(Math.random() * 10)).join("");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  return { code, expiresAt };
}

export function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
