---
title: "Feature Flag Rollouts"
description: "Decouple code deployment from feature release using dynamic remote flags, kill switches, and progressive target cohort rollouts."
category: "Release"
phase: "Ship"
command: "/ship"
trigger: "Use when decoupling deployment from release through dynamic remote flags, kill switches, and progressive rollout gates."
tags:
  - feature-flags
  - remote-config
  - rollout
  - decoupling
order: 20
related:
  - play-store-staged-rollouts
  - ci-cd-github-actions
  - clean-architecture-mvvm
---

# Feature Flag Rollouts

## The Situation

Tying feature launches directly to app binary updates forces engineering teams to wait for Play Store app review cycles, leaves no emergency mechanism to disable buggy features in real time, and makes A/B testing impossible. If a new feature introduced in a binary release causes server overload, the only remediation is releasing a emergency hotfix build, which takes hours to reach users.

**Feature Flags (Remote Config)** decouple deployment from release. Code for new features is shipped safely behind dynamic flags disabled by default. Product and engineering teams can activate features for specific user cohorts (e.g. 5% internal beta -> 25% region -> 100% global) or instantly flip an emergency kill-switch without publishing a new app build.

---

## Workflow

### 01 Feature Flag Provider Abstraction

**Intent:** Isolate Remote Config providers (Firebase Remote Config, LaunchDarkly, Unleash) behind a domain interface.

**Actions:**
* Define a `FeatureFlagProvider` interface inside the Domain layer.
* Expose feature flags as boolean or typed value providers (`isNewCheckoutEnabled(): Boolean`).
* Provide default fallback values in local code to handle offline or network delay scenarios.

**Evidence:**
Injecting `FeatureFlagProvider` into UseCases allows toggling feature logic dynamically in unit tests.

```kotlin
// Example: Domain Feature Flag Provider & Usage
interface FeatureFlagProvider {
    fun isRedesignedFeedEnabled(): Boolean
    fun observeRedesignedFeedEnabled(): Flow<Boolean>
}

class GetFeedUseCase @Inject constructor(
    private val legacyRepository: LegacyFeedRepository,
    private val newRepository: NewFeedRepository,
    private val flagProvider: FeatureFlagProvider
) {
    suspend operator fun invoke(): Result<List<FeedItem>> {
        return if (flagProvider.isRedesignedFeedEnabled()) {
            newRepository.getFeed()
        } else {
            legacyRepository.getFeed()
        }
    }
}
```

---

### 02 Dynamic Flag Evaluation & Offline Caching

**Intent:** Evaluate feature flags synchronously at runtime without blocking UI rendering on startup.

**Actions:**
* Fetch remote flag configurations asynchronously in the background on app launch.
* Cache flag values locally in `SharedPreferences` or `DataStore` to serve immediate offline decisions.
* Apply updated flag values on next app launch to prevent mid-session UI layout shifts.

**Evidence:**
Launching the app in airplane mode uses cached feature flag state without UI flicker or delay.

---

### 03 Technical Debt Teardown & Flag Retirement

**Intent:** Prevent feature flag proliferation from turning into permanent codebase clutter.

**Actions:**
* Set a strict expiration deadline (e.g. 30 days post 100% rollout) for every feature flag.
* Once a feature reaches 100% rollout stability, schedule a cleanup task to delete the flag condition, purge legacy code paths, and remove the remote flag key.

**Evidence:**
Git commit log shows flag cleanup deleting legacy feature branch code and simplifying repository use cases.

---

## Anti-Rationalization Gate

### Excuse
"We don't need a feature flag because this feature is small and won't break."

### Rebuttal
Small features frequently interact unpredictably with backend services under heavy concurrency. Wrapping new feature code in a flag gives you an instant kill-switch if unexpected production failures occur.

---

### Excuse
"Leaving old feature flags in the codebase forever doesn't hurt anything."

### Rebuttal
Stale feature flags accumulate over time, creating dead code branches, confusing developers, increasing test matrix permutations exponentially, and leading to hard-to-debug flag interaction bugs. Retire flags promptly post-launch.

---

## Red Flags

* Accessing third-party Remote Config SDK instances directly inside ViewModels or UI composables.
* Feature flags causing mid-session UI state changes that flip screen layouts while the user is actively filling out forms.
* Accumulating dozens of dead, 100%-rolled-out feature flags in the codebase without cleanup.
* Lack of default fallback flag values when network remote config fetch fails.

---

## Verification

1. **Flag Toggle Verification:** Test app with feature flag toggled ON and OFF via debug drawer or mock provider.
2. **Kill-Switch Test:** Disable flag remotely in backend and verify app seamlessly reverts to legacy fallback path on next launch.

---

## Exit Criteria

* [ ] `FeatureFlagProvider` interface abstracts remote SDK implementation.
* [ ] Fallback default values specified for all flags.
* [ ] Feature flag decisions cached locally for offline startup.
* [ ] Flag cleanup policy and expiration dates documented.
* [ ] Unit tests verify both ON and OFF execution branches.
