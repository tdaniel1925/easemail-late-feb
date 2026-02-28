import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';
import { MessageDeltaSyncService } from '@/lib/graph/message-delta-sync';

interface GraphNotification {
  subscriptionId: string;
  clientState: string;
  changeType: string;
  resource: string;
  resourceData: {
    '@odata.type': string;
    '@odata.id': string;
    id: string;
  };
}

/**
 * POST /api/webhooks/graph
 * Webhook handler for Microsoft Graph change notifications
 *
 * Microsoft Graph sends two types of requests:
 * 1. Validation request (with validationToken query param) - respond immediately
 * 2. Change notification (POST with notification payload) - process asynchronously
 *
 * SECURITY NOTE: This endpoint uses admin client because it's called by Microsoft Graph,
 * not by authenticated users. Security is validated through client state verification.
 */
export async function POST(request: NextRequest) {
  try {
    // Check for validation request (subscription setup)
    const validationToken = request.nextUrl.searchParams.get('validationToken');

    if (validationToken) {
      // This is a validation request from Microsoft Graph
      // Return the token immediately with 200 OK and text/plain
      console.log('[Webhook] Validation request received');
      return new NextResponse(validationToken, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // This is a change notification
    const body = await request.json();
    const notifications: GraphNotification[] = body.value || [];

    console.log(`[Webhook] Received ${notifications.length} change notifications`);

    // Validate all notifications have required fields
    for (const notification of notifications) {
      if (!notification.subscriptionId || !notification.clientState) {
        console.error('[Webhook] Invalid notification - missing subscriptionId or clientState');
        return NextResponse.json(
          { error: 'Invalid notification format' },
          { status: 400 }
        );
      }
    }

    // Process notifications asynchronously
    // We respond with 202 Accepted immediately to avoid timeout
    processNotifications(notifications);

    return NextResponse.json(
      { received: notifications.length },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process notifications asynchronously
 * This runs in the background after we've responded to Microsoft Graph
 */
async function processNotifications(notifications: GraphNotification[]) {
  const supabase = createAdminClient();

  for (const notification of notifications) {
    try {
      console.log(`[Webhook] Processing notification: ${notification.subscriptionId} (${notification.changeType})`);

      // Validate client state
      const { data: subscription } = await supabase
        .from('webhook_subscriptions')
        .select('*, account:connected_accounts(id, email)')
        .eq('ms_subscription_id', notification.subscriptionId)
        .single();

      if (!subscription) {
        console.error(`[Webhook] Subscription not found: ${notification.subscriptionId}`);
        continue;
      }

      if (subscription.client_state !== notification.clientState) {
        console.error(`[Webhook] Client state mismatch for subscription: ${notification.subscriptionId}`);
        continue;
      }

      // Log notification
      await supabase.from('webhook_logs').insert({
        subscription_id: subscription.id,
        notification_id: crypto.randomUUID(),
        change_type: notification.changeType,
        resource: notification.resource,
        resource_id: notification.resourceData?.id,
        received_at: new Date().toISOString(),
      });

      // Trigger delta sync for the account
      // We sync all messages since we don't know which folder changed
      console.log(`[Webhook] Triggering delta sync for account: ${subscription.account.email}`);

      const graphClient = await createGraphClient(subscription.account_id);
      const messageSync = new MessageDeltaSyncService(
        graphClient,
        subscription.account_id
      );

      await messageSync.syncMessages();

      console.log(`[Webhook] Delta sync completed for ${subscription.account.email}`);
    } catch (error: any) {
      console.error(`[Webhook] Error processing notification:`, error);
      // Continue processing other notifications
    }
  }
}

/**
 * GET /api/webhooks/graph
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Microsoft Graph webhook endpoint is active',
  });
}
