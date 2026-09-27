---
title: "Gradle Build Optimization"
description: "Profile slow Gradle builds, configure build caching, enable configuration cache, and optimize Kotlin DSL scripts."
category: "Build"
phase: "Review"
command: "/review"
trigger: "Use when analyzing slow build times, configuring build cache, enabling configuration cache, and profiling dependency graphs."
tags:
  - gradle
  - build-performance
  - build-cache
  - kotlin-dsl
order: 18
related:
  - modular-android-architecture
  - ci-cd-github-actions
  - memory-leak-profiling
---

# Gradle Build Optimization

## The Situation

Slow build times decimate engineering velocity. Waiting 5 to 10 minutes for an incremental build after modifying a single line of code disrupts developer focus, stalls CI/CD pipelines, and severely reduces productivity.

Optimizing **Gradle Build Performance** requires configuring Gradle's advanced build execution features: local & remote build caching, parallel task execution, configuration cache, KSP (Kotlin Symbol Processing) over legacy kapt, and dependency graph optimization. A well-tuned Gradle setup drops incremental build times to under 5 seconds.

---

## Workflow

### 01 Gradle Build Properties Optimization (`gradle.properties`)

**Intent:** Enable parallel execution, build caching, and configuration caching across all developer machines and CI.

**Actions:**
* Add performance flags to root `gradle.properties`:
  - `org.gradle.caching=true` (Reuses outputs from previous builds).
  - `org.gradle.parallel=true` (Compiles independent modules concurrently).
  - `org.gradle.configuration-cache=true` (Caches task graph configuration).
  - `org.gradle.jvmargs=-Xmx4g -XX:+UseParallelGC` (Allocates sufficient heap for Gradle daemon).
* Replace legacy `kapt` annotation processors with KSP (`com.google.devtools.ksp`).

**Evidence:**
Build execution log outputs `Configuration cache entry reused` on incremental runs.

```properties
# Optimized gradle.properties configuration
org.gradle.jvmargs=-Xmx4608m -XX:+UseParallelGC -Dfile.encoding=UTF-8
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.configuration-cache=true
kotlin.incremental=true
android.useAndroidX=true
```

---

## 02 Gradle Build Scan Profiling (`--scan`)

**Intent:** Identify bottleneck tasks, slow annotation processors, and cache miss root causes.

**Actions:**
* Run `./gradlew assembleDebug --scan` to generate a Gradle Build Scan report.
* Inspect the **Timeline** tab to identify tasks taking longer than 10 seconds.
* Check the **Performance / Build Cache** tab to fix non-cacheable custom tasks.

**Evidence:**
Build Scan URL reveals task breakdown and identifies bottleneck dependencies.

---

### 03 Dependency Resolution & Version Catalogs

**Intent:** Centralize library versions and eliminate redundant dependency resolution passes.

**Actions:**
* Use Gradle Version Catalogs (`gradle/libs.versions.toml`) for type-safe, centralized dependency management.
* Avoid dynamic dependency versions (e.g. `implementation("com.example:lib:1.0.+")`) which force Gradle to poll remote repositories on every build.

**Evidence:**
`libs.versions.toml` centralizes all version definitions with 0 dynamic wildcard version strings.

---

## Anti-Rationalization Gate

### Excuse
"Configuration cache is too hard to enable because some plugins throw errors."

### Rebuttal
Disabling configuration cache leaves 30% to 50% of potential build speed gains on the table. Upgrade outdated Gradle plugins and fix custom task inputs to support configuration cache.

---

### Excuse
"I don't need to migrate from `kapt` to `KSP` because `kapt` works fine."

### Rebuttal
`kapt` generates stub Java files for Kotlin code, adding massive overhead to every build pass. `KSP` analyzes Kotlin AST directly, running up to 2x faster than `kapt` for Room, Hilt, and Moshi annotation processing.

---

## Red Flags

* `gradle.properties` missing `org.gradle.caching=true` or `org.gradle.parallel=true`.
* Using legacy `kapt` for Room or Dagger annotation processing instead of `KSP`.
* Dynamic dependency versions (`+` wildcards) used in dependencies block.
* Custom Gradle tasks written without `@Input` and `@Output` annotations, breaking build cache reuse.

---

## Verification

1. **Incremental Build Benchmark:** Measure incremental build time after editing a composable method (`./gradlew assembleDebug` should complete in < 5s).
2. **Configuration Cache Validation:** Run `./gradlew assembleDebug --configuration-cache` twice and verify second run reuses configuration.

---

## Exit Criteria

* [ ] `gradle.properties` configured with build cache & parallel flags.
* [ ] Configuration cache enabled and passing without errors.
* [ ] KSP used in place of kapt for annotation processing.
* [ ] Dependencies managed via Version Catalog (`libs.versions.toml`).
* [ ] Incremental build time verified under 5 seconds.
