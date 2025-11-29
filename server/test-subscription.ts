import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSubscription() {
  try {
    const integration = await prisma.integration.findFirst({
      where: { provider: 'facebook' }
    });

    if (!integration) {
      console.log('❌ No Facebook integration found');
      await prisma.$disconnect();
      return;
    }

    const pageId = integration.pageId;
    const accessToken = integration.accessToken;

    console.log('Testing Facebook API...');
    console.log('Page ID:', pageId);
    console.log('Access Token (first 30 chars):', accessToken.substring(0, 30) + '...\n');

    // Test 1: Check if we can access the page
    try {
      const pageInfo = await axios.get(`https://graph.facebook.com/v21.0/${pageId}`, {
        params: {
          access_token: accessToken,
          fields: 'id,name'
        }
      });
      console.log('✅ Page Info:', pageInfo.data);
    } catch (error: any) {
      console.error('❌ Page Access Error:', error.response?.data?.error || error.message);
      if (error.response?.data?.error) {
        console.error('  Code:', error.response.data.error.code);
        console.error('  Type:', error.response.data.error.type);
        console.error('  Message:', error.response.data.error.message);
      }
    }

    // Test 2: Check subscriptions
    try {
      const subscriptions = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`, {
        params: {
          access_token: accessToken
        }
      });
      console.log('\n✅ Subscriptions Response:');
      console.log(JSON.stringify(subscriptions.data, null, 2));
      
      const appId = process.env.FACEBOOK_APP_ID || '1362036352081793';
      const subs = subscriptions.data.data || [];
      const isSubscribed = subs.some((sub: any) => sub.id === appId);
      
      console.log('\n📊 Subscription Status:');
      console.log('  App ID:', appId);
      console.log('  Is Subscribed:', isSubscribed);
      console.log('  Total Subscriptions:', subs.length);
    } catch (error: any) {
      console.error('\n❌ Subscription Check Error:');
      console.error('  Response:', error.response?.data || error.message);
      if (error.response?.data?.error) {
        console.error('  Code:', error.response.data.error.code);
        console.error('  Type:', error.response.data.error.type);
        console.error('  Message:', error.response.data.error.message);
        console.error('  Subcode:', error.response.data.error.error_subcode);
      }
    }

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Test Error:', error.message);
    await prisma.$disconnect();
  }
}

testSubscription();

