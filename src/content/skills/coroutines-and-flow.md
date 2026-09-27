---
title: "Coroutines and Flow"
description: "Master structured concurrency, reactive data streams, thread dispatchers, and exception handling in production Kotlin applications."
category: "Async"
phase: "Build"
command: "/build"
trigger: "Use when managing asynchronous operations, concurrent jobs, background dispatching, and reactive data streams."
tags:
  - coroutines
  - flow
  - kotlin
  - async
order: 3
related:
  - room-database-offline-first
  - network-caching-retrofit
  - background-workmanager
---

# Coroutines and Flow

## The Situation

Kotlin Coroutines and Flows provide powerful asynchronous primitives for Android. However, improper usage easily introduces severe defects: unhandled exception crashes, coroutine job leaks, main-thread blocking during heavy parsing, race conditions in shared mutable state, and continuous background data collection when screens are stopped.

Senior Android engineers strictly enforce **structured concurrency**. Every coroutine must be bound to a well-defined lifecycle scope (`viewModelScope`, `lifecycleScope`), heavy calculations must explicitly switch to `Dispatchers.Default` or `Dispatchers.IO`, and reactive flows collected in UI components must use `repeatOnLifecycle` or `collectAsStateWithLifecycle` to avoid wasting resources when the app is in the background.

---

## Workflow

### 01 Injecting Coroutine Dispatchers

**Intent:** Avoid hardcoded dispatchers (`Dispatchers.IO`) to enable deterministic unit testing with `StandardTestDispatcher` / `UnconfinedTestDispatcher`.

**Actions:**
* Define a `CoroutineDispatchers` wrapper class or Hilt qualifiers (`@IoDispatcher`, `@DefaultDispatcher`, `@MainDispatcher`).
* Pass dispatcher dependencies via constructor injection into Repositories, UseCases, and ViewModels.
* Use `withContext(dispatchers.io)` when executing disk or network I/O.

**Evidence:**
Zero occurrences of raw `Dispatchers.IO` or `Dispatchers.Default` exist inside business logic classes.

```kotlin
// Example: Injected dispatcher for background file processing
class ProcessLogFileUseCase @Inject constructor(
    private val fileReader: FileReader,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) {
    suspend operator fun invoke(filePath: String): List<String> = withContext(ioDispatcher) {
        fileReader.readLines(filePath).filter { it.contains("ERROR") }
    }
}
```

---

### 02 Lifecycle-Aware Flow Collection

**Intent:** Pause flow collection when the host Activity/Fragment/Composable moves into background stopped states.

**Actions:**
* In Jetpack Compose, collect flows using `collectAsStateWithLifecycle()` from `androidx.lifecycle.compose`.
* In Views/Fragments, wrap flow collection inside `viewLifecycleOwner.lifecycleScope.launch { viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) { ... } }`.
* Never use raw `lifecycleScope.launchWhenStarted` (deprecated due to buffer overflow risks).

**Evidence:**
Backgrounding the app immediately pauses database emissions and network polling logs.

---

### 03 Exception Handling & SupervisorJob

**Intent:** Prevent a single child failure from cancelling sibling coroutines in concurrent execution trees.

**Actions:**
* Use `supervisorScope { ... }` or `SupervisorJob()` when launching independent parallel tasks.
* Handle exceptions at the coroutine boundary using `CoroutineExceptionHandler` or try-catch blocks around suspend calls.
* Use Flow's `.catch { emit(UiState.Error(it)) }` operator to map upstream reactive stream failures cleanly.

**Evidence:**
Network timeout on one item in a `zip` or `combine` operation does not crash the entire parent ViewScope.

---

## Anti-Rationalization Gate

### Excuse
"I'll use `GlobalScope.launch` because this task needs to finish even if the user exits the screen."

### Rebuttal
`GlobalScope` breaks structured concurrency, bypasses lifecycle cancellation, and easily leaks memory. For tasks that must survive screen destruction, use `WorkManager` or application-scoped coroutine scopes controlled by Hilt.

---

### Excuse
"It's easier to use `Dispatchers.IO` directly in my repository method."

### Rebuttal
Hardcoding `Dispatchers.IO` prevents unit tests from replacing dispatchers with `TestDispatcher`. Tests will execute asynchronously across threads, leading to flaky assertions and non-deterministic test failures.

---

## Red Flags

* `GlobalScope.launch` or `CoroutineScope(Dispatchers.IO).launch` instantiated inside UI classes.
* Collecting Flows in View/Compose without using `repeatOnLifecycle` or `collectAsStateWithLifecycle`.
* Heavy JSON parsing, bitmap operations, or database transformations running on `Dispatchers.Main`.
* Ignoring coroutine cancellation exceptions by catching generic `Throwable` without re-throwing `CancellationException`.

---

## Verification

1. **Dispatcher Injection Audit:** Grep codebase for `Dispatchers.IO` usage to verify injection pattern.
2. **Coroutines Unit Test:** Test coroutine-based ViewModels using `runTest` and `Turbine` flow verification library.
3. **Background Suspension Verification:** Put app in background and verify using Android Studio Profiler that thread count drops and flow emissions pause.

---

## Exit Criteria

* [ ] Dispatchers are injected via constructor parameters or DI modules.
* [ ] No `GlobalScope` usage exists in codebase.
* [ ] Flow collection in UI uses `collectAsStateWithLifecycle()`.
* [ ] `CancellationException` is never swallowed in catch blocks.
* [ ] `Turbine` unit tests verify state emissions deterministically.
