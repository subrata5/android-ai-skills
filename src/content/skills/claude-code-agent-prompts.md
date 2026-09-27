---
title: "Claude Code Agent Workflows"
description: "Structure autonomous AI agent workflows, system instructions, planning boundaries, sub-agent reviews, and evidence-based completion gates."
category: "AI"
phase: "Build"
command: "/build"
trigger: "Use when delegating multi-file Android features, refactorings, or automated verification tasks to agentic coding tools."
tags:
  - claude-code
  - agent
  - prompts
  - automation
order: 7
related:
  - ai-assisted-copilot-workflow
  - clean-architecture-mvvm
  - modular-android-architecture
---

# Claude Code Agent Workflows

## The Situation

Autonomous agentic coding tools (like Claude Code, AutoGPT, and custom AI agents) possess tool-use capabilities to read files, run terminal commands, execute build tools, and modify multiple files across your Android codebase. However, unconstrained agent execution frequently degrades into destructive action loops: modifying unrelated files, breaking build scripts, writing low-quality stub code, or declaring victory without actual build verification.

To harness agentic power safely, senior engineers establish strict **governance structures**: project-level context instructions (`CLAUDE.md`), two-phase planning vs execution workflows, automated permission boundaries, sub-agent code reviewer patterns, and non-negotiable command-line evidence criteria for task completion.

---

## Workflow

### 01 Project Governance File Setup (`CLAUDE.md`)

**Intent:** Provide unambiguous, persistent system rules that every agent session must read and obey.

**Actions:**
* Create a root `CLAUDE.md` file specifying module structure, code style, build commands, and testing standards.
* Define explicit prohibitory guidelines (e.g. "Do NOT edit `build.gradle.kts` without approval", "Never add `@Suppress` annotations", "Always use Kotlin Coroutines Flow, never LiveData").
* List exact verification commands (`./gradlew testDebugUnitTest`, `./gradlew detekt`).

**Evidence:**
Agent logs show initial step reading `CLAUDE.md` and respecting repository boundaries.

```markdown
# Repository Instructions for Claude Code Agent

## Technology Stack
- Kotlin 2.0+, Jetpack Compose, Hilt, Room, Retrofit
- Clean Architecture (UI -> Domain -> Data)

## Strict Rules
1. NEVER modify Gradle build files without explicit confirmation.
2. NEVER use LiveData or RxJava; use Kotlin StateFlow and SharedFlow.
3. ALL new UseCases MUST have a corresponding JUnit5 test file.
4. Run `./gradlew testDebugUnitTest` before claiming task completion.
```

---

### 02 Two-Phase Planning vs Execution Protocol

**Intent:** Prevent autonomous agents from writing improper code by separating requirement analysis from implementation.

**Actions:**
* Phase 1 (Plan): Instruct agent to read source files, trace execution paths, and write an `implementation_plan.md` artifact detailing proposed file edits.
* Review & Approve: Human engineer verifies the plan for architectural compliance.
* Phase 2 (Execute): Instruct agent to execute the plan step-by-step, running tests after each file modification.

**Evidence:**
Implementation plan artifact created and approved prior to any source code mutation.

---

### 03 Fresh-Context Verification & Sub-Agent Review

**Intent:** Prevent agent "context drift" and catch edge-case bugs by spawning isolated code reviewer instances.

**Actions:**
* After primary agent completes implementation, clear context window or launch a dedicated Reviewer sub-agent.
* Provide the reviewer agent with `git diff` output and demand an independent audit for security leaks, threading issues, and architectural violations.
* Address any red flags identified by the reviewer agent before merging.

**Evidence:**
Reviewer sub-agent log confirms zero critical anti-patterns found in `git diff`.

---

### 04 Evidence-Based Completion Gate

**Intent:** Eliminate false "task completed" claims by requiring un-truncated execution logs.

**Actions:**
* Reject agent completion messages that state "Build looks good" without log output.
* Require agent to execute `./gradlew assembleDebug testDebugUnitTest lintDebug` and output terminal results.
* Verify log returns exit code 0 with zero failed test cases.

**Evidence:**
Agent transcript includes verified Gradle build output: `BUILD SUCCESSFUL in 14s`.

---

## Anti-Rationalization Gate

### Excuse
"I can save time by letting the agent plan and modify code in a single prompt."

### Rebuttal
Unplanned multi-file modifications by AI agents result in broken imports, half-implemented abstractions, and lost context. Enforce the two-phase Plan-then-Execute protocol for any non-trivial change.

---

### Excuse
"The agent outputted 'All tests passed', so I don't need to see the terminal output."

### Rebuttal
Agents can hallucinate terminal success output if not explicitly bound to verification logs. Demanding raw command output ensures empirical proof of success.

---

## Red Flags

* Agent modifying `build.gradle.kts` dependencies without user authorization.
* Agent looping continuously on a failing build error without altering strategy.
* Lack of `CLAUDE.md` project context file in root workspace.
* Agent declaring completion while unit test tasks failed or were skipped.

---

## Verification

1. **Governance File Audit:** Verify `CLAUDE.md` exists and contains accurate project constraints.
2. **Execution Log Pass:** Confirm Gradle build and test terminal output exists in agent run log.
3. **Git Diff Audit:** Run `git diff main` to verify changes match approved implementation plan.

---

## Exit Criteria

* [ ] `CLAUDE.md` configured at root level.
* [ ] Implementation plan created and approved before code execution.
* [ ] Agent executed changes incrementally with test checkpoints.
* [ ] Sub-agent or clean-context review performed on `git diff`.
* [ ] Empirical `./gradlew test` output proves zero test failures.
