---
title: "Play Store Staged Rollouts"
description: "Execute progressive production releases, monitor real-time Crashlytics telemetry, and manage emergency halt and rollback procedures."
category: "Release"
phase: "Ship"
command: "/ship"
trigger: "Use when executing phased production releases, monitoring Crashlytics crash rates, and managing emergency rollbacks."
tags:
  - play-store
  - staged-rollout
  - release
  - crashlytics
order: 13
related:
  - feature-flag-rollouts
  - ci-cd-github-actions
  - secure-shared-preferences
---

# Play Store Staged Rollouts

## The Situation

Releasing a new Android app version to 100% of production users simultaneously ("Big Bang Release") is an unnecessary, high-risk gamble. Even with extensive internal testing, real-world Android device diversity (thousands of OEM variants, custom Android skins, varying memory constraints) inevitably surfaces unforeseen crashes, ANRs, or backend database overload.

A **Staged Rollout** releases updates progressively (e.g. 1% -> 5% -> 20% -> 50% -> 100%) over several days. Combined with real-time Crashlytics telemetry monitoring, senior engineers catch critical regressions early, limit blast radius to a small fraction of users, and halt releases immediately if crash-free user thresholds drop below SLA targets.

---

## Workflow

### 01 Phased Rollout Schedule Definition

**Intent:** Contain crash blast radius by expanding user exposure incrementally over time.

**Actions:**
* Initiate Google Play Console production release with staged percentage set to **1%** or **5%**.
* Maintain stage percentage for at least 24 hours to observe telemetry across timezones.
* Increase rollout percentage progressively according to standard schedule:
  - Day 1: 5%
  - Day 2: 15%
  - Day 3: 50%
  - Day 4: 100%

**Evidence:**
Google Play Console dashboard displays active staged rollout status with clear percentage progression.

---

### 02 Real-Time Telemetry & SLA Quality Gates

**Intent:** Monitor stability metrics automatically during each rollout phase.

**Actions:**
* Monitor Firebase Crashlytics dashboard for:
  - **Crash-Free User Rate:** Must remain >= 99.9%.
  - **ANR Rate:** Must remain < 0.47% (Google Play Vital threshold).
  - **Top Issues List:** Zero new crash signatures introduced in the release version.
* Monitor Google Play Vitals dashboard for excessive wake locks, background battery drain, or slow render frames.

**Evidence:**
Crashlytics reports 99.95% crash-free users during the 20% rollout phase.

---

### 03 Rollout Halt & Hotfix Execution

**Intent:** Stop distribution immediately when stability metrics breach acceptable thresholds.

**Actions:**
* Click **Halt Rollout** in Google Play Console if crash-free rate drops below 99.5% or a severe data-loss bug is reported.
* Halting prevents new users from updating while leaving existing updated users on the build.
* Prepare emergency hotfix build with incremented `versionCode`, verify via CI, and launch a new staged rollout at 1%.

**Evidence:**
Play Console shows release status "Halted", preventing further user exposure while fix is deployed.

---

## Anti-Rationalization Gate

### Excuse
"We tested thoroughly on internal devices, so we can skip the staged rollout and release to 100% immediately."

### Rebuttal
Internal test devices account for less than 0.01% of real-world Android device hardware configurations. Custom OEM OS modifications (Samsung OneUI, Xiaomi MIUI, Oppo ColorOS) behave differently. Always stage releases.

---

### Excuse
"A 99.0% crash-free rate is good enough for a major feature release."

### Rebuttal
A 99.0% crash-free rate means 1 out of every 100 users experiences a crash session. For an app with 1,000,000 daily active users, that represents 10,000 frustrated users every single day. Maintain a 99.9% crash-free SLA.

---

## Red Flags

* Releasing directly to 100% of production users without staged rollout phase.
* Ignoring Crashlytics telemetry for the first 48 hours after launching an update.
* Increasing rollout percentage despite new top-tier crash signatures appearing in Crashlytics.
* Failing to update `versionCode` for hotfix releases.

---

## Verification

1. **Telemetry SLA Audit:** Verify Crashlytics report demonstrates >= 99.9% crash-free users on current release version.
2. **Play Vitals Check:** Confirm Play Vitals ANR and Crash rates are well below Android bad behavior thresholds.

---

## Exit Criteria

* [ ] Staged rollout initialized at <= 5% user exposure.
* [ ] Telemetry monitored continuously for 24+ hours at each stage.
* [ ] Crash-free user rate verified >= 99.9%.
* [ ] Play Vitals metrics within green health targets.
* [ ] Rollout expanded to 100% only after full telemetry validation.
