# Workflow Conventions

This document defines the workflow preferences and conventions for this project. Claude should follow these conventions in all sessions.

**Note:** Latest conventions are added at the top of each section.

---

## Documentation Conventions

### Prompt History (`prompt-history.md`)

**Purpose:** Track the evolution of the SchedulePro product through prompts and responses.

**Format:**
- Record user's **exact words** (quoted with `>`)
- Include a paraphrased summary of the response
- Number prompts sequentially within each session
- Include context when helpful (e.g., what files were updated, what changed)

**Timing:**
- Update during plan mode **before exiting** to capture original user requests
- Update after significant work is completed in regular mode

**Example:**
```markdown
### Prompt 23

**User (exact words):**
> Next look at @..\docs\prd\PRD-frontend.md and make changes according to...

**Response:** Updated `docs/prd/PRD-frontend.md` with major simplifications...
```

### How Claude Works (`how-claude-works.md`)

**Purpose:** Build a knowledge base about how Claude Code works, for user reference.

**Format:**
- Q&A style entries
- Include the complete question and comprehensive answer
- Provide practical examples and takeaways

**Timing:**
- Add entries when user learns something new about Claude's behavior
- Add entries when user asks meta-questions about how Claude works

**Organization:**
- **New entries go at the top** (after the intro section)
- Keep most recent discoveries easily accessible

### Workflow Conventions (`workflow-conventions.md`)

**Purpose:** Document user's workflow preferences and project-specific conventions.

**Format:**
- Organized by category (Documentation, Git, Code Style, etc.)
- Clear, actionable guidelines
- Examples where helpful

**Organization:**
- Latest conventions added at top of each section
- Reference this file at the start of new sessions

---

## Plan Mode Conventions

### Before Exiting Plan Mode

**Always perform these actions:**
1. Update `prompt-history.md` with user's exact words from the planning discussion
2. Reference transcript files in the plan document for context preservation
3. Ensure plan includes clear implementation steps

### Starting Implementation

**After exiting plan mode:**
1. Read the transcript file if referenced in the plan
2. Check for any context that might have been lost in session transition

---

## Session Management

### Starting New Sessions

**Recommended approach:**
- Reference `@workflow-conventions.md` at session start
- Reference `@how-claude-works.md` if user needs workflow reminders
- State the task clearly: "Continue working on SchedulePro following our established conventions"

### During Long Sessions

**If context is getting compressed:**
- User may reference documentation files to reinforce conventions
- Claude should proactively read documentation files when uncertain about preferences

---

## Code & Commit Conventions

_(To be added as conventions are established during development)_

---

## Communication Preferences

### Response Style
- Concise and direct
- No unnecessary emojis unless explicitly requested
- Professional and objective tone

### Tool Usage
- Prefer specialized tools over bash commands for file operations
- Use Read instead of cat, Edit instead of sed, Write instead of echo
- Make parallel tool calls when operations are independent

---

_Last updated: January 2026_
