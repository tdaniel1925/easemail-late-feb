// Comprehensive diagnostic and fix script
const accountId = 'f817b168-8de0-462b-a676-9e9b8295e8d5';

async function runDiagnostics() {
  console.log('=== EASEMAIL DIAGNOSTIC & FIX ===\n');

  // 1. Fix folder types
  console.log('1. Fixing folder types...');
  try {
    const fixRes = await fetch('http://localhost:3000/api/debug/fix-folder-types', {
      method: 'POST',
    });
    const fixData = await fixRes.json();
    console.log('   ✓ Folder types fixed:', JSON.stringify(fixData, null, 2));
  } catch (err) {
    console.log('   ✗ Error fixing folder types:', err.message);
  }

  // 2. Test folders API
  console.log('\n2. Testing folders API...');
  try {
    const foldersRes = await fetch(`http://localhost:3000/api/mail/folders?accountId=${accountId}`);
    const foldersData = await foldersRes.json();
    console.log(`   ✓ Found ${foldersData.folders?.length || 0} folders`);

    // Show folder types
    if (foldersData.folders) {
      const systemFolders = foldersData.folders.filter(f =>
        f.folder_type && ['inbox', 'sentitems', 'drafts', 'deleteditems', 'archive'].includes(f.folder_type)
      );
      const customFolders = foldersData.folders.filter(f =>
        !f.folder_type || !['inbox', 'sentitems', 'drafts', 'deleteditems', 'archive'].includes(f.folder_type)
      );

      console.log(`   - System folders: ${systemFolders.length}`);
      systemFolders.forEach(f => console.log(`     * ${f.display_name} (${f.folder_type})`));

      console.log(`   - Custom folders: ${customFolders.length}`);
      customFolders.slice(0, 5).forEach(f => console.log(`     * ${f.display_name} (${f.folder_type || 'null'})`));
    }
  } catch (err) {
    console.log('   ✗ Error testing folders:', err.message);
  }

  // 3. Test messages API
  console.log('\n3. Testing messages API...');
  try {
    const messagesRes = await fetch(`http://localhost:3000/api/mail/messages?accountId=${accountId}&limit=5`);
    const messagesData = await messagesRes.json();
    console.log(`   ✓ Found ${messagesData.total || 0} total messages, showing ${messagesData.messages?.length || 0}`);

    if (messagesData.messages && messagesData.messages.length > 0) {
      const msg = messagesData.messages[0];
      console.log(`   - Sample message: "${msg.subject}"`);
      console.log(`     From: ${msg.from_name} <${msg.from_address}>`);
      console.log(`     Has TO recipients: ${!!msg.to_recipients}`);
      console.log(`     Has CC recipients: ${!!msg.cc_recipients}`);
    }
  } catch (err) {
    console.log('   ✗ Error testing messages:', err.message);
  }

  // 4. Test single message API
  console.log('\n4. Testing single message API...');
  try {
    const messagesRes = await fetch(`http://localhost:3000/api/mail/messages?accountId=${accountId}&limit=1`);
    const messagesData = await messagesRes.json();

    if (messagesData.messages && messagesData.messages.length > 0) {
      const messageId = messagesData.messages[0].id;
      const msgRes = await fetch(`http://localhost:3000/api/mail/messages/${messageId}`);
      const msgData = await msgRes.json();

      console.log(`   ✓ Message loaded: "${msgData.subject}"`);
      console.log(`     From structure: ${JSON.stringify(msgData.from)}`);
      console.log(`     To structure: ${Array.isArray(msgData.to) ? `Array[${msgData.to.length}]` : typeof msgData.to}`);
      console.log(`     Body HTML: ${msgData.body?.html ? `${msgData.body.html.length} chars` : 'null'}`);
      console.log(`     Body Text: ${msgData.body?.text ? `${msgData.body.text.length} chars` : 'null'}`);
      console.log(`     Attachments: ${msgData.has_attachments ? `${msgData.attachments?.length || 0} files` : 'none'}`);
    }
  } catch (err) {
    console.log('   ✗ Error testing single message:', err.message);
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

runDiagnostics().catch(console.error);
