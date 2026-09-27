---
title: "Background Work with WorkManager"
description: "Schedule deferrable, guaranteed background processing with system constraints, exponential backoff retries, and foreground worker execution."
category: "Background"
phase: "Build"
command: "/build"
trigger: "Use when scheduling deferrable, guaranteed background execution such as media uploads, telemetry sync, or periodic cleanup."
tags:
  - workmanager
  - background
  - sync
  - constraints
order: 15
related:
  - coroutines-and-flow
  - room-database-offline-first
  - network-caching-retrofit
---

# Background Work with WorkManager

## The Situation

Executing background tasks on Android has strict operating system restrictions. Starting background services directly when the app is minimized is blocked by Android OS power management features (Doze Mode, App Standby Buckets). Unconstrained background tasks drain user battery life and get silently killed by the OS.

**WorkManager** is Android's definitive solution for deferrable, guaranteed background work. By specifying hardware constraints (unmetered Wi-Fi, device charging, battery not low), WorkManager guarantees task execution even if the user exits the app or the device reboots, while respecting system battery efficiency policies.

---

## Workflow

### 01 Worker Implementation & Hilt Injection

**Intent:** Execute background tasks reliably with clean dependency injection.

**Actions:**
* Create a custom `CoroutineWorker(appContext, workerParams)` implementation.
* Use `@HiltWorker` and `@AssistedInject` to inject repositories and domain use cases into the worker constructor.
* Perform work inside `doWork()` suspend function, returning `Result.success()`, `Result.retry()`, or `Result.failure()`.

**Evidence:**
Worker compiles cleanly with Hilt assisted injection and executes domain tasks off the main thread.

```kotlin
// Example: Hilt-injected CoroutineWorker for media uploading
@HiltWorker
class UploadMediaWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val mediaRepository: MediaRepository
) : CoroutineWorker(context, params) {

    override suspend doWork(): Result {
        val mediaId = inputData.getString("KEY_MEDIA_ID") ?: return Result.failure()
        return try {
            mediaRepository.uploadMedia(mediaId)
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}
```

---

### 02 Constraints & WorkRequest Setup

**Intent:** Defer background execution until hardware requirements are satisfied.

**Actions:**
* Build a `Constraints` object specifying `NetworkType.UNMETERED`, `RequiresCharging(true)`, or `RequiresBatteryNotLow(true)`.
* Create `OneTimeWorkRequestBuilder` or `PeriodicWorkRequestBuilder` attaching constraints and input data.
* Enqueue request using `WorkManager.getInstance(context).enqueueUniqueWork()` to prevent duplicate job queues.

**Evidence:**
WorkManager defers job execution when device is disconnected from Wi-Fi and executes automatically when connected.

---

### 03 Exponential Backoff & Retry Handling

**Intent:** Handle network failures gracefully without overloading backend servers.

**Actions:**
* Configure backoff policy using `.setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)`.
* Check `runAttemptCount` inside `doWork()` to enforce max retry limits.

**Evidence:**
Failed network sync retries after 10s, 20s, 40s intervals as verified in logcat output.

---

## Anti-Rationalization Gate

### Excuse
"I'll use a standard `Thread` or `GlobalScope.launch` in my ViewModel for background file uploads."

### Rebuttal
In-process threads and coroutine scopes are destroyed when the user navigates away from the app or the OS reclaims memory. WorkManager is the only API that guarantees execution across process deaths and device reboots.

---

### Excuse
"Setting WorkManager constraints isn't necessary because network calls are fast."

### Rebuttal
Ignoring constraints causes background tasks to attempt network calls when offline, triggering immediate failure and battery drain. Specifying `NetworkType.CONNECTED` ensures tasks execute only when connectivity exists.

---

## Red Flags

* Launching long-running background uploads without WorkManager or Foreground Services.
* Creating duplicate WorkRequests using `enqueue()` instead of `enqueueUniqueWork()` with `ExistingWorkPolicy.KEEP` or `REPLACE`.
* Hardcoding context references inside static Worker singletons.
* PeriodicWorkRequest interval set less than the system minimum of 15 minutes.

---

## Verification

1. **WorkManager Test Harness:** Write test cases using `WorkManagerTestInitHelper` to verify constraint triggers and job completion.
2. **ADB Constraint Simulation:** Force WorkManager job execution via ADB command: `adb shell cmd jobscheduler run -f com.example.app <JOB_ID>`.

---

## Exit Criteria

* [ ] CoroutineWorker configured with Hilt assisted injection.
* [ ] Hardware constraints (Network, Battery) explicitly defined.
* [ ] Exponential backoff policy configured for retries.
* [ ] Jobs enqueued via unique work policies (`enqueueUniqueWork`).
* [ ] Automated Worker test suite passes in CI.
