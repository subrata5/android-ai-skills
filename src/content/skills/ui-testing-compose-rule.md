---
title: "Compose UI Testing"
description: "Build deterministic, non-flaky Compose UI tests using ComposeTestRule, semantics matchers, unconfined dispatchers, and state assertion trees."
category: "Testing"
phase: "Test"
command: "/test"
trigger: "Use when writing deterministic Compose UI tests using ComposeTestRule, semantics matchers, and unconfined dispatchers."
tags:
  - compose-testing
  - espresso
  - semantics
  - ui-test
order: 10
related:
  - jetpack-compose-ui
  - test-driven-development-junit
  - accessibility-wcag-android
---

# Compose UI Testing

## The Situation

UI testing on Android historically suffered from extreme flakiness: arbitrary `Thread.sleep()` delays to wait for view animations, fragile view ID matchers breaking after layout updates, and slow emulator setup.

Jetpack Compose replaces view tree inspection with **Semantics Tree testing**. Using `createComposeRule()` or `createAndroidComposeRule<MainActivity>()`, UI tests synchronization is built directly into the Compose layout framework. Tests automatically wait for layout passes, recomposition, and animations to settle before evaluating semantic node matchers (`hasText`, `hasContentDescription`, `hasClickAction`).

---

## Workflow

### 01 ComposeTestRule Environment Setup

**Intent:** Provide isolated UI rendering context for stateless composables or full screen layouts.

**Actions:**
* Use `createComposeRule()` for isolated component testing (does not launch full Activity).
* Use `createAndroidComposeRule<ComponentActivity>()` when testing screens requiring Hilt dependency injection.
* Pass explicit preview state data to `composeTestRule.setContent { MyComposableScreen(uiState) }`.

**Evidence:**
Test renders composable tree directly in test harness without invoking real network APIs.

```kotlin
// Example: Isolated Compose UI Test verifying button click state
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun loginButton_whenFormValid_triggersCallback() {
    var clicked = false
    composeTestRule.setContent {
        LoginForm(
            uiState = LoginFormState(isSubmitEnabled = true),
            onSubmit = { clicked = true }
        )
    }

    // Match node by semantics text and perform click action
    composeTestRule.onNodeWithText("Submit").performClick()

    assertTrue(clicked)
}
```

---

### 02 Semantics Matching & Node Actions

**Intent:** Match UI elements based on accessible semantics attributes rather than volatile pixel positions.

**Actions:**
* Target nodes using `onNodeWithText()`, `onNodeWithContentDescription()`, or custom `hasTestTag()`.
* Combine semantics conditions using `hasText("Login") and hasClickAction()`.
* Perform user interactions: `.performClick()`, `.performTextInput("user@test.com")`, `.performScrollTo()`.

**Evidence:**
UI test suite runs deterministically across different screen resolutions and dark/light system themes.

---

### 03 Synchronization & Idling Resource Avoidance

**Intent:** Eliminate flaky timing assertions by leveraging Compose internal clock synchronization.

**Actions:**
* Avoid manual sleeps or `SystemClock.sleep()` in test methods.
* Use `composeTestRule.waitUntil(timeoutMillis = 5000) { ... }` when testing asynchronous coroutine state transitions.
* Advance Compose virtual animations explicitly using `mainClock.advanceTimeBy(millis)`.

**Evidence:**
UI test suite completes 50 test passes in CI without a single timing timeout failure.

---

## Anti-Rationalization Gate

### Excuse
"I'll add `Thread.sleep(3000)` because the network request takes a few seconds in UI tests."

### Rebuttal
Adding sleep delays makes UI test suites excruciatingly slow and highly prone to flakiness when running on resource-constrained CI server VMs. Use test double repositories or `waitUntil` assertions.

---

### Excuse
"Setting test tags (`Modifier.testTag("submit_btn")`) everywhere is fine."

### Rebuttal
Overusing `testTag` clutter production code with testing artifacts. Prefer matching nodes via user-visible text or accessibility `contentDescription` first; use `testTag` only for dynamic or purely aesthetic elements lacking text.

---

## Red Flags

* UI tests depending on `Thread.sleep()` or hardcoded delays.
* Tests failing intermittently depending on emulator CPU load.
* Composables lacking accessibility labels requiring `testTag` workarounds for basic button matching.
* Flaky tests ignored by marking them `@Disabled` or `@Ignore` instead of fixing underlying state sync.

---

## Verification

1. **Flakiness Stress Test:** Run `./gradlew connectedCheck --repeat 10` ensuring 100% pass rate without single failure.
2. **Semantics Node Verification:** Use `composeTestRule.onRoot().printToLog("TAG")` to inspect semantics tree hierarchy during debugging.

---

## Exit Criteria

* [ ] `ComposeTestRule` used for isolated UI component tests.
* [ ] Nodes matched via semantics text or content description.
* [ ] Zero `Thread.sleep()` statements present in test code.
* [ ] Asynchronous UI state changes synchronized via `waitUntil`.
* [ ] 10 consecutive test suite runs execute with 0 failures.
