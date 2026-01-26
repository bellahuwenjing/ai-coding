Stan's prompt:
First help me improve my prd (documentation). Currently, i only have one prd at: docs/prd/landing-page.md; but it's mixing up landing page, frontend app and backend app.
I've created folders under this space for landing, frontend and backend respectively. Separate the original doc (docs/prd/landing-page.md) into 3 new docs for landing, frontend and backend:

1. landing: i've downloaded a react app template - please just generate a prd on how to modify the copy
2. frontend: we will build a new react app
3. backend: we will build a new nodejs (typescript) express server  
   Generate production ready prd; ask any questions if need to.

What is the primary goal of the landing page? This helps define the copy focus. → Product showcase
· For the frontend app MVP, which features should be included in Phase 1? → Full P0 features
· What authentication approach for the backend? → Email + Phone (Recommended)
· What language should the PRDs be written in? → English (Recommended)

---

Help me improve my landing page. I've only just downloaded a templates from the internet (located at: landing-page). Please read and understand the prd for landing page first  
 at docs/prd/landing/prd.md then modify the landing page project. ask questions if need to.

claude --dangerously-skip-permissions

Start implement the frontend app based on the prd at: docs/prd/frontend/prd.md.

1. generate production-ready code
2. don't have to follow the best engineering practice - focus on the practical side but also make it extendable

3. leave out authentication, analytics and testing ask questions if need to
