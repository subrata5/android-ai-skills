---
title: "Memory Leak Profiling"
description: "Detect, trace, and resolve memory leaks, heap bloat, static context references, and unclosed reactive subscriptions."
category: "Performance"
phase: "Review"
command: "/review"
trigger: "Use when investigating memory growth, LeakCanary reports, static context references, or unclosed coroutine jobs."
tags:
  - memory
  - profiler
  - leakcanary
  - performance
order: 11
related:
  - coroutines-and-flow
  - jetpack-compose-ui
  - gradle-build-optimization
---

# Memory Leak Profiling

## The Situation

Memory leaks on Android cause progressive heap degradation, frequent Garbage Collection (GC) pauses, UI micro-stuttering, and eventual OutOfMemoryError (OOM) crashes. Common memory leak vectors include holding strong Activity Context references in singletons, retaining listeners in static fields, un-registering BroadcastReceivers, or launching un-cancelled coroutine jobs bound to long-lived scopes.

Senior Android engineers proactively monitor heap usage using LeakCanary during debug builds and Android Studio Memory Profiler during pre-release audits. Eliminating reference leaks guarantees stable memory consumption even during extended app usage sessions.

---

## Workflow

### 01 Automated Leak Detection with LeakCanary

**Intent:** Catch memory leaks automatically during manual QA and automated UI test execution.

**Actions:**
* Include LeakCanary in `build.gradle.kts` under `debugImplementation("com.squareup.leakcanary:leakcanary-android:2.14")`.
* Perform repetitive screen navigation flows (Open Screen -> Rotate Device 5x -> Back to Home).
* Inspect LeakCanary notifications and trace heap dump reference paths (Shortest Path to GC Root).

**Evidence:**
LeakCanary reports zero retained instances of Activity, Fragment, or View objects after screen back-stack popped.

```kotlin
// Example: Avoid leaking Activity Context in custom listeners
class LocationManagerHelper(context: Context) {
    // FIX: Store Application Context instead of Activity Context
    private val appContext = context.applicationContext
}
```

---

### 02 Android Studio Memory Profiler Heap Dump Analysis

**Intent:** Identify retained object allocations and memory growth patterns under heavy load.

**Actions:**
* Attach Android Studio Memory Profiler to target process.
* Capture a Heap Dump after invoking heavy features (e.g. image gallery or map view).
* Filter heap allocations by package name; inspect `Instance Count` and `Shallow vs Retained Size`.
* Look for leaked `Bitmap` objects, unclosed `Cursor` instances, or lingering `View` trees.

**Evidence:**
Heap size stabilizes to baseline levels following manual GC trigger after closing features.

---

### 03 Coroutine & Callback Lifetime Auditing

**Intent:** Prevent lingering background subscriptions from retaining destroyed UI hosts.

**Actions:**
* Ensure callback listeners (e.g., location updates, sensor listeners) are unregistered in `onStop()` / `onCleared()`.
* Replace `CoroutineScope(Dispatchers.Main)` singletons with `viewModelScope` or explicit Job cancellation in `onDestroy()`.
* Convert callback interfaces to cold Kotlin `callbackFlow` streams with `awaitClose { unregisterListener() }`.

**Evidence:**
Closing screen cancels active flow collection and unregisters underlying framework callbacks immediately.

---

## Anti-Rationalization Gate

### Excuse
"Android garbage collector will clean up leaked memory eventually when system memory gets low."

### Rebuttal
Garbage Collection cannot clean up objects that are still reachable from a GC Root (e.g., static fields, active background threads, application singletons). Leaked Activities remain permanently trapped in memory until process termination.

---

### Excuse
"It's only a small 2MB leak, so users won't notice."

### Rebuttal
A 2MB leak occurring every time a user opens a screen accumulates rapidly. Navigating back and forth 20 times consumes 40MB of retained heap, triggering intense GC thrashing and eventually crashing low-RAM devices.

---

## Red Flags

* Holding `Activity` or `View` references inside Singleton `@Singleton` objects.
* Passing Activity Context into background Thread, Handler, or Coroutine scopes that outlive Activity lifetime.
* Failing to provide `awaitClose { ... }` teardown in custom `callbackFlow` implementations.
* Retaining RxJava `Disposable` or EventBus registrations without clearing in `onCleared()`.

---

## Verification

1. **LeakCanary Pass:** Complete 20x screen rotation and back-navigation pass with zero LeakCanary alerts.
2. **Profiler Benchmark:** Record Memory Profiler session demonstrating flat memory footprint post-GC.

---

## Exit Criteria

* [ ] LeakCanary integrated in debug builds.
* [ ] Zero Activity/Fragment reference leaks detected.
* [ ] All callbacks converted to lifecycle-aware flows with teardown handlers.
* [ ] Static fields audited for context references.
* [ ] Pre-release memory profiling pass completed cleanly.
