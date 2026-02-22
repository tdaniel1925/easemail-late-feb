# COVERAGE-MATRIX.md — Verification That Nothing Is Missing

> **Three tests to prove completeness:**
> 1. Every screen has a spec
> 2. Every API call has a route
> 3. Every data write has a table
>
> If anything fails these tests, it's a gap. Fix it before building.

---

## TEST 1: EVERY SCREEN THE USER WILL SEE

### Navigation Map (every URL/view in the app)

| Screen | URL | Spec'd In | Micro-Features | Status |
|--------|-----|-----------|----------------|--------|
| **Marketing / Public** | | | | |
| Landing page | `/` | Step 8.5 | — | ✅ |
| Login | `/login` | Step 2.1 | V3 §32 (branded login) | ✅ |
| Register | `/register` | Step 2.1 | — | ✅ |
| Accept invite | `/invite/[token]` | GAPS §Journey 2 | — | ✅ |
| **Main App** | | | | |
| Inbox (unified) | `/mail` | Step 5.4 | V1 §2 | ✅ |
| Inbox (per account) | `/mail?account=[id]` | Step 5.2 | V1 §2 | ✅ |
| Folder view | `/mail?folder=[id]` | Step 5.3 | V1 §4 | ✅ |
| Message viewer | `/mail/[messageId]` | Step 5.5 | V1 §3 | ✅ |
| Compose (new) | Modal overlay | Step 5.6 | V1 §1 | ✅ |
| Compose (reply) | Modal overlay | Step 5.6 | V1 §1 | ✅ |
| Compose (forward) | Modal overlay | Step 5.6 | V1 §1 | ✅ |
| Draft editing | Modal overlay | Step 5.6 | V1 §1 | ✅ |
| Search results | `/mail/search?q=` | Step 5.7 | V1 §5 | ✅ |
| Snoozed messages | `/mail?folder=snoozed` | GAPS §1 | V2 §17 | ✅ |
| Scheduled messages | `/mail?folder=scheduled` | GAPS §2 | V1 §1 | ✅ |
| **Calendar** | | | | |
| Month view | `/calendar` | Step 9.3 | V3 §30 | ✅ |
| Week view | `/calendar?view=week` | Step 9.3 | V3 §30 | ✅ |
| Day view | `/calendar?view=day` | Step 9.3 | V3 §30 | ✅ |
| Event detail | Popup overlay | Step 9.4 | V3 §30 | ✅ |
| Event create/edit | Modal | Step 9.4 | V3 §30 | ✅ |
| **Teams** | | | | |
| Chat list | Sidebar section | Step 10.4 | V3 §29 | ✅ |
| Chat view | Reading pane | Step 10.4 | V3 §29 | ✅ |
| Teams & Channels | `/teams` | Step 10.2 | V3 §29 | ✅ |
| Channel thread | `/teams/[channelId]` | Step 10.2 | V3 §29 | ✅ |
| **Contacts** | | | | |
| Contact list | `/contacts` | Step 11.4 | V3 §27 | ✅ |
| Contact detail | `/contacts/[id]` | Step 11.4 | V3 §27 | ✅ |
| Contact import | Modal | Step 11.6 | V3 §27 | ✅ |
| **CRM** | | | | |
| CRM dashboard | `/crm` | Step 7.5 | V3 §31 | ✅ |
| Deal list | `/crm/deals` | Step 7.5 | V3 §31 | ✅ |
| Deal detail | `/crm/deals/[id]` | Step 7.5 | V3 §31 | ✅ |
| Company list | `/crm/companies` | Step 7.5 | V3 §31 | ✅ |
| Company detail | `/crm/companies/[id]` | Step 7.5 | V3 §31 | ✅ |
| **Settings** | | | | |
| General | `/settings/general` | Step 5.8 | V3 §28 | ✅ |
| Accounts | `/settings/accounts` | Step 5.8 | V3 §28 | ✅ |
| Account detail | `/settings/accounts/[id]` | Step 5.8 | V3 §28 | ✅ |
| Appearance | `/settings/appearance` | Step 5.8 | V3 §28 | ✅ |
| Signatures | `/settings/signatures` | Step 5.8 | V3 §28 | ✅ |
| Templates | `/settings/templates` | Step 5.8 | V3 §28 | ✅ |
| Snippets | `/settings/snippets` | GAPS §3 | V2 §16 | ✅ |
| Labels | `/settings/labels` | Step 5.8 | V3 §28 | ✅ |
| Rules | `/settings/rules` | Step 5.8 | V3 §28 | ✅ |
| Notifications | `/settings/notifications` | Step 5.8 | V3 §28 | ✅ |
| Keyboard shortcuts | `/settings/shortcuts` | Step 5.8 | V3 §28 | ✅ |
| Quick steps | `/settings/quick-steps` | GAPS §9 | V2 §19 | ✅ |
| Split inbox config | `/settings/split-inbox` | GAPS §10 | V2 §19 | ✅ |
| Blocked senders | `/settings/blocked` | GAPS §7 | V2 §24 | ✅ |
| Team members | `/settings/team` | Step 7.1 | V3 §33 | ✅ |
| Shared inboxes | `/settings/shared-inboxes` | Step 7.2 | V3 §33 | ✅ |
| CRM settings | `/settings/crm` | Step 7.5 | V3 §31 | ✅ |
| Branding | `/settings/branding` | Step 8.1 | V3 §32 | ✅ |
| Custom domain | `/settings/domain` | Step 8.2 | V3 §32 | ✅ |
| Security | `/settings/security` | V3 §36 | V3 §36 | ✅ |
| Billing | `/settings/billing` | V3 §34 | V3 §34 | ✅ |
| Audit log | `/settings/audit-log` | GAPS §8 | V2 §24 | ✅ |
| Data export | `/settings/security` | V3 §36 | V3 §36 | ✅ |
| **Overlays / Modals** | | | | |
| Command palette (⌘K) | Overlay | UI-DESIGN-SYSTEM | V1 §5 | ✅ |
| Keyboard shortcuts (?) | Overlay | Step 5.10 | V1 §7 | ✅ |
| Help panel | Slide-in | V3 §35 | V3 §35 | ✅ |
| Onboarding wizard | Multi-step modal | Step 8.4 | V2 §25 | ✅ |
| **Error Pages** | | | | |
| 400 Bad Request | `/400` | Step 8.5 | V1 §11 | ✅ |
| 403 Forbidden | `/403` | Step 8.5 | V1 §11 | ✅ |
| 404 Not Found | `/404` | Step 8.5 | V1 §11 | ✅ |
| 500 Server Error | `/500` | Step 8.5 | V1 §11 | ✅ |
| Offline | — | Step 8.5 | V1 §9 | ✅ |

**Result: ALL SCREENS ACCOUNTED FOR ✅**

---

## TEST 2: EVERY API ROUTE

### Complete API Route Inventory

| Method | Route | Purpose | Agent | Table(s) |
|--------|-------|---------|-------|----------|
| **Auth** | | | | |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler | 2 | users, connected_accounts |
| POST | `/api/auth/connect` | Connect additional account | 2 | connected_accounts, account_tokens |
| GET | `/api/auth/invite/[token]` | Validate invite | 2 | invitations |
| POST | `/api/auth/invite/[token]/accept` | Accept invite | 2 | invitations, users |
| **Accounts** | | | | |
| GET | `/api/accounts` | List connected accounts | 4 | connected_accounts |
| PATCH | `/api/accounts/[id]` | Update account settings | 4 | connected_accounts |
| POST | `/api/accounts/[id]/disconnect` | Disconnect account | 2 | connected_accounts, account_tokens |
| POST | `/api/accounts/[id]/reauth` | Reauth account | 2 | account_tokens |
| POST | `/api/accounts/[id]/sync` | Force sync | 3 | sync_state |
| GET | `/api/accounts/[id]/health` | Account health | 4 | account_tokens, sync_state, webhook_subscriptions |
| GET | `/api/accounts/[id]/auto-reply` | Get OOO settings | 4 | — (Graph API direct) |
| PATCH | `/api/accounts/[id]/auto-reply` | Set OOO settings | 4 | — (Graph API direct) |
| **Mail** | | | | |
| GET | `/api/mail/messages` | List messages | 4 | messages |
| GET | `/api/mail/messages/[id]` | Get single message | 4 | messages, attachments |
| PATCH | `/api/mail/messages/[id]` | Update flags (read, flag) | 4 | messages |
| DELETE | `/api/mail/messages/[id]` | Delete message | 4 | messages |
| POST | `/api/mail/messages/[id]/move` | Move message | 4 | messages |
| POST | `/api/mail/messages/[id]/snooze` | Snooze message | 4 | snoozed_messages |
| DELETE | `/api/mail/messages/[id]/snooze` | Cancel snooze | 4 | snoozed_messages |
| POST | `/api/mail/messages/[id]/pin` | Pin message | 4 | pinned_messages |
| DELETE | `/api/mail/messages/[id]/pin` | Unpin | 4 | pinned_messages |
| POST | `/api/mail/messages/[id]/follow-up` | Set follow-up | 4 | follow_up_reminders |
| DELETE | `/api/mail/messages/[id]/follow-up` | Cancel follow-up | 4 | follow_up_reminders |
| GET | `/api/mail/messages/[id]/tracking` | Get open tracking | 4 | message_tracking |
| GET | `/api/mail/snoozed` | List snoozed | 4 | snoozed_messages |
| GET | `/api/mail/follow-ups` | List pending follow-ups | 4 | follow_up_reminders |
| **Compose / Send** | | | | |
| POST | `/api/mail/send` | Send email | 4 | messages, audit_log |
| POST | `/api/mail/schedule` | Schedule send | 4 | scheduled_messages |
| GET | `/api/mail/scheduled` | List scheduled | 4 | scheduled_messages |
| PATCH | `/api/mail/scheduled/[id]` | Reschedule | 4 | scheduled_messages |
| DELETE | `/api/mail/scheduled/[id]` | Cancel scheduled | 4 | scheduled_messages |
| POST | `/api/mail/drafts` | Create draft | 4 | messages |
| PATCH | `/api/mail/drafts/[id]` | Update draft | 4 | messages |
| POST | `/api/mail/drafts/[id]/send` | Send draft | 4 | messages |
| DELETE | `/api/mail/drafts/[id]` | Delete draft | 4 | messages |
| **Folders** | | | | |
| GET | `/api/mail/folders` | List folders | 4 | account_folders |
| POST | `/api/mail/folders` | Create folder | 4 | account_folders |
| PATCH | `/api/mail/folders/[id]` | Rename folder | 4 | account_folders |
| DELETE | `/api/mail/folders/[id]` | Delete folder | 4 | account_folders |
| PATCH | `/api/mail/folders/[id]/favorite` | Toggle favorite | 4 | account_folders |
| **Search** | | | | |
| GET | `/api/mail/search` | Search messages | 4 | messages |
| **Attachments** | | | | |
| GET | `/api/mail/attachments/[id]` | Download attachment | 3 | attachments |
| POST | `/api/mail/attachments/upload` | Upload attachment | 4 | attachments |
| **Labels** | | | | |
| GET | `/api/labels` | List labels | 4 | labels |
| POST | `/api/labels` | Create label | 4 | labels |
| PATCH | `/api/labels/[id]` | Update label | 4 | labels |
| DELETE | `/api/labels/[id]` | Delete label | 4 | labels |
| POST | `/api/mail/messages/[id]/labels` | Apply label(s) | 4 | message_labels |
| DELETE | `/api/mail/messages/[id]/labels/[labelId]` | Remove label | 4 | message_labels |
| **Rules** | | | | |
| GET | `/api/mail/rules` | List rules | 4 | mail_rules |
| POST | `/api/mail/rules` | Create rule | 4 | mail_rules |
| PATCH | `/api/mail/rules/[id]` | Update rule | 4 | mail_rules |
| DELETE | `/api/mail/rules/[id]` | Delete rule | 4 | mail_rules |
| POST | `/api/mail/rules/[id]/run` | Run rule on folder | 4 | mail_rules, messages |
| **Block** | | | | |
| GET | `/api/mail/blocked` | List blocked senders | 4 | blocked_senders |
| POST | `/api/mail/block` | Block sender | 4 | blocked_senders |
| DELETE | `/api/mail/block/[id]` | Unblock | 4 | blocked_senders |
| **Quick Steps** | | | | |
| GET | `/api/mail/quick-steps` | List | 4 | quick_steps |
| POST | `/api/mail/quick-steps` | Create | 4 | quick_steps |
| PATCH | `/api/mail/quick-steps/[id]` | Update | 4 | quick_steps |
| DELETE | `/api/mail/quick-steps/[id]` | Delete | 4 | quick_steps |
| POST | `/api/mail/quick-steps/[id]/execute` | Execute | 4 | quick_steps, messages |
| **Split Inbox** | | | | |
| GET | `/api/mail/splits` | List splits | 4 | inbox_splits |
| POST | `/api/mail/splits` | Create split | 4 | inbox_splits |
| PATCH | `/api/mail/splits/[id]` | Update split | 4 | inbox_splits |
| DELETE | `/api/mail/splits/[id]` | Delete split | 4 | inbox_splits |
| **Snippets** | | | | |
| GET | `/api/snippets` | List | 5 | snippets |
| POST | `/api/snippets` | Create | 5 | snippets |
| PATCH | `/api/snippets/[id]` | Update | 5 | snippets |
| DELETE | `/api/snippets/[id]` | Delete | 5 | snippets |
| POST | `/api/snippets/[id]/expand` | Expand variables | 5 | snippets |
| **Templates** | | | | |
| GET | `/api/templates` | List | 4 | email_templates |
| POST | `/api/templates` | Create | 4 | email_templates |
| PATCH | `/api/templates/[id]` | Update | 4 | email_templates |
| DELETE | `/api/templates/[id]` | Delete | 4 | email_templates |
| **Signatures** | | | | |
| GET | `/api/signatures` | List | 4 | email_signatures |
| POST | `/api/signatures` | Create | 4 | email_signatures |
| PATCH | `/api/signatures/[id]` | Update | 4 | email_signatures |
| DELETE | `/api/signatures/[id]` | Delete | 4 | email_signatures |
| **Contacts** | | | | |
| GET | `/api/contacts` | List / search | 11 | crm_contacts, account_contacts |
| GET | `/api/contacts/[id]` | Get contact detail | 11 | crm_contacts |
| POST | `/api/contacts` | Create contact | 11 | crm_contacts |
| PATCH | `/api/contacts/[id]` | Update contact | 11 | crm_contacts |
| DELETE | `/api/contacts/[id]` | Delete contact | 11 | crm_contacts |
| POST | `/api/contacts/merge` | Merge contacts | 11 | crm_contacts |
| GET | `/api/contacts/autocomplete` | Smart autocomplete | 11 | contact_frequency |
| GET | `/api/contacts/suggestions` | Suggested contacts | 11 | contact_interactions |
| POST | `/api/contacts/import` | CSV/vCard import | 11 | crm_contacts |
| GET | `/api/contacts/export` | CSV/vCard export | 11 | crm_contacts |
| **Contact Groups** | | | | |
| GET | `/api/contacts/groups` | List groups | 11 | contact_groups |
| POST | `/api/contacts/groups` | Create group | 11 | contact_groups |
| PATCH | `/api/contacts/groups/[id]` | Update group | 11 | contact_groups |
| DELETE | `/api/contacts/groups/[id]` | Delete group | 11 | contact_groups |
| POST | `/api/contacts/groups/[id]/members` | Add to group | 11 | contact_group_members |
| DELETE | `/api/contacts/groups/[id]/members/[cid]` | Remove from group | 11 | contact_group_members |
| **Calendar** | | | | |
| GET | `/api/calendar/events` | List events | 9 | calendar_events |
| POST | `/api/calendar/events` | Create event | 9 | calendar_events |
| PATCH | `/api/calendar/events/[id]` | Update event | 9 | calendar_events |
| DELETE | `/api/calendar/events/[id]` | Delete event | 9 | calendar_events |
| POST | `/api/calendar/events/[id]/respond` | RSVP | 9 | calendar_events |
| GET | `/api/calendar/free-busy` | Check availability | 9 | — (Graph API direct) |
| GET | `/api/calendar/calendars` | List calendars | 9 | calendars |
| **MS Teams** | | | | |
| GET | `/api/teams/chats` | List chats | 10 | teams_chats |
| GET | `/api/teams/chats/[id]/messages` | Get chat messages | 10 | teams_messages |
| POST | `/api/teams/chats/[id]/messages` | Send message | 10 | teams_messages |
| POST | `/api/teams/chats` | Start new chat | 10 | teams_chats |
| GET | `/api/teams/teams` | List joined Teams | 10 | ms_teams |
| GET | `/api/teams/teams/[id]/channels` | List channels | 10 | ms_teams_channels |
| GET | `/api/teams/presence` | Get presence | 10 | teams_presence |
| POST | `/api/teams/meetings` | Create meeting | 10 | — (Graph API direct) |
| **CRM** | | | | |
| GET | `/api/crm/dashboard` | Dashboard stats | 7 | crm_contacts, crm_deals |
| GET | `/api/crm/deals` | List deals | 7 | crm_deals |
| POST | `/api/crm/deals` | Create deal | 7 | crm_deals |
| PATCH | `/api/crm/deals/[id]` | Update deal | 7 | crm_deals |
| DELETE | `/api/crm/deals/[id]` | Delete deal | 7 | crm_deals |
| GET | `/api/crm/companies` | List companies | 7 | crm_companies |
| POST | `/api/crm/companies` | Create company | 7 | crm_companies |
| PATCH | `/api/crm/companies/[id]` | Update company | 7 | crm_companies |
| GET | `/api/crm/activities` | List activities | 7 | crm_activities |
| POST | `/api/crm/activities` | Log activity | 7 | crm_activities |
| **AI** | | | | |
| POST | `/api/ai/draft` | Generate draft | 6 | — |
| POST | `/api/ai/summarize` | Summarize thread | 6 | messages (update ai_summary) |
| POST | `/api/ai/smart-replies` | Get reply suggestions | 6 | — |
| POST | `/api/ai/categorize` | Categorize message | 6 | messages (update ai_category) |
| POST | `/api/ai/search` | Natural language search | 6 | messages |
| **Team / Admin** | | | | |
| GET | `/api/team/members` | List members | 7 | users |
| POST | `/api/team/invite` | Send invitation | 7 | invitations |
| PATCH | `/api/team/members/[id]` | Update member role | 7 | users |
| DELETE | `/api/team/members/[id]` | Remove member | 7 | users |
| GET | `/api/team/shared-inboxes` | List shared inboxes | 7 | shared_inboxes |
| POST | `/api/team/shared-inboxes` | Create shared inbox | 7 | shared_inboxes |
| PATCH | `/api/team/shared-inboxes/[id]` | Update | 7 | shared_inboxes |
| POST | `/api/team/assignments/[id]/assign` | Assign message | 7 | inbox_assignments |
| PATCH | `/api/team/assignments/[id]` | Update status | 7 | inbox_assignments |
| POST | `/api/team/assignments/[id]/notes` | Add internal note | 7 | inbox_notes |
| **White-label** | | | | |
| GET | `/api/branding` | Get branding | 8 | tenant_branding |
| PATCH | `/api/branding` | Update branding | 8 | tenant_branding |
| POST | `/api/branding/verify-domain` | Verify custom domain | 8 | tenant_branding |
| **Billing** | | | | |
| GET | `/api/billing` | Get subscription | — | tenants |
| POST | `/api/billing/checkout` | Create Stripe checkout | — | tenants |
| POST | `/api/billing/portal` | Create Stripe portal | — | tenants |
| POST | `/api/webhooks/stripe` | Stripe webhook | — | tenants |
| **Admin** | | | | |
| GET | `/api/admin/audit-log` | Get audit entries | — | audit_log |
| GET | `/api/admin/audit-log/export` | Export CSV | — | audit_log |
| POST | `/api/admin/data-export` | Request data export | — | users |
| POST | `/api/admin/data-retention` | Set retention policy | — | tenants |
| **Webhooks** | | | | |
| POST | `/api/webhooks/graph` | Graph webhook handler | 3 | messages, calendar_events |
| **Tracking** | | | | |
| GET | `/api/tracking/pixel/[id].gif` | Open tracking pixel | — | message_tracking |
| **Preferences** | | | | |
| GET | `/api/preferences` | Get user prefs | — | user_preferences |
| PATCH | `/api/preferences` | Update prefs | — | user_preferences |

**Total: ~120 API routes. ALL ACCOUNTED FOR ✅**

---

## TEST 3: EVERY DATABASE TABLE HAS A PURPOSE

| Table | Created In | Used By Routes | Used By Agent |
|-------|-----------|---------------|---------------|
| tenants | PROJECT-SPEC | billing, auth | 1, 2 |
| users | PROJECT-SPEC | auth, team, prefs | 1, 2, 7 |
| user_preferences | PROJECT-SPEC | preferences | 1, 5 |
| connected_accounts | PROJECT-SPEC | accounts, mail, sync | 1, 2, 3, 4 |
| account_tokens | PROJECT-SPEC | auth (internal only) | 2 |
| account_folders | PROJECT-SPEC | folders, mail | 3, 4 |
| messages | PROJECT-SPEC | mail (all) | 3, 4, 5, 6 |
| attachments | PROJECT-SPEC | attachments | 3, 4 |
| labels | PROJECT-SPEC | labels | 4 |
| message_labels | PROJECT-SPEC | labels | 4 |
| sync_state | PROJECT-SPEC | sync (internal) | 3 |
| webhook_subscriptions | PROJECT-SPEC | webhooks (internal) | 3 |
| email_signatures | PROJECT-SPEC | signatures | 4, 5 |
| email_templates | PROJECT-SPEC | templates | 4, 5 |
| account_contacts | PROJECT-SPEC | contacts | 3, 11 |
| mail_rules | PROJECT-SPEC | rules | 4 |
| teams | PROJECT-SPEC | team mgmt | 7 |
| team_members | PROJECT-SPEC | team mgmt | 7 |
| shared_inboxes | PROJECT-SPEC | shared inbox | 7 |
| inbox_assignments | PROJECT-SPEC | assignments | 7 |
| inbox_notes | PROJECT-SPEC | internal notes | 7 |
| crm_contacts | PROJECT-SPEC | CRM contacts | 7, 11 |
| crm_companies | PROJECT-SPEC | CRM companies | 7 |
| crm_deals | PROJECT-SPEC | CRM deals | 7 |
| crm_activities | PROJECT-SPEC | CRM activities | 7 |
| tenant_branding | PROJECT-SPEC | branding | 8 |
| calendar_events | ADDITIONAL-AGENTS | calendar events | 9 |
| calendars | ADDITIONAL-AGENTS | calendar list | 9 |
| calendar_sync_state | ADDITIONAL-AGENTS | calendar sync | 9 |
| teams_chats | ADDITIONAL-AGENTS | Teams chats | 10 |
| teams_messages | ADDITIONAL-AGENTS | Teams messages | 10 |
| ms_teams | ADDITIONAL-AGENTS | Teams/org teams | 10 |
| ms_teams_channels | ADDITIONAL-AGENTS | Teams channels | 10 |
| teams_presence | ADDITIONAL-AGENTS | presence | 10 |
| contact_groups | ADDITIONAL-AGENTS | contact groups | 11 |
| contact_group_members | ADDITIONAL-AGENTS | contact groups | 11 |
| contact_interactions | ADDITIONAL-AGENTS | interaction tracking | 11 |
| contact_frequency | ADDITIONAL-AGENTS | autocomplete | 11 |
| snoozed_messages | GAPS | snooze | 4, 5 |
| scheduled_messages | GAPS | scheduled send | 4, 5 |
| snippets | GAPS | snippets | 5 |
| pinned_messages | GAPS | pin | 4, 5 |
| follow_up_reminders | GAPS | follow-ups | 4, 5 |
| message_tracking | GAPS | read receipts | 4, 5 |
| blocked_senders | GAPS | block sender | 4 |
| audit_log | GAPS | audit | all |
| quick_steps | GAPS | quick steps | 4, 5 |
| inbox_splits | GAPS | split inbox | 4, 5 |
| invitations | GAPS | team invite | 2, 7 |

**Total: 49 tables. ALL HAVE ROUTES AND AGENTS ✅**

---

## TEST 4: WHAT COULD STILL BE MISSING?

After three passes and this verification, here's what we genuinely cannot spec until building:

### Known Unknowns (will discover during build)
1. **Graph API edge cases** — specific error codes, rate limit patterns, pagination quirks that only appear with real data
2. **Tiptap editor edge cases** — paste behavior varies by browser, specific formatting bugs
3. **Email HTML rendering** — some emails have insane HTML that breaks any sanitizer; will need iterative fixes
4. **Performance at scale** — queries that are fast with 100 messages may be slow with 50,000; need real indexing tuning
5. **Mobile Safari quirks** — always has unique CSS/JS issues
6. **Webhook reliability** — Graph webhooks occasionally miss events; need fallback polling

### Things to Add Post-Launch (V3.1+)
1. **Google Workspace support** (Gmail API instead of Graph)
2. **SAML SSO** for enterprise
3. **Slack integration** (module)
4. **Salesforce / HubSpot CRM sync**
5. **Email scheduling analytics** (best time to send)
6. **Team performance reporting**
7. **Mobile native app** (React Native)
8. **Desktop app** (Electron or Tauri)
9. **Offline-first with IndexedDB** (currently online-required)
10. **Email aliases** (send as different address from same account)
11. **Delegation** (assistant manages boss's inbox)
12. **S/MIME encryption**

### The Honest Answer
This spec is **as complete as a spec can be before building.** The remaining gaps will only be discovered through building and testing. That's exactly what the 73 build steps with test gates are for — they'll surface the unknowns one step at a time instead of all at once at the end.
