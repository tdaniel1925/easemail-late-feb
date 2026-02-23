import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Fix folder types for well-known Microsoft folders
    const updates = [
      { name: 'Inbox', type: 'inbox' },
      { name: 'Sent Items', type: 'sentitems' },
      { name: 'Drafts', type: 'drafts' },
      { name: 'Deleted Items', type: 'deleteditems' },
      { name: 'Archive', type: 'archive' },
      { name: 'Junk Email', type: 'junkemail' },
      { name: 'Outbox', type: 'outbox' },
    ];

    const results = [];

    for (const { name, type } of updates) {
      const { data, error } = await supabase
        .from('account_folders')
        .update({ folder_type: type })
        .eq('display_name', name);

      results.push({
        folder: name,
        type,
        success: !error,
        error: error?.message,
      });
    }

    return NextResponse.json({
      message: 'Folder types updated',
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
