import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const realmId = requireEnv("QB_REALM_ID");
  const accessToken = requireEnv("QB_ACCESS_TOKEN");
  const refreshToken = requireEnv("QB_REFRESH_TOKEN");
  const expiresAtRaw = process.env.QB_TOKEN_EXPIRES_AT;
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : new Date(Date.now() + 55 * 60 * 1000);

  const existing = await prisma.quickBooksToken.findFirst();

  if (existing) {
    await prisma.quickBooksToken.update({
      where: { id: existing.id },
      data: {
        realmId,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } else {
    await prisma.quickBooksToken.create({
      data: {
        realmId,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
