import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface BkashKeys {
    appKey: string;
    appSecret: string;
    username: string;
    password: string;
    isLive: boolean;
}

export const bkashService = {
    /**
     * Helper to fetch keys from `system_settings`
     */
    async getKeys(companyId: number): Promise<BkashKeys> {
        const settings = await prisma.systemSetting.findMany({
            where: {
                companyId,
                key: { startsWith: 'bkash_' }
            }
        });

        const parsed = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        if (!parsed['bkash_is_active'] || parsed['bkash_is_active'] !== 'true') {
            throw new AppError('bKash gateway is not active for this company', 400);
        }

        if (!parsed['bkash_app_key'] || !parsed['bkash_app_secret'] || !parsed['bkash_username'] || !parsed['bkash_password']) {
            throw new AppError('Incomplete bKash settings configured for this company', 400);
        }

        return {
            appKey: parsed['bkash_app_key'],
            appSecret: parsed['bkash_app_secret'],
            username: parsed['bkash_username'],
            password: parsed['bkash_password'],
            isLive: parsed['bkash_is_live'] === 'true'
        };
    },

    /**
     * Helper to get baseUrl based on environment
     */
    getBaseUrl(isLive: boolean) {
        if (isLive) {
            return 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
        }
        return 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout';
    },

    /**
     * Grant Token: Get or refresh the token
     */
    async grantToken(companyId: number): Promise<string> {
        const tokenKey = 'bkash_cached_token';
        const cachedTokenSetting = await prisma.systemSetting.findFirst({
            where: { companyId, key: tokenKey }
        });

        if (cachedTokenSetting) {
            try {
                const cached = JSON.parse(cachedTokenSetting.value);
                if (cached.expiresAt > Date.now() + 5 * 60 * 1000) {
                    return cached.idToken;
                }
            } catch (e) {
                // Silently fail parse
            }
        }

        const keys = await this.getKeys(companyId);
        const baseUrl = this.getBaseUrl(keys.isLive);

        try {
            const response = await axios.post(`${baseUrl}/token/grant`, {
                app_key: keys.appKey,
                app_secret: keys.appSecret
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': keys.username,
                    'password': keys.password,
                }
            });

            if (response.data?.statusCode === '0000' || !response.data?.statusCode) {
                const idToken = response.data.id_token;
                const expiresIn = response.data.expires_in || 3600;

                await prisma.systemSetting.upsert({
                    where: { companyId_key: { companyId, key: tokenKey } },
                    update: {
                        value: JSON.stringify({
                            idToken,
                            expiresAt: Date.now() + expiresIn * 1000
                        })
                    },
                    create: {
                        companyId,
                        key: tokenKey,
                        value: JSON.stringify({
                            idToken,
                            expiresAt: Date.now() + expiresIn * 1000
                        })
                    }
                });

                return idToken;
            } else {
                throw new Error(response.data?.statusMessage || 'Token generation failed');
            }
        } catch (error: any) {
            console.error('Bkash Grant Token Error:', error.response?.data || error.message);
            const msg = error.response?.data?.statusMessage || error.message || 'Could not communicate with bKash gateway';
            throw new AppError(msg, 400);
        }
    },

    /**
     * Create Payment
     */
    async createPayment(companyId: number, invoiceId: number, amount: number, callbackUrl: string) {
        const keys = await this.getKeys(companyId);
        const baseUrl = this.getBaseUrl(keys.isLive);
        const idToken = await this.grantToken(companyId);

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true }
        });

        if (!invoice) throw new AppError('Invoice not found', 404);

        try {
            const formattedAmount = Number(amount).toFixed(2);

            const payload = {
                mode: '0011',
                payerReference: String(invoice.clientId),
                callbackURL: callbackUrl,
                amount: formattedAmount,
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber: invoice.invoiceNumber
            };

            const response = await axios.post(`${baseUrl}/create`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': idToken,
                    'X-APP-Key': keys.appKey,
                }
            });

            if (response.data?.statusCode !== '0000') {
                throw new Error(response.data?.statusMessage || 'Payment creation failed');
            }

            return {
                paymentID: response.data.paymentID,
                bkashURL: response.data.bkashURL,
                amount: response.data.amount,
                merchantInvoiceNumber: response.data.merchantInvoiceNumber
            };

        } catch (error: any) {
            console.error('Bkash Create Payment Error:', error.response?.data || error.message);
            const msg = error.response?.data?.statusMessage || error.message || 'Failed to create bKash checkout order';
            throw new AppError(msg, 400);
        }
    },

    /**
     * Execute Payment
     */
    async executePayment(companyId: number, paymentID: string) {
        const keys = await this.getKeys(companyId);
        const baseUrl = this.getBaseUrl(keys.isLive);
        const idToken = await this.grantToken(companyId);

        try {
            const response = await axios.post(`${baseUrl}/execute`, { paymentID }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': idToken,
                    'X-APP-Key': keys.appKey,
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Bkash Execute Payment Error:', error.response?.data || error.message);
            const msg = error.response?.data?.statusMessage || error.message || 'Failed to execute bKash payment';
            throw new AppError(msg, 400);
        }
    },

    /**
     * Query Payment
     */
    async queryPayment(companyId: number, paymentID: string) {
        const keys = await this.getKeys(companyId);
        const baseUrl = this.getBaseUrl(keys.isLive);
        const idToken = await this.grantToken(companyId);

        try {
            const response = await axios.post(`${baseUrl}/payment/status`, { paymentID }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': idToken,
                    'X-APP-Key': keys.appKey,
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Bkash Query Payment Error:', error.response?.data || error.message);
            const msg = error.response?.data?.statusMessage || error.message || 'Failed to query bKash payment';
            throw new AppError(msg, 400);
        }
    }
};
