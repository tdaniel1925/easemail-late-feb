import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClient } from '@/lib/graph/client';
import { WebhookService } from '@/lib/graph/webhook-service';

/**
 * POST /api/webhooks/manage
 * Create a new webhook subscription for an account
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Verify account exists and is active (RLS: tenant-scoped)
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.status !== 'active') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Cannot create webhook.` },
        { status: 400 }
      );
    }

    // Get Graph client for this account
    const graphClient = await createGraphClient(accountId);

    // Create webhook subscription
    const webhookService = new WebhookService(graphClient, accountId);
    const subscription = await webhookService.createMessageSubscription();

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error: any) {
    console.error('Webhook creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/manage?subscriptionId=xxx
 * Delete a webhook subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get subscription from database (RLS will filter by tenant)
    const { data: subscription } = await supabase
      .from('webhook_subscriptions')
      .select('account_id')
      .eq('ms_subscription_id', subscriptionId)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get Graph client for this account
    const graphClient = await createGraphClient(subscription.account_id);

    // Delete webhook subscription
    const webhookService = new WebhookService(graphClient, subscription.account_id);
    await webhookService.deleteSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      message: 'Webhook subscription deleted',
    });
  } catch (error: any) {
    console.error('Webhook deletion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/manage?accountId=xxx
 * Get all webhook subscriptions for an account
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const accountId = request.nextUrl.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Verify account belongs to user's tenant (RLS check)
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const subscriptions = await WebhookService.getActiveSubscriptions(accountId);

    return NextResponse.json({
      subscriptions,
    });
  } catch (error: any) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
