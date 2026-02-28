import { Client } from '@microsoft/microsoft-graph-client';
import { createAdminClient } from '@/lib/supabase/admin';

interface WebhookSubscription {
  id: string;
  resource: string;
  changeType: string;
  notificationUrl: string;
  expirationDateTime: string;
  clientState: string;
}

export class WebhookService {
  constructor(
    private graphClient: Client,
    private accountId: string
  ) {}

  /**
   * Create a webhook subscription for message notifications
   * Microsoft Graph webhooks expire after max 3 days and need renewal
   */
  async createMessageSubscription(): Promise<WebhookSubscription> {
    const supabase = createAdminClient();

    // Generate client state for validation (random token)
    const clientState = crypto.randomUUID();

    // Webhook notification URL (must be publicly accessible HTTPS)
    const notificationUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/graph`;

    // Subscription expires in 3 days (max for messages resource)
    const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Create subscription via Graph API
      const subscription = await this.graphClient
        .api('/subscriptions')
        .post({
          changeType: 'created,updated,deleted',
          notificationUrl,
          resource: '/me/messages',
          expirationDateTime,
          clientState,
        });

      // Store subscription in database
      await supabase.from('webhook_subscriptions').insert({
        account_id: this.accountId,
        ms_subscription_id: subscription.id,
        resource: subscription.resource,
        change_types: subscription.changeType.split(','),
        notification_url: subscription.notificationUrl,
        expires_at: subscription.expirationDateTime,
        client_state: clientState,
        status: 'active',
      });

      console.log(`Webhook subscription created: ${subscription.id} (expires ${expirationDateTime})`);

      return {
        id: subscription.id,
        resource: subscription.resource,
        changeType: subscription.changeType,
        notificationUrl: subscription.notificationUrl,
        expirationDateTime: subscription.expirationDateTime,
        clientState,
      };
    } catch (error: any) {
      console.error('Failed to create webhook subscription:', error);
      throw new Error(`Webhook subscription failed: ${error.message}`);
    }
  }

  /**
   * Renew an existing webhook subscription
   * Should be called before expiration (we'll do this via background job)
   */
  async renewSubscription(subscriptionId: string): Promise<void> {
    const supabase = createAdminClient();

    try {
      // Get existing subscription from database
      const { data: dbSubscription } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('ms_subscription_id', subscriptionId)
        .single();

      if (!dbSubscription) {
        throw new Error(`Subscription ${subscriptionId} not found in database`);
      }

      // Extend expiration by 3 days
      const newExpirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      // Renew subscription via Graph API
      await this.graphClient
        .api(`/subscriptions/${subscriptionId}`)
        .patch({
          expirationDateTime: newExpirationDateTime,
        });

      // Update database
      await supabase
        .from('webhook_subscriptions')
        .update({
          expires_at: newExpirationDateTime,
          renewed_at: new Date().toISOString(),
        })
        .eq('ms_subscription_id', subscriptionId);

      console.log(`Webhook subscription renewed: ${subscriptionId} (expires ${newExpirationDateTime})`);
    } catch (error: any) {
      console.error(`Failed to renew webhook subscription ${subscriptionId}:`, error);

      // If renewal fails, mark as expired
      await supabase
        .from('webhook_subscriptions')
        .update({
          status: 'expired',
        })
        .eq('ms_subscription_id', subscriptionId);

      throw new Error(`Webhook renewal failed: ${error.message}`);
    }
  }

  /**
   * Delete a webhook subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    const supabase = createAdminClient();

    try {
      // Delete from Graph API
      await this.graphClient
        .api(`/subscriptions/${subscriptionId}`)
        .delete();

      // Update database status
      await supabase
        .from('webhook_subscriptions')
        .update({
          status: 'deleted',
        })
        .eq('ms_subscription_id', subscriptionId);

      console.log(`Webhook subscription deleted: ${subscriptionId}`);
    } catch (error: any) {
      console.error(`Failed to delete webhook subscription ${subscriptionId}:`, error);
      throw new Error(`Webhook deletion failed: ${error.message}`);
    }
  }

  /**
   * Get all active subscriptions for an account
   */
  static async getActiveSubscriptions(accountId: string): Promise<any[]> {
    const supabase = createAdminClient();

    const { data: subscriptions } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return subscriptions || [];
  }

  /**
   * Get subscriptions expiring soon (within 24 hours)
   */
  static async getExpiringSoon(): Promise<any[]> {
    const supabase = createAdminClient();

    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: subscriptions } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('expires_at', in24Hours);

    return subscriptions || [];
  }

  /**
   * Create a webhook subscription for calendar event notifications
   * Same pattern as message subscriptions
   */
  async createCalendarSubscription(): Promise<WebhookSubscription> {
    const supabase = createAdminClient();

    // Generate client state for validation
    const clientState = crypto.randomUUID();

    // Webhook notification URL (must be publicly accessible HTTPS)
    const notificationUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/graph`;

    // Subscription expires in 3 days (max for calendar events resource)
    const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Create subscription via Graph API
      const subscription = await this.graphClient
        .api('/subscriptions')
        .post({
          changeType: 'created,updated,deleted',
          notificationUrl,
          resource: '/me/calendar/events',
          expirationDateTime,
          clientState,
        });

      // Store subscription in database
      await supabase.from('webhook_subscriptions').insert({
        account_id: this.accountId,
        ms_subscription_id: subscription.id,
        resource: subscription.resource,
        change_types: subscription.changeType.split(','),
        notification_url: subscription.notificationUrl,
        expires_at: subscription.expirationDateTime,
        client_state: clientState,
        status: 'active',
      });

      console.log(`Calendar webhook subscription created: ${subscription.id} (expires ${expirationDateTime})`);

      return {
        id: subscription.id,
        resource: subscription.resource,
        changeType: subscription.changeType,
        notificationUrl: subscription.notificationUrl,
        expirationDateTime: subscription.expirationDateTime,
        clientState,
      };
    } catch (error: any) {
      console.error('Failed to create calendar webhook subscription:', error);
      throw new Error(`Calendar webhook subscription failed: ${error.message}`);
    }
  }
}
