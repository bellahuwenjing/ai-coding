# Workflow Conventions

This document defines the workflow preferences and conventions for this project. Claude should follow these conventions in all sessions.

**Note:** Latest conventions are added at the top of each section.

---

## Documentation Conventions

### Session Chat Log (`session-chat-log.md`)

**Purpose:** Maintain a running log of all user prompts during the current session to prevent loss of context during mode transitions.

**Format:**
- Log each user prompt immediately when received
- Use simple timestamp or sequential numbering
- Record user's **exact words** without interpretation
- Keep it simple - just the raw prompts, no responses needed

**Timing:**
- Log user prompts **as they arrive** during the session
- Especially critical before entering plan mode (to capture the triggering prompt)
- Continue logging throughout plan mode discussions
- This ensures prompts aren't lost during mode transitions or context compression

**Usage:**
- When updating `prompt-history.md`, reference `session-chat-log.md` to retrieve exact user words
- User can also provide prompts from their chat history (up/down arrows) if needed
- Clear or archive the log at the end of major sessions

**Example:**
```markdown
# Session Chat Log - January 26, 2026

## Prompt 1
With the current design, users and people are separate entities. However, people are essentially member users who can be assigned to jobs. Can you simplify the structure and use person model/collection and api enpoint for users? Admin users can be hidden from the resource list.

## Prompt 2
[clarification during plan mode]

## Prompt 3
Implement the following plan: [plan text]
```

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

### Before Entering Plan Mode

**Critical action to prevent prompt loss:**
1. **Immediately log the triggering user prompt to `session-chat-log.md`** before entering plan mode
   - This preserves the original question that started the planning discussion
   - Prevents loss during mode transitions

### Before Exiting Plan Mode

**Always perform these actions:**
1. Update `prompt-history.md` with user's exact words from `session-chat-log.md` or by asking user to provide from their chat history
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

**Maintain session chat log:**
- Log each user prompt to `session-chat-log.md` as it arrives
- This prevents prompt loss during mode transitions
- Especially important before entering plan mode

### Ending Sessions

**Before ending a major work session:**
- Ensure all prompts from `session-chat-log.md` have been properly documented in `prompt-history.md`
- Clear or archive `session-chat-log.md` to start fresh next time
- The session chat log is temporary; prompt history is permanent

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
