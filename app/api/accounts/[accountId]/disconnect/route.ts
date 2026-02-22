import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tokenService } from '@/lib/graph/token-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const supabase = await createClient();

    // Verify account exists and belongs to user
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Revoke tokens
    await tokenService.revokeTokens(accountId);

    // Delete webhook subscriptions
    await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('account_id', accountId);

    // Delete sync state
    await supabase
      .from('sync_state')
      .delete()
      .eq('account_id', accountId);

    // Update account status to disconnected
    await supabase
      .from('connected_accounts')
      .update({
        status: 'disabled',
        status_message: 'Account disconnected by user',
      })
      .eq('id', accountId);

    // Note: We don't delete messages immediately - they're soft-deleted
    // and will be cleaned up by a background job after 30 days

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
    });
  } catch (error: any) {
    console.error('Disconnect account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
