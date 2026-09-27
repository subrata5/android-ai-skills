---
title: "AI-Assisted Copilot Workflow"
description: "Leverage AI coding assistants effectively in Android development using context boundaries, TDD, incremental checkpoints, and rigorous verification."
category: "AI"
phase: "Build"
command: "/build"
trigger: "Use when pair programming with inline coding assistants to generate typed Android code while preserving engineering ownership."
tags:
  - ai
  - copilot
  - workflow
  - verification
order: 6
related:
  - claude-code-agent-prompts
  - test-driven-development-junit
  - ui-testing-compose-rule
---

# AI-Assisted Copilot Workflow

## The Situation

AI coding assistants (GitHub Copilot, Cursor, Codeium) offer rapid code completion and boilerplate generation. However, naive reliance on AI suggestions leads to subtle production defects: hallucinated API signatures, obsolete Jetpack library calls, hidden main-thread disk access, broken state hoisting, and unverified edge cases.

A senior engineer treats an AI copilot as a high-speed junior pair-programmer. The human engineer defines the repository context, establishes non-negotiable architectural boundaries, enforces test-driven task decomposition, reviews every diff line-by-line, and verifies generated code using automated compilers and unit test suites before committing.

---

## Workflow

### 01 Task Decomposition & Context Scoping

**Intent:** Provide explicit, tightly scoped repository context to prevent AI hallucinations and out-of-scope edits.

**Actions:**
* Break large feature requests into micro-tasks (e.g. "Create Room Entity", "Write UseCase unit test", "Implement ViewModel state flow").
* Reference relevant existing files explicitly (`@UserRepository.kt`, `@UserProfileState.kt`) to bound model assumptions.
* Explicitly specify library versions (e.g. "Use Jetpack Compose Foundation 1.7+, Kotlin Coroutines 1.8+ with Flow").

**Evidence:**
AI prompt includes specific class target paths and concise acceptance criteria.

---

### 02 Test-First Generation Boundary

**Intent:** Force the AI assistant to write unit test assertions before generating production implementation code.

**Actions:**
* Prompt the AI assistant to generate JUnit5/MockK unit tests based on functional specs first.
* Execute `./gradlew test` to confirm test failure for expected reasons (Red phase).
* Prompt the AI assistant to write the minimal production code necessary to pass the test suite (Green phase).

**Evidence:**
Test file commit timestamp precedes or matches production feature implementation.

```kotlin
// Example: Prompting AI for explicit coroutine flow test assertion
@Test
fun `observeUserEmitsCachedUserThenSyncsFromRemote`() = runTest {
    // 1. Arrange fake network response & local DAO cache
    val cachedUser = UserEntity(id = "1", name = "Cached")
    val remoteUser = UserDto(id = "1", name = "Remote")
    coEvery { userDao.getUser("1") } returns flowOf(cachedUser)
    coEvery { apiService.fetchUser("1") } returns remoteUser

    // 2. Act: Collect via Turbine
    repository.observeUser("1").test {
        assertEquals("Cached", awaitItem().name)
        cancelAndIgnoreRemainingEvents()
    }
}
```

---

### 03 Incremental Commit Checkpoints

**Intent:** Contain AI regression radius by committing small, verified changes frequently.

**Actions:**
* Generate code for one single layer at a time (Domain -> Data -> UI).
* Run `./gradlew check` after each AI snippet acceptance.
* Create atomic git commits for each verified layer before moving to the next.

**Evidence:**
Git log shows granular commits (e.g., `feat(domain): add calculate total usecase`, `test(domain): add coverage for discount calculation`).

---

### 04 Hallucination Detection & Code Verification

**Intent:** Audit AI suggestions for deprecated APIs, security vulnerabilities, or performance antipatterns.

**Actions:**
* Check for obsolete Android APIs (e.g., `LiveData`, `AsyncTask`, `findViewById`, `GlobalScope`).
* Inspect generated Compose functions for missing stability annotations or inline state mutations.
* Run compiler and lint checks to catch invalid imports or missing parameters immediately.

**Evidence:**
Zero deprecated methods or invalid framework imports exist in accepted code diffs.

---

## Anti-Rationalization Gate

### Excuse
"The AI generated 200 lines of code and it compiles without errors, so it must be fine."

### Rebuttal
Compilation proves syntax correctness, not domain validity, coroutine thread safety, or edge-case handling. Compiling code can still leak memory, swallow exceptions, or introduce security vulnerabilities. Review every generated line.

---

### Excuse
"I don't need to write tests because the AI said it verified the implementation."

### Rebuttal
LLMs generate probabilistic text responses; they do not run JVM execution engines or Android Studio profilers. Automated tests in your local build pipeline are the only valid verification evidence.

---

## Red Flags

* Accepting multi-file AI code suggestions without reviewing diffs line-by-line.
* Generated code importing deprecated libraries (`android.support.*`, `LiveData`, `java.util.Date`).
* AI introducing unrequested third-party dependencies into `build.gradle.kts`.
* Blindly accepting AI suggestions that fix compiler errors by adding `@Suppress` annotations or casting types unsafely (`as Any`).

---

## Verification

1. **Diff Audit Pass:** Conduct line-by-line code review of all AI-generated additions.
2. **Automated Test Pass:** `./gradlew testDebugUnitTest` completes with 100% success rate.
3. **Android Lint Validation:** `./gradlew lintDebug` flags zero new warnings or security issues.

---

## Exit Criteria

* [ ] Task was decomposed into small, isolated prompts.
* [ ] Unit tests were written and verified before feature completion.
* [ ] No deprecated or insecure Android APIs accepted.
* [ ] Diff inspected line-by-line for hidden side-effects.
* [ ] Granular git commits saved at each verified step.
