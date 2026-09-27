---
title: "Reactive State Hoisting"
description: "Model immutable UI state hierarchies, unidirectional data flow (UDF), and side-effect events using Kotlin StateFlow and SharedFlow."
category: "State"
phase: "Architecture"
command: "/architect"
trigger: "Use when modeling immutable UI state wrappers, unidirectional data flow (UDF), and side-effect handling in ViewModels."
tags:
  - state-hoisting
  - udf
  - stateflow
  - compose
order: 16
related:
  - jetpack-compose-ui
  - coroutines-and-flow
  - clean-architecture-mvvm
---

# Reactive State Hoisting

## The Situation

Managing UI state across screen configuration changes, screen navigation, and background async updates is one of the most common sources of Android bugs. Disjointed state variables (`var isLoading`, `var userData`, `var errorMessage`) inside ViewModels inevitably drift out of sync, leading to impossible UI states (e.g. showing both a loading spinner and an error message simultaneously).

**Reactive State Hoisting** with Unidirectional Data Flow (UDF) solves state drift by representing screen UI as a single immutable state interface or data class emitted via `StateFlow<UiState>`. User interactions flow up as explicit Event actions (`UiEvent`), and the ViewModel processes events to emit updated UI State down to the view.

---

## Workflow

### 01 Single Sealed UI State Definition

**Intent:** Represent all mutually exclusive UI presentation states in a single type-safe sealed hierarchy.

**Actions:**
* Create a sealed interface or data class for screen state: `sealed interface UserProfileUiState { object Loading; data class Success(...); data class Error(...) }`.
* Represent transient side effects (e.g. Navigation, Toast notifications) separately using `Channel<UiEffect>` or single-shot event patterns.
* Avoid exposing multiple independent mutable primitives from the ViewModel.

**Evidence:**
Composable UI screen consumes a single `val uiState by viewModel.uiState.collectAsStateWithLifecycle()` stream.

```kotlin
// Example: Sealed UI state & user action events
sealed interface FeedUiState {
    object Loading : FeedUiState
    data class Success(val items: PersistentList<FeedItem>) : FeedUiState
    data class Error(val message: String) : FeedUiState
}

sealed interface FeedUiEvent {
    data class Refresh(val force: Boolean) : FeedUiEvent
    data class LikeItem(val itemId: String) : FeedUiEvent
}
```

---

### 02 Unidirectional Data Flow (UDF) Loop

**Intent:** Enforce single direction event flow (UI -> ViewModel -> UI State).

**Actions:**
* ViewModel exposes a single entry-point function `onEvent(event: FeedUiEvent)`.
* Event processing triggers state transitions via `.update { currentState -> ... }` on private `MutableStateFlow`.
* UI components dispatch events in response to user actions without mutating local variables directly.

**Evidence:**
Every user action maps cleanly to an explicit event handled by a `when(event)` expression in the ViewModel.

---

### 03 State Preservation Across Configuration Changes

**Intent:** Preserve state seamlessly through screen orientation changes and process death using `SavedStateHandle`.

**Actions:**
* Use `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), initialValue)` to create cached `StateFlow` from domain flows.
* Store navigation IDs or search query strings in `SavedStateHandle` to survive system process kill.

**Evidence:**
Rotating the device during screen loading retains the active search query and stream without re-fetching network data.

---

## Anti-Rationalization Gate

### Excuse
"I'll use multiple separate `MutableStateFlow` variables for loading, error, and data to keep things simple."

### Rebuttal
Multiple independent state variables will eventually desynchronize. A single sealed UI state guarantees at compile time that your screen can only ever be in one valid UI state at a time.

---

### Excuse
"I'll emit navigation events directly inside the UI State data class."

### Rebuttal
Embedding one-time side-effects (like navigation or snackbars) inside persistent UI State causes duplicate triggers when the view recomposes or re-subscribes. Handle side-effects via dedicated `Channel` or `SharedFlow` primitives.

---

## Red Flags

* ViewModel exposing multiple public `MutableStateFlow` primitives.
* UI components mutating ViewModel properties directly (`viewModel.searchQuery = "new"`).
* One-time side effects stored in persistent `StateFlow` causing repeated Toast displays on screen rotation.
* Using raw `SharedFlow` for UI state without replay buffer, leading to missed initial state updates.

---

## Verification

1. **State Transition Test:** Write ViewModel unit tests asserting exact sequence of state emissions: `Loading -> Success`.
2. **Process Death Test:** Simulate process death via Android Studio "Kill Process" and verify state restoration via `SavedStateHandle`.

---

## Exit Criteria

* [ ] Screen UI state represented as a single sealed hierarchy.
* [ ] ViewModel exposes read-only `StateFlow<UiState>`.
* [ ] User actions dispatched as immutable `UiEvent` objects.
* [ ] One-time events handled via `Channel` / `UiEffect`.
* [ ] Unit tests verify state emission sequence.
