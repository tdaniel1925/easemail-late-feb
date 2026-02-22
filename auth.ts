import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { createAdminClient } from '@/lib/supabase/admin';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email offline_access User.Read Mail.ReadWrite Mail.Send Calendars.ReadWrite Chat.ReadWrite Contacts.Read Presence.Read ChannelMessage.Read.All OnlineMeetings.ReadWrite',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (!account) {
        return false;
      }

      try {
        const supabase = createAdminClient();

        // Get or create EaseMail user
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email!)
          .single();

        let userId = existingUser?.id;

        if (!existingUser) {
          // Get or create tenant
          const domain = user.email?.split('@')[1] || 'my-organization';
          let tenant;

          // Try to find existing tenant for this domain
          const { data: existingTenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('name', domain)
            .single();

          if (existingTenant) {
            tenant = existingTenant;
          } else {
            // Create new tenant with unique slug
            const baseSlug = user.email?.split('@')[0] || 'org';
            const uniqueSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

            const { data: newTenant, error: tenantError } = await supabase
              .from('tenants')
              .insert({
                name: domain,
                slug: uniqueSlug,
                plan: 'starter',
              })
              .select()
              .single();

            if (tenantError || !newTenant) {
              console.error('Failed to create tenant:', tenantError);
              return false;
            }

            tenant = newTenant;
          }

          // Create user
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              id: crypto.randomUUID(),
              tenant_id: tenant.id,
              email: user.email!,
              display_name: user.name || user.email,
              avatar_url: user.image,
              role: 'owner',
            })
            .select()
            .single();

          if (userError || !newUser) {
            console.error('Failed to create user:', userError);
            return false;
          }

          userId = newUser.id;
        }

        if (!userId) {
          console.error('Failed to get/create user - no userId');
          return false;
        }

        // Create or update connected_account
        const { data: existingAccount } = await supabase
          .from('connected_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('microsoft_id', account.providerAccountId)
          .single();

        if (!existingAccount) {
          // Create new connected account
          const { error: accountError } = await supabase
            .from('connected_accounts')
            .insert({
              user_id: userId,
              microsoft_id: account.providerAccountId,
              email: user.email!,
              display_name: user.name || user.email,
              avatar_url: user.image,
              tenant_id_ms: account.tenantId,
              account_type: 'work',
              status: 'active',
              is_default: true,
            });

          if (accountError) {
            console.error('Failed to create connected account:', accountError);
            return false;
          }
        }

        // Get the account ID to store tokens
        const { data: connectedAccount } = await supabase
          .from('connected_accounts')
          .select('id')
          .eq('user_id', userId)
          .eq('microsoft_id', account.providerAccountId)
          .single();

        if (connectedAccount && account.access_token && account.refresh_token) {
          // Store tokens
          const expiresAt = account.expires_at
            ? new Date(account.expires_at * 1000)
            : new Date(Date.now() + 3600000); // 1 hour default

          await supabase
            .from('account_tokens')
            .upsert({
              account_id: connectedAccount.id,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              token_type: 'Bearer',
              expires_at: expiresAt.toISOString(),
              scopes: account.scope?.split(' ') || [],
            });
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, account, user }: any) {
      // Don't store tokens in JWT - they're already in the database
      // Just store minimal user info
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Add custom fields to session
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
});
