import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface Contact {
  email: string;
  name: string | null;
  messageCount: number;
  lastInteractionAt: string;
}

/**
 * GET /api/contacts
 * Get contacts from message interactions
 *
 * Query Parameters:
 * - accountId (required): Connected account UUID
 * - q (optional): Search query to filter contacts
 * - limit (optional): Number of contacts to return (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // Required parameters
    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Optional parameters
    const query = searchParams.get('q');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20'),
      100
    );

    // Verify account exists and is active
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('id, email, status')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.status !== 'active') {
      return NextResponse.json(
        { error: `Account is ${account.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    // Get all messages for this account to extract contacts
    let messagesQuery = supabase
      .from('messages')
      .select('from_address, from_name, to_recipients, cc_recipients, received_at, sent_at')
      .eq('account_id', accountId)
      .eq('is_deleted', false);

    const { data: messages, error: messagesError } = await messagesQuery;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    // Aggregate contacts from messages
    const contactMap = new Map<string, Contact>();

    for (const message of messages || []) {
      // Process sender
      if (message.from_address) {
        const email = message.from_address.toLowerCase();
        const existing = contactMap.get(email);

        if (existing) {
          existing.messageCount++;
          const msgDate = message.received_at || message.sent_at;
          if (msgDate && (!existing.lastInteractionAt || msgDate > existing.lastInteractionAt)) {
            existing.lastInteractionAt = msgDate;
          }
          if (!existing.name && message.from_name) {
            existing.name = message.from_name;
          }
        } else {
          contactMap.set(email, {
            email,
            name: message.from_name || null,
            messageCount: 1,
            lastInteractionAt: message.received_at || message.sent_at,
          });
        }
      }

      // Process recipients (to, cc)
      const allRecipients = [
        ...(Array.isArray(message.to_recipients) ? message.to_recipients : []),
        ...(Array.isArray(message.cc_recipients) ? message.cc_recipients : []),
      ];

      for (const recipient of allRecipients) {
        if (typeof recipient === 'object' && recipient.address) {
          const email = recipient.address.toLowerCase();

          // Skip if this is the account owner's email
          if (email === account.email.toLowerCase()) {
            continue;
          }

          const existing = contactMap.get(email);
          const msgDate = message.received_at || message.sent_at;

          if (existing) {
            existing.messageCount++;
            if (msgDate && (!existing.lastInteractionAt || msgDate > existing.lastInteractionAt)) {
              existing.lastInteractionAt = msgDate;
            }
            if (!existing.name && recipient.name) {
              existing.name = recipient.name;
            }
          } else {
            contactMap.set(email, {
              email,
              name: recipient.name || null,
              messageCount: 1,
              lastInteractionAt: msgDate,
            });
          }
        }
      }
    }

    // Convert map to array
    let contacts = Array.from(contactMap.values());

    // Apply search filter if provided
    if (query) {
      const searchTerm = query.toLowerCase();
      contacts = contacts.filter(
        (contact) =>
          contact.email.toLowerCase().includes(searchTerm) ||
          (contact.name && contact.name.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by relevance: most recent interaction first, then by message count
    contacts.sort((a, b) => {
      const dateA = a.lastInteractionAt ? new Date(a.lastInteractionAt).getTime() : 0;
      const dateB = b.lastInteractionAt ? new Date(b.lastInteractionAt).getTime() : 0;

      if (dateB !== dateA) {
        return dateB - dateA; // Most recent first
      }

      return b.messageCount - a.messageCount; // Most messages first
    });

    // Limit results
    contacts = contacts.slice(0, limit);

    // Format response
    const formattedContacts = contacts.map((contact) => ({
      email: contact.email,
      displayName: contact.name || contact.email,
      emailAddress: contact.email,
      lastInteractionAt: contact.lastInteractionAt,
      messageCount: contact.messageCount,
    }));

    return NextResponse.json({
      contacts: formattedContacts,
      count: formattedContacts.length,
      total: contactMap.size,
    });
  } catch (error: any) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
