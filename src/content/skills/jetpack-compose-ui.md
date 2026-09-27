---
title: "Jetpack Compose UI Engineering"
description: "Build predictable, accessible and performant Compose interfaces using disciplined state hoisting, recomposition boundaries, and semantic accessibility."
category: "UI"
phase: "Build"
command: "/build"
trigger: "Use when building or modifying a non-trivial Compose screen, component, navigation flow, or reusable UI design system element."
tags:
  - compose
  - ui
  - state
  - accessibility
order: 1
related:
  - reactive-state-hoisting
  - ui-testing-compose-rule
  - accessibility-wcag-android
---

# Jetpack Compose UI Engineering

## The Situation

Jetpack Compose radically simplifies UI development on Android by replacing imperative View hierarchy mutations with declarative state driven rendering. However, because Compose functions execute frequently during recomposition, naive UI code frequently introduces subtle bugs: unnecessary recomposition loops, lost state during configuration changes, business logic leakages into composable callbacks, broken TalkBack accessibility trees, and janky scrolling performance.

Senior Android engineers treat Composables strictly as pure projection functions of immutable UI state. UI components should never own repository connections, perform direct I/O, or hold state that survives across screen lifecycles without explicit ViewModel hoisting. Failure to enforce composition boundaries leads to brittle screens that fail during orientation changes, skip recomposition unexpectedly due to unstable parameters, or stall the main thread during render passes.

---

## Workflow

### 01 State Hoisting & Unidirectional Data Flow

**Intent:** Guarantee single source of truth and render predictability by separating event handling from state representation.

**Actions:**
* Hoist all mutable state to the highest common ancestor composable or directly into a Hilt-injected `ViewModel`.
* Pass immutable `State<T>` or plain data classes down into child composables; expose lambda callbacks `(Event) -> Unit` upwards.
* Ensure UI state objects use immutable collections (`PersistentList` from kotlinx.collections.immutable or `@Immutable` annotated wrappers) to enable Compose compiler smart recomposition skipping.

**Evidence:**
Composable function parameters consist exclusively of value objects, immutable UI states, and event callbacks. No `ViewModel` instances are passed beyond top-level screen containers.

```kotlin
// Example: Pure stateless child composable with hoisted callbacks
@Composable
fun TransactionRow(
    item: TransactionItemState,
    onItemClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = { onItemClick(item.id) },
        modifier = modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(16.dp)) {
            Text(text = item.title, style = MaterialTheme.typography.bodyLarge)
            Spacer(modifier = Modifier.weight(1f))
            Text(text = item.formattedAmount, style = MaterialTheme.typography.labelMedium)
        }
    }
}
```

---

### 02 Stability & Recomposition Boundary Optimization

**Intent:** Prevent unnecessary layout redraws and frame drops during user scrolling or state animations.

**Actions:**
* Annotate custom model classes containing external dependencies with `@Stable` or `@Immutable`.
* Wrap unstable third-party types (e.g., standard `List<T>`) using immutable wrapper types or `remember { derivedStateOf { ... } }` for fine-grained calculation updates.
* Use `Layout Inspector` and Compose Compiler metrics (`-Pplugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=...`) to verify composables are marked `skippable` and `restartable`.

**Evidence:**
Compiler metrics report shows 100% of row and list item composables marked as `skippable`.

---

### 03 Semantics & Accessibility Enclosures

**Intent:** Provide first-class TalkBack screen-reader support, minimum 48dp touch targets, and semantic focus ordering.

**Actions:**
* Merge semantic nodes for compound components using `Modifier.semantics(mergeDescendants = true)`.
* Provide explicit `contentDescription` for decorative vs functional images (set `null` for purely aesthetic icons).
* Enforce minimum touch target dimensions using `Modifier.defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)`.

**Evidence:**
Accessibility Scanner inspects zero touch target violations and TalkBack correctly reads unified row descriptions in a single focus pass.

---

### 04 Layout & Side-Effect Safety

**Intent:** Prevent main-thread blockage and illegal side-effects during composition passes.

**Actions:**
* Enclose any side-effecting operation inside `LaunchedEffect`, `DisposableEffect`, or `SideEffect`.
* Never trigger navigation, network fetches, or database writes directly inside the body of a `@Composable` function.
* Use `rememberUpdatedState` when capturing callbacks inside long-lived side effects.

**Evidence:**
Zero side-effect calls exist outside dedicated effect handlers in the code review diff.

---

## Anti-Rationalization Gate

### Excuse
"I'll pass the `ViewModel` directly into the item list row to save boilerplate code."

### Rebuttal
Passing ViewModels into child composables tightly couples reusable UI components to specific business scopes, completely breaks Compose UI preview generation, and makes unit/UI testing impossible without heavy mocking infrastructure. Keep child components purely functional.

---

### Excuse
"The app renders fast enough on my test device, so I don't need Compose compiler metrics."

### Rebuttal
Development devices are typically flagship phones with high single-thread performance. Unstable parameter recompositions silently degrade battery life and cause micro-stuttering on low-tier budget devices in production. Run compiler metrics before merging.

---

### Excuse
"I'll add accessibility semantics once the visual design is finalized."

### Rebuttal
Adding semantics post-hoc leads to hacked node merging and broken focus order. Semantics are part of the UI component contract, not an optional visual Polish step.

---

## Red Flags

* Business state or repository calls located directly inside UI event callbacks (`onClick = { repository.sync() }`).
* `List<T>` types passed to composables without compiler stability optimization or immutable wrapper annotations.
* Recomposition loops caused by mutating `remember { mutableStateOf(...) }` inside the raw composable body.
* Custom clickable components smaller than 48dp x 48dp without minimum target padding.
* Composables using `Thread.sleep()` or blocking I/O calls inside composition or layout passes.

---

## Verification

Claim completion only when the following automated and visual evidence is produced:

1. **Compose Compiler Reports:** Run `./gradlew assembleRelease -Pplugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=build/compose_metrics` and verify target composables are `skippable`.
2. **Layout Inspector Check:** Inspect composition counts while scrolling candidate screens to verify zero unexpected recomposition spikes.
3. **Accessibility Scanner Pass:** Zero high-severity accessibility issues flagged by Android Accessibility Scanner tool.
4. **Compose UI Test:** Automated screenshot or `ComposeTestRule` assertion verifying UI state rendering under Loading, Content, and Error conditions.

---

## Exit Criteria

* [ ] UI state is fully hoisted to ViewModel or parent container.
* [ ] No ViewModel reference exists in reusable child composables.
* [ ] All list models and data classes are stable/immutable.
* [ ] Touch targets meet WCAG 48dp x 48dp minimum.
* [ ] Accessibility semantics and content descriptions are fully configured.
* [ ] Layout Inspector confirms zero infinite recomposition loops.
* [ ] Compose UI tests verify state changes without flaky delays.
