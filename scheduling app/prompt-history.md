# Prompt History — SchedulePro Landing Page PRD

---

## Session: January 2026

### Prompt 1

**User:** I'm a developer and I want to create a scheduling web app for companies to manage their people, vehicles and equipment. Build a PRD for a landing page for this app.

**Response:** Created `PRD-landing-page.md` with comprehensive sections covering overview, page structure, design requirements, functional requirements, content requirements, success metrics, technical stack, timeline, and open questions.

---

### Prompt 2

**User:** For tech stack, I want to use React and Backbone.js.

**Response:** Updated Section 7 (Technical Stack) to use React for UI and Backbone.js for application structure (models, collections, router). Added architecture notes on integration patterns.

---

### Prompt 3

**User:** List core MVP features with MoSCoW prioritization.

**Response:** Added Section 2 (MVP Features — MoSCoW Prioritization) with:

- **MUST Have:** Hero, signup form, features, how it works, problem statement, mobile-responsive, form validation
- **SHOULD Have:** SEO, analytics, footer with legal, sticky nav, hero image, success states, performance, smooth scroll
- **COULD Have:** Social proof, pricing, FAQ, demo booking, animations, video, chat widget, A/B testing
- **WON'T Have:** Auth, multi-language, blog, pricing calculator, personalization, dark mode, help center

---

### Prompt 4

**User:** I've swapped some items between Must Have and Should Have. Does this prioritization roughly correspond to the timeline and phases section?

**Response:** Identified misalignments between MoSCoW and Timeline sections:

- Phase 1 was missing "How it works" and "Problem statement" (both MUST have)
- Phase 3 included personalization (marked as WON'T have)
- SHOULD have items weren't mapped to any phase

---

### Prompt 5

**User:** Yes (align the sections)

**Response:** Updated Timeline & Phases to align with MoSCoW:

- Phase 1: MVP Landing Page (MUST Have)
- Phase 2: Polish & Compliance (SHOULD Have)
- Phase 3: Enhanced Conversion (COULD Have)

Removed personalization from Phase 3 to resolve conflict.

---

### Prompt 6

**User:** Can you translate 功能模块拆解 into English?

**Response:** **功能模块拆解** = "Feature Module Breakdown" or "Functional Module Decomposition"

Refers to breaking down a system into its individual feature components.

---

### Prompt 7

**User:** What about 拆分任务? Is that similar too?

**Response:** **拆分任务** = "Task Breakdown" or "Split into Tasks"

Related but different focuses:

| Term         | Translation              | Focus                                                                   |
| ------------ | ------------------------ | ----------------------------------------------------------------------- |
| 功能模块拆解 | Feature Module Breakdown | **What** the system does — components, features, structure              |
| 拆分任务     | Task Breakdown           | **What work** needs to be done — actionable items, implementation steps |

In the PRD:

- **Section 2 (MoSCoW)** and **Section 3 (Page Structure)** = 功能模块拆解
- **Section 9 (Timeline & Phases)** = 拆分任务

The first defines the product; the second defines the work to build it.

---

### Prompt 8

**User:** change of plan: Separate the original doc (docs/prd/landing-page.md) into 3 new docs for landing, frontend and backend: 1. landing: i've downloaded a react app template - please just generate a prd on how to modify the copy 2. frontend: we will build a new react + backbone.js app 3. backend: we will build a new php server Generate production ready prd; ask any questions if need to

**Response:** Entered plan mode to analyze the existing React template at `D:\JR AI coding\landing-page` and design the approach for 3 separate PRDs.

---

### Prompt 9

**User:** (Selected answers to clarification questions via AskUserQuestion tool)
- "What is the product name?" → SchedulePro
- "What pricing tiers for the landing page?" → Free / Pro / Enterprise
- "What user roles are needed for the app?" → Admin + Member

**Response:** Confirmed product name, pricing tiers, and user roles. Continued with planning.

---

### Prompt 10

**User:** (Approved the plan via ExitPlanMode)

**Response:** Plan approved. Created detailed specifications for 3 PRDs:
1. Landing Page PRD — Exact copy modifications for Next.js template
2. Frontend PRD — React + Backbone.js scheduling app
3. Backend PRD — Laravel + MySQL multi-tenant API

---

### Prompt 11

**User:** Implement the following plan: [full plan text for Create 3 Separate PRDs for SchedulePro]

**Response:** Created 3 production-ready PRD files:

| File | Lines | Contents |
|------|-------|----------|
| `docs/prd/PRD-landing-page.md` | 330 | Copy modifications with exact file paths, line numbers, before/after comparisons |
| `docs/prd/PRD-frontend.md` | 480 | React + Backbone.js architecture, models, collections, hooks, routing |
| `docs/prd/PRD-backend.md` | 580 | Laravel + MySQL schema, API endpoints, multi-tenancy, conflict detection |

---

### Prompt 12

**User:** Update Backend PRD from Laravel to CodeIgniter 4

**Response:** Completely rewrote `docs/prd/PRD-backend.md` replacing all Laravel-specific code and architecture with CodeIgniter 4 equivalents:

| Laravel | CodeIgniter 4 |
|---------|---------------|
| Laravel 11 | CodeIgniter 4.x |
| Laravel Sanctum | Custom JWT with firebase/php-jwt |
| Laravel Queue | CodeIgniter Tasks |
| Eloquent ORM | CI4 Model + Query Builder |
| Artisan CLI | Spark CLI |
| Middleware | Filters |
| FormRequest | CI4 Validation config |
| Global Scopes | Manual company scoping in Models |

Key structural changes:
- Project structure updated to CI4 conventions (`app/Filters/`, `app/Libraries/`, `writable/`)
- Database migrations rewritten in CI4 format using `$this->forge`
- Models now extend `CodeIgniter\Model` with `$allowedFields`, `$validationRules`, `$casts`
- Authentication via JWT tokens instead of Sanctum
- Routes defined in `app/Config/Routes.php` with filter assignments
- Validation rules defined in `app/Config/Validation.php`
- Deployment uses `php spark` commands instead of `php artisan`

---
