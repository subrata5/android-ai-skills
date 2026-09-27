# Android AI Engineering Skills

> Production-grade skills catalog for senior Android engineers and AI coding agents.

A statically generated, minimal, dark developer-tool documentation website encoding senior-engineer workflows, architectural discipline, quality gates, anti-rationalization checks, and verification evidence.

Inspired by the visual language, information architecture, and technical documentation UX of [skills.addy.ie](https://skills.addy.ie/).

---

## 🚀 Tech Stack

* **Core Framework:** [Astro 5](https://astro.build/) (Static Site Generation, `output: 'static'`)
* **Styling:** [Tailwind CSS v3](https://tailwindcss.com/) with dark technical design system
* **Content System:** Astro Content Collections with Zod schema validation
* **Language:** TypeScript
* **Client Behavior:** Vanilla JavaScript (zero client framework runtime)
* **Deployment:** GitHub Pages & GitHub Actions (`.github/workflows/deploy.yml`)

---

## 🛠 Local Setup & Commands

### Prerequisites
* Node.js v18.x or v20.x+
* npm v9.x+

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

### Build Production Static Site
```bash
npm run build
```
Generates static HTML/CSS/JS files inside the `dist/` directory.

### Preview Production Build Locally
```bash
npm run preview
```

---

## 🌐 GitHub Pages Deployment & Base Path Configuration

This project is pre-configured for GitHub Pages deployment.

### Changing the GitHub Pages Base Path & Site URL
Edit `astro.config.mjs` or set environment variables:

```js
// astro.config.mjs
export default defineConfig({
  site: process.env.SITE_URL || 'https://<your-username>.github.io',
  base: process.env.BASE_PATH || '/<your-repo-name>',
  // ...
});
```

Or pass environment variables during build:
```bash
BASE_PATH="/android-ai-skills" SITE_URL="https://myorg.github.io" npm run build
```

---

## 📁 Project Structure

```
android-ai-skills/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # PR Quality Gate workflow
│       └── deploy.yml             # GitHub Pages deployment workflow
│
├── public/
│   └── favicon.svg                # Minimalist developer favicon
│
├── src/
│   ├── components/
│   │   ├── Header.astro           # Sticky shell navigation
│   │   ├── Footer.astro           # Site footer
│   │   ├── Hero.astro             # Homepage hero section
│   │   ├── Lifecycle.astro        # 6-phase lifecycle visual container
│   │   ├── LifecycleStep.astro    # Individual lifecycle phase card
│   │   ├── SkillCard.astro        # Skill grid card component
│   │   ├── SkillGrid.astro        # Grid wrapper for skill cards
│   │   ├── PhaseBadge.astro       # Monospaced phase badge
│   │   ├── TagList.astro          # Technical tag list
│   │   ├── TerminalBlock.astro    # Copyable bash terminal block
│   │   ├── SkillAnatomy.astro     # 6-pillar skill anatomy card
│   │   ├── RelatedSkills.astro    # Bottom related skill cards
│   │   ├── SkillNavigation.astro # Previous / Next skill links
│   │   ├── SearchFilter.astro     # Vanilla JS live search & filter
│   │   └── SpecialistPanel.astro  # Senior reviewer persona panel
│   │
│   ├── content/
│   │   └── skills/                # 20 Skill Markdown files
│   │       ├── jetpack-compose-ui.md
│   │       ├── clean-architecture-mvvm.md
│   │       ├── coroutines-and-flow.md
│   │       ├── room-database-offline-first.md
│   │       ├── dagger-hilt-dependency-injection.md
│   │       ├── ai-assisted-copilot-workflow.md
│   │       ├── claude-code-agent-prompts.md
│   │       ├── modular-android-architecture.md
│   │       ├── test-driven-development-junit.md
│   │       ├── ui-testing-compose-rule.md
│   │       ├── memory-leak-profiling.md
│   │       ├── ci-cd-github-actions.md
│   │       ├── play-store-staged-rollouts.md
│   │       ├── secure-shared-preferences.md
│   │       ├── background-workmanager.md
│   │       ├── reactive-state-hoisting.md
│   │       ├── network-caching-retrofit.md
│   │       ├── gradle-build-optimization.md
│   │       ├── accessibility-wcag-android.md
│   │       └── feature-flag-rollouts.md
│   │
│   ├── layouts/
│   │   └── Layout.astro           # Root SEO HTML layout
│   │
│   ├── pages/
│   │   ├── index.astro            # Homepage
│   │   ├── skills/
│   │   │   ├── index.astro        # Skills catalog page
│   │   │   └── [slug].astro       # Dynamic skill detail page
│   │   └── 404.astro              # Custom 404 error page
│   │
│   ├── styles/
│   │   └── global.css             # Design tokens & global CSS
│   │
│   ├── utils/
│   │   └── url.ts                 # Base-path relative URL helper
│   │
│   └── content.config.ts          # Astro Content Collections schema
│
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── tailwind.config.mjs
└── README.md
```

---

## 📝 Adding a New Skill

To add a new skill to the catalog, create a Markdown file in `src/content/skills/<slug>.md`:

```markdown
---
title: "Your Skill Title"
description: "Concise senior engineering summary of the skill."
category: "UI" # UI | Architecture | Async | Data | AI | Testing | Performance | Security | CI/CD | Release | Accessibility | Background | State | Networking | Build
phase: "Build" # Define | Architecture | Build | Test | Review | Ship
command: "/build"
trigger: "Use when..."
tags:
  - android
  - kotlin
order: 21
related:
  - jetpack-compose-ui
---

# Your Skill Title

## The Situation
Context, failure modes without this skill, and senior judgment required.

## Workflow
Step-by-step engineering instructions with Kotlin examples.

## Anti-Rationalization Gate
Excuses and senior engineer rebuttals.

## Red Flags
Warning signs and code smells.

## Verification
Evidence required before completion.

## Exit Criteria
Checklist of mandatory quality gates.
```

---

## 📄 License
MIT License. Free to use for personal, commercial, and agentic workflows.
