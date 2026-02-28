import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createGraphClient } from '@/lib/graph/client';

/**
 * GET /api/mail/folders
 * Get all folders for an account
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
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

    // Verify account exists, is active, and belongs to the user's tenant
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id, status')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get all folders for the account (excluding hidden and non-primary duplicates)
    const { data: folders, error: foldersError } = await supabase
      .from('account_folders')
      .select('*')
      .eq('account_id', accountId)
      .eq('tenant_id', user.tenant_id)
      .is('is_hidden', false)
      .eq('is_primary', true) // Only show primary folders (filters out duplicates like "INBOX" vs "Inbox")
      .order('display_name');

    if (foldersError) {
      return NextResponse.json(
        { error: foldersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      folders: folders || [],
      count: folders?.length || 0,
    });
  } catch (error: any) {
    console.error('Get folders error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mail/folders
 * Create a new folder
 *
 * Body:
 * {
 *   "accountId": "uuid",
 *   "displayName": "My Folder",
 *   "parentFolderId": "uuid" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();

    if (!body.accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    if (!body.displayName) {
      return NextResponse.json(
        { error: 'displayName is required' },
        { status: 400 }
      );
    }

    // Verify account exists, is active, and belongs to the user's tenant
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id, status')
      .eq('id', body.accountId)
      .eq('user_id', user.id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!account || account.status !== 'active') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 400 }
      );
    }

    // Get Graph client
    const graphClient = await createGraphClient(body.accountId);

    // Create folder via Graph API
    let graphFolder;
    try {
      if (body.parentFolderId) {
        // Get parent folder's graph_id
        const { data: parentFolder } = await supabase
          .from('account_folders')
          .select('graph_id')
          .eq('id', body.parentFolderId)
          .eq('account_id', body.accountId)
          .eq('tenant_id', user.tenant_id)
          .single();

        if (!parentFolder) {
          return NextResponse.json(
            { error: 'Parent folder not found' },
            { status: 404 }
          );
        }

        // Create as child folder
        graphFolder = await graphClient
          .api(`/me/mailFolders/${parentFolder.graph_id}/childFolders`)
          .post({
            displayName: body.displayName,
          });
      } else {
        // Create as top-level folder
        graphFolder = await graphClient
          .api('/me/mailFolders')
          .post({
            displayName: body.displayName,
          });
      }
    } catch (graphError: any) {
      console.error('Graph API create folder error:', graphError);

      if (graphError.statusCode === 401) {
        return NextResponse.json(
          { error: 'Token expired', reauth: true },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Failed to create folder: ${graphError.message}` },
        { status: 500 }
      );
    }

    // Store folder in database
    const { data: newFolder, error: insertError } = await supabase
      .from('account_folders')
      .insert({
        account_id: body.accountId,
        graph_id: graphFolder.id,
        display_name: graphFolder.displayName,
        parent_graph_id: graphFolder.parentFolderId || null,
        folder_type: 'custom',
        unread_count: 0,
        total_count: 0,
        is_hidden: false,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store folder in database:', insertError);
      // Don't fail - the folder was created in Graph API
    }

    return NextResponse.json({
      success: true,
      folder: newFolder || {
        id: graphFolder.id,
        display_name: graphFolder.displayName,
      },
    });
  } catch (error: any) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
