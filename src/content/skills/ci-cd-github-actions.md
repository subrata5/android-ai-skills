---
title: "CI/CD with GitHub Actions"
description: "Automate build verification, static analysis enforcement, unit test execution, and signed Android App Bundle (AAB) deployment."
category: "CI/CD"
phase: "Ship"
command: "/ship"
trigger: "Use when configuring automated build pipelines, static analysis enforcement, unit test execution, and APK/AAB signing."
tags:
  - ci-cd
  - github-actions
  - automation
  - build
order: 12
related:
  - play-store-staged-rollouts
  - gradle-build-optimization
  - feature-flag-rollouts
---

# CI/CD with GitHub Actions

## The Situation

Manual release builds compiled on individual developer laptops introduce dangerous variables: uncommitted local code changes, inconsistent JDK/Gradle versions, unverified unit test failures, missing keystore secrets, and manual uploading mistakes.

A modern Android **CI/CD pipeline** enforces strict quality gates on every Pull Request (PR) and automates production releases. Using GitHub Actions with cached Gradle dependencies, automated static analysis (Detekt, Android Lint), JVM unit testing, keystore signing from GitHub Secrets, and Play Store publishing integrations guarantees that main branch code is always deployable.

---

## Workflow

### 01 Pull Request Verification Pipeline (`ci.yml`)

**Intent:** Block broken, unformatted, or failing code from being merged into main branches.

**Actions:**
* Trigger pipeline on `pull_request` events targeting `main` or `develop`.
* Setup Java 17/21 SDK using `actions/setup-java@v4` with `gradle` caching enabled.
* Execute static checks, code formatting, and unit tests: `./gradlew lintDebug detekt testDebugUnitTest`.

**Evidence:**
GitHub PR status checks require all green checks before the "Merge" button is enabled.

```yaml
# Example: GitHub Actions CI workflow snippet
name: Android CI Quality Gate

on:
  pull_request:
    branches: [ main ]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Run Static Analysis & Tests
        run: ./gradlew lintDebug detekt testDebugUnitTest --no-daemon
```

---

## 02 Release Build & Keystore Signing (`deploy.yml`)

**Intent:** Generate production-ready, signed Android App Bundles (AAB) securely in CI.

**Actions:**
* Decode release keystore base64 string stored in GitHub Secrets.
* Pass keystore passwords and alias via environment variables into `build.gradle.kts` signingConfigs.
* Run `./gradlew bundleRelease` to generate release `.aab` file.
* Upload artifact to GitHub Release assets or Google Play Developer API.

**Evidence:**
CI workflow produces a cryptographically signed `app-release.aab` artifact verified by `apksigner`.

---

### 03 Gradle Dependency Caching Optimization

**Intent:** Reduce CI build duration from 15+ minutes down to 3 minutes.

**Actions:**
* Enable Gradle Build Cache and Configuration Cache in `gradle.properties`.
* Use `gradle/actions/setup-gradle@v3` for optimized dependency caching across workflow runs.

**Evidence:**
Build execution log shows `Reusing configuration cache` and high cache hit rates.

---

## Anti-Rationalization Gate

### Excuse
"We can skip CI unit testing for emergency hotfix PRs to speed up deployment."

### Rebuttal
Bypassing CI checks during emergency hotfixes is when fatal production regressions are most likely to slip through. Fast CI execution (under 5 minutes) ensures quality gates never slow down urgent releases.

---

### Excuse
"Storing the release keystore file directly inside the Git repository is safe if it's a private repo."

### Rebuttal
Private repositories get cloned to developer laptops and external workstations. Storing keystores in Git history compromises app signature security permanently. Use encrypted secrets managers or base64 environment variables in CI.

---

## Red Flags

* Developers building release AAB files manually on local workstations for production deployment.
* Keystore password or alias committed in plain text in `build.gradle.kts`.
* CI workflow failing to cache Gradle wrapper dependencies, downloading 500MB+ on every run.
* Pull requests allowed to merge with red or failing status checks.

---

## Verification

1. **PR Gate Trigger:** Open draft PR and verify CI workflow triggers automatically and reports status.
2. **Signed AAB Verification:** Download CI-generated release AAB and verify signature with `apksigner verify --verbose app-release.aab`.

---

## Exit Criteria

* [ ] Automated CI workflow active for all pull requests.
* [ ] Lint, Detekt, and unit tests mandatory for merge.
* [ ] Release signing keystore secured in GitHub Secrets.
* [ ] Gradle build cache configured for fast execution.
* [ ] Automated deployment configured for main branch releases.
