# How to Prompt Claude for Better PRDs and Documentation

This document contains tips, techniques, and examples for prompting Claude to generate better product requirements documents (PRDs), implementation plans, and technical documentation.

---

## Priority Labeling in PRDs

### Question

I don't see priority order explicitly listed for the core functionalities in the PRD files. I've seen P0, P1, etc. in sample PRDs (not sure what prompt will make Claude automatically include that). I'm guessing prioritization of tasks is simply hidden in the order of the implementation phases?

### Answer

You're absolutely correct! The prioritization is currently **implicit in the phase ordering** rather than explicitly labeled with P0, P1, P2, etc.

#### Current Prioritization (Implicit)

**Backend Implementation Plan:**
- Phases 1-3 (Setup, Auth, Multi-tenancy) = **P0** (Critical for MVP)
- Phases 4-6 (People, Vehicles, Equipment) = **P0** (Core entities)
- Phases 7-8 (Bookings, Conflict detection) = **P0** (Core functionality)
- Phase 9 (Testing & Polish) = **P0** (Quality assurance)

**Frontend Implementation Plan:**
- Phases 1-3 (Setup, Models, Auth) = **P0**
- Phases 4-8 (Core UI) = **P0**
- Calendar view (mentioned as "postponed") = **P2** (Future enhancement)

#### Explicit Priority Labels (Best Practice)

A more robust PRD would include sections like:

```markdown
### 2.3 Feature Prioritization

**P0 - Critical (MVP Blockers)**
- [ ] User authentication (register, login, logout)
- [ ] Multi-tenant company isolation
- [ ] CRUD for people, vehicles, equipment
- [ ] Booking creation with conflict detection
- [ ] Soft delete with undelete

**P1 - High Priority (Important, Can Delay 1-2 Weeks)**
- [ ] Advanced filtering in bookings list
- [ ] Email notifications for bookings
- [ ] Bulk operations (delete multiple resources)

**P2 - Medium Priority (Nice to Have)**
- [ ] Calendar view for bookings
- [ ] Export bookings to CSV/PDF
- [ ] Advanced search with autocomplete

**P3 - Low Priority (Future Enhancements)**
- [ ] Mobile app
- [ ] Two-factor authentication
- [ ] API webhooks
- [ ] Custom fields for resources
```

#### Priority Level Definitions

| Priority | Label | Description | Timeline |
|----------|-------|-------------|----------|
| **P0** | Critical | MVP blockers - cannot launch without these | Must complete before launch |
| **P1** | High | Important features that should be in first release | 1-2 weeks after P0 |
| **P2** | Medium | Nice-to-have features that improve user experience | 1-2 months after launch |
| **P3** | Low | Future enhancements, can be deferred indefinitely | 3+ months after launch |

#### Alternative: MoSCoW Prioritization

Some teams prefer MoSCoW method:

```markdown
### Feature Prioritization (MoSCoW)

**Must Have (MVP Blockers)**
- User authentication
- Multi-tenant isolation
- Resource management

**Should Have (High Priority)**
- Email notifications
- Advanced filtering

**Could Have (Nice to Have)**
- Calendar view
- Export functionality

**Won't Have (Out of Scope for Now)**
- Mobile app
- Two-factor authentication
```

---

## Prompts to Get Claude to Include Priority Labels

### Option 1: Explicit Request

**Prompt:**
> "Create a PRD for [product] and include explicit priority labels (P0, P1, P2, P3) for all features and requirements. Use P0 for MVP blockers, P1 for high priority, P2 for nice-to-have, and P3 for future enhancements."

**When to use:** When starting a new PRD from scratch.

---

### Option 2: Reference Industry Standards

**Prompt:**
> "Create a PRD following industry best practices, including MoSCoW prioritization (Must have, Should have, Could have, Won't have) or P0-P3 priority labels."

**When to use:** When you want Claude to follow established patterns without specifying exact format.

---

### Option 3: Provide a Template

**Prompt:**
> "Use this structure for the PRD:
>
> 1. Overview
> 2. Technical Stack
> 3. Feature Prioritization
>    - P0 - Critical (MVP Blockers)
>    - P1 - High Priority
>    - P2 - Medium Priority
>    - P3 - Low Priority
> 4. Database Schema
> 5. API Endpoints
> ...
>
> Create a PRD for [product] following this structure."

**When to use:** When you have a specific PRD format your team uses.

---

### Option 4: Iterative Refinement

**Initial Prompt:**
> "Create a PRD for a multi-tenant resource scheduling application."

**Follow-up Prompt:**
> "Add a Feature Prioritization section with P0-P3 labels for all features. Mark everything required for MVP as P0, important post-launch features as P1, nice-to-haves as P2, and future enhancements as P3."

**When to use:** When you receive a PRD without priorities and want to add them.

---

### Option 5: Include Example in Context

**Prompt:**
> "Create a PRD for [product]. Here's an example of the priority format I want:
>
> **P0 - Critical (MVP Blockers)**
> - [ ] User authentication
> - [ ] Data persistence
>
> **P1 - High Priority**
> - [ ] Email notifications
>
> Use this same format for all features in the PRD."

**When to use:** When you want Claude to match a specific style or format.

---

## Other PRD Best Practices

### Include Success Metrics

**Prompt:**
> "For each major feature in the PRD, include measurable success metrics (e.g., 'User registration should complete in < 30 seconds', 'API response time < 200ms')."

### Add User Stories

**Prompt:**
> "Include user stories for each feature in the format: 'As a [user type], I want to [action], so that [benefit].'"

### Specify Non-Functional Requirements

**Prompt:**
> "Include a section on non-functional requirements covering: performance, security, scalability, accessibility, and maintainability."

### Request Wireframes/Diagrams

**Prompt:**
> "Include ASCII diagrams or mermaid.js syntax for architecture diagrams, database schema, and user flows."

### Add Risk Assessment

**Prompt:**
> "Include a risk assessment section identifying technical risks, mitigation strategies, and contingency plans for each major feature."

### Include Dependencies

**Prompt:**
> "For each feature, list its dependencies on other features or external systems. Mark which features are blockers for others."

---

## Implementation Plan Best Practices

### Request Time Estimates

**Prompt:**
> "Create an implementation plan with realistic time estimates for each phase. Assume a single full-time developer. Include buffer time for unexpected issues."

### Include Verification Steps

**Prompt:**
> "For each phase in the implementation plan, include verification steps (tests to run, behaviors to verify, acceptance criteria)."

### Add Checkpoint Milestones

**Prompt:**
> "Add milestone checkpoints after every 2-3 phases where we'll demo progress and re-evaluate priorities."

### Request Parallel Work Identification

**Prompt:**
> "Identify which phases or tasks can be worked on in parallel by multiple developers vs. which must be done sequentially."

---

## Documentation Best Practices

### Request Quick Start Section

**Prompt:**
> "Include a 'Quick Start' section at the beginning with the minimum commands needed to get the project running."

### Include Troubleshooting

**Prompt:**
> "Add a troubleshooting section covering common errors and their solutions."

### Add Examples

**Prompt:**
> "For each major feature or API endpoint, include concrete examples with request/response payloads."

### Request Checklists

**Prompt:**
> "Format all multi-step processes as checklists with [ ] checkboxes so I can track progress."

---

## Tips for Better Claude Responses

### 1. Be Specific About Output Format

❌ **Vague:** "Create documentation for the API"
✅ **Specific:** "Create API documentation in OpenAPI 3.0 format with request/response examples for all endpoints"

### 2. Provide Context

❌ **No context:** "Create a PRD for a booking system"
✅ **With context:** "Create a PRD for a multi-tenant resource booking system. The system will manage people, vehicles, and equipment. Users belong to companies and can only see their company's data. Include JWT authentication and soft delete."

### 3. Reference Examples

❌ **No reference:** "Create a PRD"
✅ **With reference:** "Create a PRD similar to the backend PRD we created earlier, but for the frontend using React + Vite + Backbone.js"

### 4. Use Iterative Refinement

Start broad, then refine:
1. "Create a high-level PRD for [product]"
2. "Expand the database schema section with complete SQL migrations"
3. "Add validation rules for each API endpoint"
4. "Add priority labels (P0-P3) to all features"

### 5. Request Consistency

**Prompt:**
> "Maintain consistency with the backend PRD we created earlier. Use the same terminology, priority system, and document structure."

### 6. Ask for Trade-off Analysis

**Prompt:**
> "When proposing technical solutions, include pros/cons and explain why you recommend one approach over alternatives."

---

## Example: Complete PRD Request Prompt

Here's a comprehensive prompt that incorporates many best practices:

```
Create a comprehensive PRD for a [product description].

Requirements:
1. Use this structure:
   - Overview (product summary, key features)
   - Technical Stack
   - Feature Prioritization (P0-P3 labels)
   - Database Schema (with complete SQL migrations)
   - API Endpoints (with request/response examples)
   - Authentication & Authorization
   - Error Handling
   - Testing Strategy
   - Deployment

2. For Feature Prioritization:
   - Mark MVP blockers as P0
   - Mark important post-launch features as P1
   - Mark nice-to-haves as P2
   - Mark future enhancements as P3

3. For each API endpoint, include:
   - HTTP method and path
   - Request body (with validation rules)
   - Success response (with example)
   - Error responses (with status codes)
   - Authentication requirements

4. Include success metrics for major features

5. Add a risks/assumptions section

6. Use checkboxes [ ] for any multi-step processes

7. Include troubleshooting section for common issues

Additional context:
- [Any specific requirements, constraints, or preferences]
```

---

## Maintaining Consistency Across Sessions

### Reference Previous Work

**Prompt:**
> "Reference @PRD-backend.md when creating the frontend PRD. Use consistent terminology and structure."

### Create a Style Guide

**Prompt:**
> "Based on the PRDs we've created, generate a style guide document that defines our documentation standards (terminology, structure, priority labels, etc.)"

### Use CLAUDE.md for Project Context

Store project-specific conventions in `CLAUDE.md` so Claude automatically follows them in new sessions.

---

## When to Update This Document

Add new entries when you:
- Discover a particularly effective prompt pattern
- Learn a technique that improves documentation quality
- Find a way to get Claude to include something important by default
- Identify a common mistake and how to avoid it

---

*Document Version: 1.0*
*Created: January 2026*
*Last Updated: January 2026*
