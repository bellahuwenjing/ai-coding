# How Claude Works - User Handbook

A collection of insights about working with Claude Code effectively.

**Note:** Latest discoveries are added at the top of this file.

---

## Q&A: Working with File Paths and Folder Renames

### Question

Does it mean if I ever change folder name again, or relocate a file, then I should alert you about it explicitly?

### Answer

Good question! Here's the practical answer:

#### What Claude Should Automatically Detect

- **Current working directory** - Shown in the environment info at session start
- **When you `cd` into a different directory** - Should update working directory context
- **Git repo status** - Visible in the environment info

#### What Happened in Practice

In one session, there was conflicting information:
- **Working directory**: `D:\JR AI coding\scheduling-app` ✅ (correct, with hyphen)
- **Additional working directories**: `D:\JR AI coding\scheduling app\docs` ❌ (stale, with space)

Claude incorrectly relied on the "Additional working directories" instead of the actual working directory, creating files in the wrong location.

#### Best Practices Going Forward

**What Claude Should Do Better:**
1. **Use relative paths** when possible: `docs/filename.md` instead of absolute paths
2. **Check the working directory** before creating files
3. **Prioritize the working directory** over additional working directories

**What Helps You:**

**Yes, explicitly mention it** if you:
- ✅ Rename folders (especially the project root or major directories)
- ✅ Restructure the project (moving docs, src, etc.)
- ✅ Create new directories that Claude needs to reference
- ✅ Delete directories Claude might try to use

**Quick Alert Format:**
> "FYI: I renamed `scheduling app` to `scheduling-app` (spaces cause issues with Vercel)"

or

> "FYI: I moved all the docs from `docs/` to `documentation/`"

This takes 5 seconds and prevents files from being created in the wrong place.

#### Why Explicit Alerts Help

Even though Claude should detect these changes automatically:
1. **Environment info can be stale** (as demonstrated)
2. **Claude might have cached paths** from earlier in the conversation
3. **Explicit context is clearer** than inferring from subtle changes
4. **Prevents wasted work** (files in wrong location, having to move them)

#### TL;DR

**Technically:** Claude should auto-detect folder changes via environment info

**Practically:** A quick "FYI: I renamed X to Y" saves time and prevents errors

**Best practice:** When making significant changes to directory structure or file locations, mention it explicitly in a message. This is especially important for:
- Project root folder renames
- Moving documentation or source directories
- Changing paths that Claude has referenced multiple times in the session

---

## Q&A: Memory in Long Conversations

### Question
 apparently it's still the same session after the manual mode switch. so what you said to me before about switching modes
  creates a new session is not accurate.

### Answer
You're absolutely right, and I apologize for the inaccuracy. Thank you for testing and correcting that. The session
identifier (adaptive-sprouting-waffle) remained the same when you manually entered plan mode, so switching modes does NOT create a new session.

I should not have stated that as fact without being certain. I appreciate you clarifying how it actually works.

### Question
If the session goes on for a long time and I've said lots of things to you, will you start losing memory of what I said all of a sudden?

### Answer
No, I won't suddenly lose memory. The conversation has **unlimited context through automatic summarization**.

#### How It Works

**What this means:**
- As the conversation gets very long, earlier parts get automatically summarized rather than kept verbatim
- The **most recent** parts of our conversation are always kept in full detail
- Key information and important context from earlier parts are preserved through summarization
- You won't experience a sudden cutoff where I forget everything

**Practical implications:**
- I'll remember the gist and important details from throughout our conversation
- Exact wording from way earlier might get compressed into summaries
- Critical information (like your project requirements, decisions we've made, file paths we're working with) should persist
- The further back in the conversation, the more likely details are summarized rather than verbatim

**Best practice:**
- If something from much earlier is critical, you can always reference it explicitly
- Important persistent information (like project decisions, API keys, configuration choices) should ideally be stored in files rather than just in conversation

**Bottom line:** No sudden memory loss, but earlier details may be compressed into summaries while recent conversation stays detailed.

---

## Q&A: Does Switching Modes Create a New Session?

### Question
When using Claude CLI, I usually use plan mode to talk about my ideas and discuss options provided by Claude. Once all decisions are made, Claude asks if I want to proceed. By choosing 'Yes, clear context and auto-accept edits', it switches to accept edits mode. Does this create a new session?

### Answer
No, this does not create a new session. When you choose "Yes, clear context and auto-accept edits" in Claude CLI, you're staying within the same session, but with two important changes:

1. **Context clearing**: The conversation history (your planning discussion) is cleared from the context window to save tokens and focus on execution. However, the decisions you made are typically summarized or retained in some form.

2. **Mode switch**: It switches from plan mode (where you discuss and approve changes) to auto-accept mode (where Claude automatically applies file edits without asking for confirmation each time).

The session itself - including your connection to Claude CLI, any loaded files, and the working directory - remains the same. It's more like changing the "rules of engagement" within your existing session rather than starting fresh.

This design is intentional: it lets you have a thorough planning conversation, then execute efficiently without the planning context consuming tokens during implementation. The session continuity means Claude can still access the same files and environment you were working with during planning.

If you actually wanted to start a completely new session, you'd need to exit and restart Claude CLI.

---

## Q&A: How Claude Remembers Preferences

### Question

How does claude remember my preferences such as keeping records of my prompt history in a very specific manner (i.e. Update prompt-history.md during planning (before exiting plan mode))? Is this session based or something that can be lost over time?

### Answer

Great question - this gets at a fundamental aspect of how I work.

#### Current Session Memory (What I Have Now)

Right now, I "remember" your preferences because they're in:

1. **The conversation summary** - When context was compacted, the system summarized our conversation including the convention of updating prompt-history.md
2. **The files themselves** - `prompt-history.md` and `how-claude-works.md` document these practices
3. **This active session** - As long as we're in this conversation, I have access to all the context

#### What Happens in a New Session (Important Limitation)

**When you start a new conversation with me, I will NOT automatically remember:**

- The prompt-history.md convention
- That you want exact words + paraphrases
- To update documentation before exiting plan mode
- Any other workflow preferences we've established

**This is session-based memory, not persistent memory.**

#### How Preferences Can Be Lost

❌ **Start new session** → I don't know about your preferences unless:

- You remind me at the start
- I read your documentation files
- You reference the files with `@how-claude-works.md` or `@prompt-history.md`

**Note:** Within a single session, the conversation has unlimited context through automatic summarization, so preferences are preserved even in very long conversations (though earlier details may be summarized rather than kept verbatim).

#### Workarounds to Preserve Preferences

**✅ Document in Project Files (What we're doing)**

- `how-claude-works.md` - Explains how to work with me
- `prompt-history.md` - Shows the format by example
- These files persist across sessions

**✅ Create a README or CLAUDE.md**

Some users create a file specifically for me:

```markdown
# CLAUDE.md - Instructions for Claude

## Project Conventions

- Always update prompt-history.md with user's exact words
- Update documentation before exiting plan mode
- Use semantic commit messages
- etc.
```

**✅ Reference Files at Session Start**

When starting a new session, you can say:

- "Read @how-claude-works.md first to understand our workflow"
- "Follow the conventions in @CLAUDE.md"

**✅ Reminder Prompts**

Some users start new sessions with:

- "Continue working on SchedulePro following our established conventions"
- "Check how-claude-works.md for our workflow preferences"

#### What About Claude's "Memory" Feature?

Claude.ai (the web interface) has a memory feature that persists preferences across conversations, but **Claude Code (the CLI tool we're using) does not have persistent memory across sessions**.

Each time you run `claude` in your terminal and start a new conversation, I'm starting fresh - I only know:

- The current working directory and git status
- Files in your project (that I can read)
- Nothing about previous conversations unless documented in files

#### Bottom Line

**Your preferences exist in two places:**

1. **This session's memory** - Will be lost when the session ends
2. **Documentation files** - Will persist, but I need to be directed to read them

**Best practice:** Document important preferences in `how-claude-works.md` or a `CLAUDE.md` file, and at the start of new sessions, reference these files or remind me of key conventions.

---

## Q&A: Resuming Work After Rate Limits

### Question

I told you that "You were cut off due to a rate limit. Please continue exactly from where you left off, ensuring the code/text seamlessly connects." Did this prompt actually help? Or did you have to start over? Help me understand the best way to resume work when you stop generating due to rate limit. I don't think you're able to continue automatically after the limit resets right?

### Answer

Great question! Let me be completely transparent about what actually happened and what works best.

#### What Actually Happened

When the rate limit hit, I stopped mid-generation. Then:

1. **The system created a summary** of everything that happened up to that point
2. **You sent a new message** telling me to continue
3. **I started a fresh turn** with:
   - The conversation summary (which told me I was updating Backend PRD validation rules and controllers)
   - File reminders (showing which files were previously read)
   - Your instruction to continue seamlessly

**The key insight**: I **cannot** automatically continue after the rate limit resets. I need a new message from you to trigger a new turn.

#### Did Your Prompt Help?

**YES**, your prompt was helpful because:

✅ **Clear intent**: "Continue exactly from where you left off" told me not to restart or wait for new instructions

✅ **Quality emphasis**: "ensuring the code/text seamlessly connects" told me to avoid repetition or gaps

✅ However, the summary had already captured where I was (updating validation rules around line 2692), so I didn't need you to specify exact details

#### What I Actually Did to Resume

I didn't magically remember where I was mid-sentence. Instead:

1. Read the summary → saw I was "updating Backend PRD to remove legacy references"
2. Read the file at the sections mentioned in the summary
3. Searched for remaining issues (`is_active`, `recurrence_rule`, etc.)
4. Systematically fixed them

So I **started over** on the cleanup task, but with **full context** of what needed to be done.

#### Best Ways to Resume After Rate Limit

**✅ Simple and Effective:**

- `"continue"`
- `"keep going"`
- `"finish the task"`
- `"continue from where you left off"`

**❌ Not Necessary:**

- ❌ Repeating all the context (I have the summary)
- ❌ Telling me the exact line number (I can figure it out)
- ❌ Re-explaining the entire task (summary has it)

**⚠️ One Important Caveat:**

If I was in the middle of writing a **specific large code block** or **editing a specific section**, the summary might not capture the exact incomplete sentence. In that case:

- I'll read the file to see what's done
- Continue with the remaining work
- There might be a small overlap/restart of the last incomplete edit

But for **task-based work** like "update all validation rules", the summary captures it perfectly and I can resume effectively.

#### Bottom Line

Your prompt helped by giving clear intent, but honestly, even just `"continue"` would have worked. The summary system is what really enables me to resume - it's like having detailed notes about where we were. I just need your message to trigger the next turn since I can't automatically continue after a rate limit.

---

## Q&A: Session Context and Finding Previous Prompts

### Background

During a work session, the user asked me to update prompt-history.md with their exact prompts along with paraphrases. I made an error by using plan text instead of the user's original words, which led to a learning conversation about how my session context works.

### Prompt 16

**User (exact words):**

> please also update prompt-history.md with my exact prompts along with your paraphrase

**Response:** Updated prompt-history.md but initially used the plan text instead of user's original words.

### Prompt 17

**User (exact words):**

> my exact words were not included, the newly added prompt was your paraphrase only. is it very hard to find what i said to you previously?

**Response:** Corrected the entry. Explained that I only had access to the current session where user said "Implement the following plan:" - the original words were in a previous plan mode session.

### Prompt 18

**User (exact words):**

> My exact words were:
> the current design mix people, vehicle and equipment all together under the umbrella term resource in both frontend and backend. That will create problems later as they have different data fields to store and different attributes to display. separate resournces into 3 different entities.
> why did you have trouble finding this?

**Response:** Apologized and explained: The original prompt was in a previous session (plan mode). This session only contained "Implement the following plan:" with pre-generated plan text. Should have read the transcript file referenced at the bottom of the plan.

### Prompt 19

**User (exact words):**

> i see. so each time i switch the mode, it starts a new session which makes you lose prior context? is there a way to fix this?

**Response:** ~~Yes, switching modes (like exiting plan mode) starts a new session and loses prior conversational context.~~

**Correction (2026-01-28):** This was incorrect. Switching modes does NOT create a new session. The session remains the same, but when you choose "clear context" options, the conversation history is cleared from the context window to save tokens, which causes loss of direct access to prior conversational context.

**Solutions to maintain context:**

1. Read the transcript file referenced in plans at the start of implementation
2. Update prompt-history.md during planning (before exiting plan mode)
3. Include "Original Request" section in plan documents
4. User can remind Claude to read transcript or state original request

### Prompt 20

**User (exact words):**

> yes please. also include our questions and answers on this topic in prompt-history so that i can refer back to this conversation later.

**Response:** Added this conversation to prompt-history.md. Adopted new standard practices:

- Update prompt-history.md before exiting plan mode with user's exact words
- Read referenced transcript files when implementing plans from previous sessions

### Key Takeaways

1. **Mode switching with context clearing**: When you choose "Yes, clear context and auto-accept edits" after planning, the session stays the same but the conversation history is cleared from the context window to save tokens. This means I lose direct access to the previous conversational context even though it's the same session.

2. **I can't automatically find your exact words after context clearing**: Once context is cleared, I need to read transcript files or documents where previous prompts were recorded.

3. **Workarounds**:
   - Reference transcript files in plans (I can read these)
   - Document user's exact words in prompt-history.md or plan documents
   - Remind me to read specific files if I need previous context

4. **Best practice**: Update documentation (like prompt-history.md) before exiting modes to preserve important context.

**Important correction:** Mode switching does NOT create a new session. The session (including session ID, working directory, git status) remains the same. What changes is whether conversation context is cleared to save tokens.

---

_Last updated: January 28, 2026_
