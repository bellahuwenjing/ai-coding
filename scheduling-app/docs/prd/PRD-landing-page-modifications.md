# PRD: Landing Page Copy Modifications
## SchedulePro - Resource Scheduling Platform

---

## 1. Overview

### 1.1 Purpose
Modify copy in the existing Next.js template at `D:\JR AI coding\landing-page` to convert from AI agent builder to SchedulePro scheduling app.

### 1.2 Scope
This PRD covers **copy modifications only** — no structural changes to the existing template.

---

## 2. Files to Modify

### 2.1 sections/hero-section.jsx (lines 25-44)

| Element | Current | New |
|---------|---------|-----|
| Tagline | "Smart, Fast, Always Active." | "Schedule Smarter. Work Better." |
| Button | "Launch App" | "Get Started" |
| Headline | "Build, Deploy & Talk to AI Agents in Seconds." | "Schedule Your People, Vehicles & Equipment — All in One Place" |
| Subheadline | "Design AI assistants that research..." | "Stop juggling spreadsheets. SchedulePro gives you one unified calendar to manage all your resources and eliminate double-bookings." |
| Primary CTA | "Create Agent" | "Start Free Trial" |
| Secondary CTA | "Watch Demo" | "Book a Demo" |

---

### 2.2 sections/features.jsx (lines 10-26)

**Features Data:**
```javascript
const featuresData = [
    {
        icon: CalendarIcon,  // change from BotIcon
        title: "Unified Calendar",
        description: "See all your people, vehicles, and equipment in one view.",
    },
    {
        icon: MousePointerClickIcon,  // change from BrainIcon
        title: "Drag & Drop Scheduling",
        description: "Assign resources to jobs with intuitive drag and drop.",
    },
    {
        icon: AlertTriangleIcon,  // change from ZapIcon
        title: "Conflict Detection",
        description: "Get instant alerts before double-booking any resource.",
    }
];
```

**SectionTitle (lines 31-32):**
- title: `"Scheduling features"`
- description: `"Everything you need to manage your team and assets efficiently."`

---

### 2.3 sections/workflow-steps.jsx (lines 5-27)

**Steps Data:**
```javascript
const steps = [
    {
        id: 1,
        title: "Add Your Resources",
        description: "Import your team members, vehicles, and equipment. Set availability, skills, and certifications for each resource.",
        link: "#!",
        image: "/assets/workflow1.png",
    },
    {
        id: 2,
        title: "Create Schedules",
        description: "Drag and drop to assign resources to jobs. See availability at a glance and avoid conflicts automatically.",
        link: "#!",
        image: "/assets/workflow2.png",
    },
    {
        id: 3,
        title: "Stay in Sync",
        description: "Your team sees their schedules in real-time. Changes sync instantly across all devices.",
        link: "#!",
        image: "/assets/workflow3.png",
    },
];
```

**SectionTitle (lines 32-35):**
- title: `"From chaos to clarity in three simple steps"`
- description: `"Get your entire operation scheduled and synced in minutes, not hours."`

---

### 2.4 sections/testimonials.jsx (lines 8-51)

**Testimonials Data:**
```javascript
const data = [
    {
        review: 'SchedulePro eliminated our double-booking nightmare. We used to waste hours fixing scheduling conflicts — now it just works.',
        name: 'Sarah Chen',
        about: 'Operations Manager',
        rating: 5,
        image: '/assets/testimonial1.jpg',
    },
    {
        review: 'Finally, one place to see all our trucks and crew. The drag-and-drop interface is so intuitive my team learned it in minutes.',
        name: 'Marcus Johnson',
        about: 'Fleet Manager',
        rating: 5,
        image: '/assets/testimonial2.jpg',
    },
    {
        review: 'We manage 200+ employees across 3 locations. SchedulePro handles it all without breaking a sweat.',
        name: 'Emily Rodriguez',
        about: 'HR Director',
        rating: 5,
        image: '/assets/testimonial3.jpg',
    },
    {
        review: 'The real-time sync is a game-changer. Our field teams always know exactly where they need to be.',
        name: 'David Park',
        about: 'Project Manager',
        rating: 5,
        image: '/assets/testimonial4.jpg',
    },
    {
        review: 'Cut our scheduling time by 70%. What used to take a full day now takes an hour.',
        name: 'Lisa Thompson',
        about: 'Owner, Thompson Construction',
        rating: 5,
        image: '/assets/testimonial5.jpg',
    },
    {
        review: 'Best investment we made this year. ROI was positive within the first month.',
        name: 'James Wilson',
        about: 'COO',
        rating: 5,
        image: '/assets/testimonial6.jpg',
    },
];
```

**SectionTitle (lines 54-57):**
- title: `"Trusted by operations teams everywhere"`
- description: `"See why hundreds of companies switched to SchedulePro."`

---

### 2.5 sections/pricing-plans.jsx (lines 8-55)

**Pricing Data:**
```javascript
const data = [
    {
        icon: RocketIcon,
        title: 'Free',
        description: 'For small teams getting started',
        price: '$0',
        buttonText: 'Get Started',
        features: [
            'Up to 10 resources',
            '1 user',
            'Basic calendar view',
            'Email support',
            '7-day schedule history',
            'Mobile access'
        ],
    },
    {
        icon: ZapIcon,
        title: 'Pro',
        description: 'For growing teams',
        price: '$29',
        mostPopular: true,
        buttonText: 'Start Free Trial',
        features: [
            'Unlimited resources',
            'Up to 10 users',
            'Drag & drop scheduling',
            'Conflict detection',
            'Unlimited history',
            'Priority support'
        ],
    },
    {
        icon: CrownIcon,
        title: 'Enterprise',
        description: 'For large organizations',
        price: '$99',
        buttonText: 'Contact Sales',
        features: [
            'Everything in Pro',
            'Unlimited users',
            'Custom integrations',
            'Dedicated account manager',
            'SSO / SAML',
            'SLA guarantee'
        ],
    },
];
```

**SectionTitle (lines 60-62):**
- title: `"Simple, transparent pricing"`
- description: `"Start free. Upgrade when you need more."`

---

### 2.6 sections/faq-section.jsx (lines 8-33)

**FAQ Data:**
```javascript
const data = [
    {
        question: 'How long does it take to set up SchedulePro?',
        answer: 'Most teams are up and running in under 30 minutes. Simply add your resources, set their availability, and start scheduling.',
    },
    {
        question: 'Can I import my existing data?',
        answer: 'Yes! You can import resources via CSV or connect directly to your HR system. We also offer free migration assistance for Pro and Enterprise plans.',
    },
    {
        question: 'What types of resources can I schedule?',
        answer: 'SchedulePro handles people (employees, contractors), vehicles (trucks, vans, equipment), and assets (tools, rooms, machinery) — all in one unified calendar.',
    },
    {
        question: 'Is my data secure?',
        answer: 'Absolutely. We use bank-level encryption, regular backups, and are SOC 2 compliant. Your data is isolated per company and never shared.',
    },
    {
        question: 'Can my team access schedules on mobile?',
        answer: 'Yes, SchedulePro works on any device. Your team can view their schedules, receive notifications, and update availability from their phones.',
    },
    {
        question: 'What happens if I exceed my plan limits?',
        answer: "We'll notify you when you're approaching limits. You can upgrade anytime, and we prorate the difference. No surprises.",
    },
];
```

**SectionTitle (line 37):**
- title: `"Frequently Asked Questions"`
- description: `"Got questions? We've got answers."`

---

### 2.7 sections/call-to-action.jsx (lines 17-26)

| Element | Current | New |
|---------|---------|-----|
| Headline | "Ready to build?" | "Ready to take control of your schedule?" |
| Subtext | "See how fast you can turn your ideas into reality..." | "Join hundreds of teams who've eliminated scheduling chaos. Start your free trial today — no credit card required." |
| Button | "Try now" | "Start Free Trial" |

---

### 2.8 components/navbar.jsx (lines 15-21)

**Navigation Links:**
```javascript
const links = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
];
```

**Additional Updates:**
- Logo: Replace with SchedulePro logo
- Sign Up button text: `"Start Free Trial"`

---

### 2.9 components/footer.jsx (lines 8-13, 48-49)

**Footer Links:**
```javascript
const links = [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Contact', href: '/contact' },
];
```

**Additional Updates:**
- Logo: SchedulePro logo
- Tagline (line 48): `"Schedule smarter with SchedulePro"`
- Copyright: `"© 2026 SchedulePro. All rights reserved."`

---

### 2.10 Additional Files

| File | Change |
|------|--------|
| `app/layout.js` | Update meta title: `"SchedulePro - Resource Scheduling Made Simple"` and description |
| `app/manifest.json` | Update app name to `"SchedulePro"` |
| `public/assets/logo.svg` | Replace with SchedulePro logo |

---

## 3. Icon Changes Summary

| File | Old Icon | New Icon |
|------|----------|----------|
| features.jsx | BotIcon | CalendarIcon |
| features.jsx | BrainIcon | MousePointerClickIcon |
| features.jsx | ZapIcon | AlertTriangleIcon |

**Note:** Icons are from `lucide-react` library.

---

## 4. Verification Checklist

- [ ] All AI/agent references removed
- [ ] SchedulePro branding consistent throughout
- [ ] Pricing matches: Free ($0) / Pro ($29) / Enterprise ($99)
- [ ] CTAs updated to scheduling-focused language
- [ ] No broken links after copy changes
- [ ] Mobile responsiveness preserved

---

*Document Version: 1.0*
*Last Updated: January 2026*
