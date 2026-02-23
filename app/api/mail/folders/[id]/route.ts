import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGraphClient } from '@/lib/graph/client';

/**
 * GET /api/mail/folders/[id]
 * Get a single folder by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const folderId = params.id;

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    const { data: folder, error } = await supabase
      .from('account_folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (error || !folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ folder });
  } catch (error: any) {
    console.error('Get folder error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mail/folders/[id]
 * Rename a folder
 *
 * Body:
 * {
 *   "displayName": "New Name"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const folderId = params.id;
    const body = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    if (!body.displayName) {
      return NextResponse.json(
        { error: 'displayName is required' },
        { status: 400 }
      );
    }

    // Get the folder
    const { data: folder, error: folderError } = await supabase
      .from('account_folders')
      .select('id, account_id, graph_id, display_name, folder_type')
      .eq('id', folderId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Don't allow renaming system folders
    const systemTypes = ['inbox', 'drafts', 'sentitems', 'deleteditems', 'junkemail'];
    if (systemTypes.includes(folder.folder_type)) {
      return NextResponse.json(
        { error: 'Cannot rename system folders' },
        { status: 400 }
      );
    }

    // Verify account exists and is active
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id, status')
      .eq('id', folder.account_id)
      .single();

    if (!account || account.status !== 'active') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 400 }
      );
    }

    // Get Graph client
    const graphClient = await createGraphClient(folder.account_id);

    // Rename folder via Graph API
    try {
      await graphClient
        .api(`/me/mailFolders/${folder.graph_id}`)
        .patch({
          displayName: body.displayName,
        });
    } catch (graphError: any) {
      console.error('Graph API rename folder error:', graphError);

      if (graphError.statusCode === 401) {
        return NextResponse.json(
          { error: 'Token expired', reauth: true },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Failed to rename folder: ${graphError.message}` },
        { status: 500 }
      );
    }

    // Update folder in database
    const { data: updatedFolder, error: updateError } = await supabase
      .from('account_folders')
      .update({
        display_name: body.displayName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update folder in database:', updateError);
    }

    return NextResponse.json({
      success: true,
      folder: updatedFolder || folder,
    });
  } catch (error: any) {
    console.error('Rename folder error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mail/folders/[id]
 * Delete a folder
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const folderId = params.id;

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    // Get the folder
    const { data: folder, error: folderError } = await supabase
      .from('account_folders')
      .select('id, account_id, graph_id, display_name, folder_type')
      .eq('id', folderId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting system folders
    const systemTypes = ['inbox', 'drafts', 'sentitems', 'deleteditems', 'junkemail'];
    if (systemTypes.includes(folder.folder_type)) {
      return NextResponse.json(
        { error: 'Cannot delete system folders' },
        { status: 400 }
      );
    }

    // Verify account exists and is active
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id, status')
      .eq('id', folder.account_id)
      .single();

    if (!account || account.status !== 'active') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 400 }
      );
    }

    // Get Graph client
    const graphClient = await createGraphClient(folder.account_id);

    // Delete folder via Graph API
    try {
      await graphClient
        .api(`/me/mailFolders/${folder.graph_id}`)
        .delete();
    } catch (graphError: any) {
      console.error('Graph API delete folder error:', graphError);

      if (graphError.statusCode === 401) {
        return NextResponse.json(
          { error: 'Token expired', reauth: true },
          { status: 401 }
        );
      }

      if (graphError.statusCode === 404) {
        // Folder already deleted in Graph, just clean up database
        console.log('Folder already deleted in Graph API, cleaning up database');
      } else {
        return NextResponse.json(
          { error: `Failed to delete folder: ${graphError.message}` },
          { status: 500 }
        );
      }
    }

    // Delete folder from database
    // Note: CASCADE will delete related messages and sync state
    const { error: deleteError } = await supabase
      .from('account_folders')
      .delete()
      .eq('id', folderId);

    if (deleteError) {
      console.error('Failed to delete folder from database:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete folder from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
