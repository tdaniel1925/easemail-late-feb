#!/usr/bin/env node

/**
 * Bootstrap Organization CLI Tool
 *
 * Creates a new tenant and sends the first owner invitation.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-organization.ts
 *
 * Or with arguments:
 *   npx tsx scripts/bootstrap-organization.ts \
 *     --name "Smith & Associates" \
 *     --domain "smithlaw.com" \
 *     --email "mrsmith@smithlaw.com" \
 *     --plan "professional"
 *
 * Required environment variables:
 *   - ADMIN_API_KEY: API key for admin endpoints
 *   - NEXTAUTH_URL: Base URL of the application
 */

import * as readline from 'readline';

interface OrganizationInput {
  organizationName: string;
  domain: string;
  ownerEmail: string;
  ownerName?: string;
  plan: 'free' | 'professional' | 'enterprise';
}

// Parse command-line arguments
function parseArgs(): Partial<OrganizationInput> {
  const args = process.argv.slice(2);
  const result: Partial<OrganizationInput> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
        result.organizationName = args[++i];
        break;
      case '--domain':
        result.domain = args[++i];
        break;
      case '--email':
        result.ownerEmail = args[++i];
        break;
      case '--owner-name':
        result.ownerName = args[++i];
        break;
      case '--plan':
        result.plan = args[++i] as 'free' | 'professional' | 'enterprise';
        break;
    }
  }

  return result;
}

// Prompt user for input
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function collectInput(): Promise<OrganizationInput> {
  const args = parseArgs();

  console.log('\n🚀 Bootstrap New Organization\n');

  const organizationName =
    args.organizationName || (await prompt('Organization Name: '));
  const domain = args.domain || (await prompt('Domain (e.g., acme.com): '));
  const ownerEmail =
    args.ownerEmail || (await prompt('Owner Email: '));
  const ownerName = args.ownerName || (await prompt('Owner Name (optional): '));
  const planInput =
    args.plan ||
    (await prompt('Plan (free/professional/enterprise) [professional]: '));
  const plan = (planInput || 'professional') as 'free' | 'professional' | 'enterprise';

  return {
    organizationName: organizationName.trim(),
    domain: domain.trim().toLowerCase(),
    ownerEmail: ownerEmail.trim().toLowerCase(),
    ownerName: ownerName.trim() || undefined,
    plan,
  };
}

async function bootstrapOrganization() {
  try {
    // Check for required environment variables
    if (!process.env.ADMIN_API_KEY) {
      console.error('❌ Error: ADMIN_API_KEY environment variable is required');
      console.error('   Set it in your .env.local file');
      process.exit(1);
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Collect input
    const input = await collectInput();

    console.log('\n📋 Summary:');
    console.log(`   Organization: ${input.organizationName}`);
    console.log(`   Domain: ${input.domain}`);
    console.log(`   Owner Email: ${input.ownerEmail}`);
    if (input.ownerName) {
      console.log(`   Owner Name: ${input.ownerName}`);
    }
    console.log(`   Plan: ${input.plan}`);
    console.log('');

    const confirmation = await prompt('Create this organization? (yes/no): ');
    if (confirmation.toLowerCase() !== 'yes' && confirmation.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      process.exit(0);
    }

    console.log('\n⏳ Creating organization...');

    // Call the bootstrap API
    const response = await fetch(`${baseUrl}/api/admin/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-api-key': process.env.ADMIN_API_KEY,
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`\n❌ Error: ${data.error}`);
      if (data.details) {
        console.error(`   Details: ${data.details}`);
      }
      process.exit(1);
    }

    // Success!
    console.log('\n✅ Organization created successfully!\n');
    console.log('📊 Tenant Details:');
    console.log(`   ID: ${data.tenant.id}`);
    console.log(`   Name: ${data.tenant.display_name}`);
    console.log(`   Domain: ${data.tenant.name}`);
    console.log(`   Plan: ${data.tenant.plan}`);
    console.log('');
    console.log('📧 Owner Invitation:');
    console.log(`   Email: ${data.invitation.email}`);
    console.log(`   Role: ${data.invitation.role}`);
    console.log(`   Expires: ${new Date(data.invitation.expires_at).toLocaleString()}`);
    console.log('');
    console.log('🔗 Invitation URL:');
    console.log(`   ${data.invitation.invite_url}`);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Copy the invitation URL above');
    console.log('   2. Send it to the organization owner');
    console.log('   3. They will sign in with their Microsoft 365 account');
    console.log('   4. Once signed in, they can invite their team members');
    console.log('');
  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the CLI
bootstrapOrganization();
