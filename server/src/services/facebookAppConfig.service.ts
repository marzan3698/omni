import { prisma } from '../lib/prisma.js';

export interface FacebookConfigInput {
  appId: string;
  appSecret?: string; // optional on update (keep existing if omitted)
  verifyToken: string;
  redirectUriOverride?: string | null;
}

export async function getConfig(companyId: number) {
  const config = await prisma.facebookAppConfig.findUnique({
    where: { companyId },
  });
  return config;
}

export async function saveConfig(companyId: number, data: FacebookConfigInput) {
  const existing = await prisma.facebookAppConfig.findUnique({
    where: { companyId },
  });
  const appSecretToUse =
    data.appSecret != null && String(data.appSecret).trim() !== ''
      ? data.appSecret
      : existing?.appSecret ?? '';
  if (!appSecretToUse) {
    throw new Error('App Secret is required when creating config or when no secret is stored yet.');
  }
  const config = await prisma.facebookAppConfig.upsert({
    where: { companyId },
    update: {
      appId: data.appId,
      appSecret: appSecretToUse,
      verifyToken: data.verifyToken,
      redirectUriOverride: data.redirectUriOverride ?? null,
    },
    create: {
      companyId,
      appId: data.appId,
      appSecret: appSecretToUse,
      verifyToken: data.verifyToken,
      redirectUriOverride: data.redirectUriOverride ?? null,
    },
  });
  return config;
}

export async function getConfigUrls(companyId: number, baseUrl: string) {
  const config = await prisma.facebookAppConfig.findUnique({
    where: { companyId },
    select: { verifyToken: true, redirectUriOverride: true },
  });
  if (!config) return null;
  const base = baseUrl.replace(/\/$/, '');
  const webhookCallbackUrl = `${base}/api/webhooks/facebook`;
  const oauthRedirectUri = config.redirectUriOverride || `${base}/api/integrations/facebook/callback`;
  return {
    webhookCallbackUrl,
    oauthRedirectUri,
    verifyToken: config.verifyToken,
  };
}

export async function getVerifyTokenForWebhook(token: string): Promise<number | null> {
  const config = await prisma.facebookAppConfig.findFirst({
    where: { verifyToken: token },
    select: { companyId: true },
  });
  return config?.companyId ?? null;
}
