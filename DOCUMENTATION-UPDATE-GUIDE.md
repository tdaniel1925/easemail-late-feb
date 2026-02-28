# Documentation Update Guide

This guide explains how to maintain and update EaseMail's help documentation when adding new features or making changes.

## Documentation Structure

### Files to Update

1. **`HELP-DOC.md`** - Master documentation file (Markdown)
   - Comprehensive feature documentation
   - Troubleshooting guides
   - Keyboard shortcuts
   - Feature update log

2. **`app/(app)/help/page.tsx`** - Help page UI (React component)
   - Interactive help interface
   - Searchable sections
   - Collapsible categories
   - User-facing help system

3. **`DOCUMENTATION-UPDATE-GUIDE.md`** - This file
   - Instructions for maintaining documentation
   - Update workflow
   - Best practices

## When to Update Documentation

Update documentation whenever you:

- ✅ Add a new feature
- ✅ Change existing functionality
- ✅ Add/modify keyboard shortcuts
- ✅ Fix a bug that affects user experience
- ✅ Add a new setting or configuration option
- ✅ Modify the UI significantly
- ✅ Add new integrations
- ✅ Change sync behavior

## How to Update Documentation

### Step 1: Update HELP-DOC.md

1. Open `/HELP-DOC.md`
2. Find the relevant section for your feature
3. Add/update the feature documentation
4. Use clear, concise language
5. Include step-by-step instructions
6. Add keyboard shortcuts if applicable
7. Update the **Feature Update Log** at the bottom:

```markdown
### [Current Date] - [Release Name]

**New Features:**
- ✅ [Feature name and brief description]
- ✅ [Another feature]

**Bug Fixes:**
- ✅ [Bug fix description]

**Known Issues:**
- [Any known limitations or issues]
```

8. Update **Last Reviewed** date at the bottom

### Step 2: Update Help Page UI

1. Open `/app/(app)/help/page.tsx`
2. Find the `helpSections` array
3. Locate the relevant section object:

```typescript
{
  id: "section-id",
  title: "Section Title",
  icon: IconComponent,
  content: [
    {
      title: "Feature Title",
      description: "Feature description",
      steps: ["Step 1", "Step 2", "Step 3"], // optional
      tips: ["Tip 1", "Tip 2"], // optional
    }
  ]
}
```

4. Add or update content within the appropriate section
5. Follow the existing structure for consistency

### Step 3: Update Keyboard Shortcuts (if applicable)

If adding new keyboard shortcuts:

1. **Update HELP-DOC.md**: Add to the keyboard shortcuts table
2. **Update help/page.tsx**: Add to the "shortcuts" section in `helpSections`
3. **Implement shortcut**: Ensure the shortcut is actually functional in code
4. **Test**: Verify the shortcut works as documented

### Step 4: Test Documentation

1. Navigate to `/help` in the application
2. Search for your new feature
3. Verify all instructions are accurate
4. Test any links or references
5. Check formatting and readability
6. Ensure sections expand/collapse correctly

## Documentation Best Practices

### Writing Style

- **Clear and Concise**: Use simple language, avoid jargon
- **Action-Oriented**: Start with verbs ("Click", "Enter", "Select")
- **Step-by-Step**: Break complex tasks into numbered steps
- **Visual Hierarchy**: Use headings, lists, and formatting consistently

### Examples

✅ **Good:**
```markdown
**How to Compose an Email:**
1. Click the Compose button in the top bar
2. Enter recipient email addresses
3. Add a subject line
4. Type your message
5. Click Send
```

❌ **Bad:**
```markdown
To compose, you need to click on the compose button which is located in the top navigation bar area where you'll find various buttons and options...
```

### Formatting Guidelines

1. **Headings**: Use proper hierarchy (##, ###, ####)
2. **Bold**: Use for UI elements (`**Compose**`, `**Send**`)
3. **Code**: Use backticks for keyboard shortcuts (`` `Cmd+K` ``)
4. **Lists**: Use numbered lists for sequential steps, bullet points for options
5. **Tables**: Use for keyboard shortcuts reference

### Section Organization

Each feature section should include:

1. **Overview**: What the feature is
2. **How to Use**: Step-by-step instructions
3. **Features**: Key capabilities
4. **Keyboard Shortcuts**: Relevant shortcuts
5. **Tips**: Pro tips and best practices

## Example: Adding a New Feature

Let's say you're adding a "Snooze Email" feature.

### 1. Update HELP-DOC.md

Add under "Email Features" section:

```markdown
### Snooze Email

**How to Snooze:**
1. Select an email in the message list
2. Click the **Snooze** button in the toolbar
3. Select a snooze duration:
   - Later today (4 hours)
   - Tomorrow morning (8 AM)
   - This weekend (Saturday 8 AM)
   - Next week (Monday 8 AM)
   - Custom date/time
4. Email will reappear at the selected time

**Snooze Features:**
- Email moves to Snoozed folder
- Reappears in Inbox at scheduled time
- Can un-snooze at any time
- Keyboard shortcut: `Z`

**Managing Snoozed Emails:**
- View all snoozed emails in Snoozed folder
- Click any snoozed email to un-snooze
- Snoozed count shows in folder list
```

Update Feature Log:

```markdown
### March 1, 2026 - Snooze Update

**New Features:**
- ✅ Snooze emails to reappear later
- ✅ Snoozed folder for managing snoozed emails
- ✅ Keyboard shortcut (Z) for quick snooze
```

### 2. Update help/page.tsx

Add to "email" section in `helpSections`:

```typescript
{
  title: "Snooze Email",
  description: "Temporarily remove emails from Inbox and have them reappear later.",
  steps: [
    "Select an email in the message list",
    "Click the Snooze button in the toolbar",
    "Choose a snooze duration (Later today, Tomorrow, Weekend, Next week, Custom)",
    "Email moves to Snoozed folder and will return at the selected time",
  ],
  tips: [
    "Keyboard shortcut Z for quick snooze",
    "View all snoozed emails in the Snoozed folder",
    "Click any snoozed email to un-snooze immediately",
  ],
}
```

Add keyboard shortcut:

```typescript
{
  title: "Email Actions",
  description: "Manage emails quickly with keyboard shortcuts.",
  steps: [
    // ... existing shortcuts ...
    "**Z** - Snooze email",
  ],
}
```

### 3. Test

1. Navigate to http://localhost:3000/help
2. Expand "Email Features" section
3. Verify "Snooze Email" appears with correct information
4. Search for "snooze" and verify it appears in results
5. Test the Z keyboard shortcut actually works in the app

## Troubleshooting Documentation

When users report issues, add troubleshooting entries:

### Template

```markdown
#### [Issue Name]

**Symptoms**: Brief description of what user experiences

**Solutions**:
1. First solution to try
2. Second solution if first doesn't work
3. Third solution
4. When to contact support
```

### Example

```markdown
#### Snooze Not Working

**Symptoms**: Snoozed emails don't reappear at scheduled time

**Solutions**:
1. Check browser notifications are enabled
2. Ensure you're still signed in
3. Refresh the page to trigger sync
4. Check the Snoozed folder - email may be there
5. Try un-snoozing and snoozing again with a sooner time
```

## Maintaining Documentation Quality

### Regular Reviews

- **Monthly**: Review all documentation for accuracy
- **After Major Updates**: Update all affected sections
- **User Feedback**: Add FAQs based on common questions

### Quality Checklist

Before marking documentation complete:

- [ ] All features are documented
- [ ] Step-by-step instructions are accurate
- [ ] Keyboard shortcuts are listed and functional
- [ ] Screenshots or examples are up-to-date
- [ ] Troubleshooting section is comprehensive
- [ ] Feature Update Log is current
- [ ] Help page UI matches HELP-DOC.md content
- [ ] Search functionality works for new content
- [ ] No broken links or references
- [ ] Writing style is clear and consistent

## Tools & Resources

### Markdown Preview

Use a Markdown previewer to check formatting:
- VS Code: Built-in Markdown preview (`Cmd/Ctrl+Shift+V`)
- GitHub: Preview in PR/commit view
- Online: https://dillinger.io

### Writing Tools

- **Grammarly**: Check grammar and clarity
- **Hemingway App**: Ensure readability
- **LanguageTool**: Grammar and style checking

## Documentation Workflow

```
1. Code Feature
   ↓
2. Test Feature
   ↓
3. Update HELP-DOC.md
   ↓
4. Update help/page.tsx
   ↓
5. Test Documentation
   ↓
6. Review for Clarity
   ↓
7. Commit & Deploy
```

## Commit Message Convention

When updating documentation:

```bash
git commit -m "docs: Add snooze feature documentation

- Updated HELP-DOC.md with snooze instructions
- Added snooze section to help page
- Updated keyboard shortcuts list
- Added troubleshooting entry for snooze issues"
```

## Need Help?

If you're unsure how to document a feature:

1. Look at existing documentation for similar features
2. Follow the templates in this guide
3. Ask yourself: "What would a new user need to know?"
4. Test the documentation by following it step-by-step
5. Get feedback from other team members

---

**Remember**: Good documentation is as important as good code. Users can't benefit from features they don't know exist or can't figure out how to use!

---

**Last Updated**: February 25, 2026
