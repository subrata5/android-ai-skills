---
title: "Modular Android Architecture"
description: "Decouple monolithic Android codebases into reusable feature, API, core data, and UI design system modules to accelerate build speeds and enforce boundaries."
category: "Architecture"
phase: "Architecture"
command: "/architect"
trigger: "Use when decoupling monolithic app modules into feature, API, core-data, and UI design system modules."
tags:
  - modularization
  - gradle
  - architecture
  - dependencies
order: 8
related:
  - dagger-hilt-dependency-injection
  - clean-architecture-mvvm
  - gradle-build-optimization
---

# Modular Android Architecture

## The Situation

As Android applications grow, monolithic `:app` modules become unmaintainable bottlenecks. Recompilation takes minutes for trivial changes, circular dependencies sneak into domain logic, multiple engineering teams touch the same files simultaneously, and feature isolation is lost.

A **modular architecture** divides the codebase into clear layer types: `:feature:*`, `:core:data`, `:core:domain`, `:core:ui`, and `:core:model`. By restricting dependency directions and leveraging Gradle's configuration cache and parallel execution, build times decrease dramatically and feature boundaries are enforced at compile time.

---

## Workflow

### 01 Module Classification & Dependency Direction

**Intent:** Establish strict, acyclic dependency rules between application modules.

**Actions:**
* Classify modules into distinct roles:
  - `:app` (Assembles final APK/AAB, includes all feature modules).
  - `:feature:<name>` (Encapsulates feature UI and ViewModel logic).
  - `:feature:<name>:api` (Exposes feature navigation routes & public contracts).
  - `:core:data` (Repositories, Room, Retrofit implementations).
  - `:core:model` (Pure domain models with zero dependencies).
  - `:core:ui` (Design system composables & themes).
* Enforce strict rule: **Feature modules must NEVER depend directly on other Feature modules**. Communicate via `:api` modules or central navigation.

**Evidence:**
Dependency graph check confirms zero circular module dependencies.

```kotlin
// Example: feature:checkout build.gradle.kts dependency declarations
dependencies {
    implementation(project(":core:model"))
    implementation(project(":core:ui"))
    implementation(project(":core:data"))
    implementation(project(":feature:catalog:api")) // Depend ONLY on public API contract
    
    // NO direct dependency on project(":feature:catalog")
}
```

---

### 02 Explicit Visibility Controls

**Intent:** Prevent internal feature implementation details from being imported by external modules.

**Actions:**
* Use Kotlin's `internal` visibility modifier for all feature-private classes, view models, and utility composables.
* Expose only public interfaces or navigation entries in the root module package.
* Enable Gradle `explicitApi()` in `:core:*` utility libraries if public library consumption is intended.

**Evidence:**
Attempting to import internal feature composables from another module results in a Kotlin compiler error.

---

### 03 Navigation & Feature Decoupling

**Intent:** Enable independent compilation of feature modules without hard compile-time references to destination screens.

**Actions:**
* Implement deep-link navigation routes or interface-based navigator contracts defined in `:core:navigation`.
* Inject feature navigators using Hilt DI or Jetpack Navigation Type-Safe routes.

**Evidence:**
Building `:feature:checkout` directly (`./gradlew :feature:checkout:assembleDebug`) succeeds without compiling `:feature:profile`.

---

## Anti-Rationalization Gate

### Excuse
"It's faster to put everything into `:app` for now and extract modules later."

### Rebuttal
Un-entangling a monolithic `:app` module post-hoc requires hundreds of hours of refactoring due to hidden cross-layer couplings. Define module boundaries before building features.

---

### Excuse
"Adding an `:api` module for every feature creates too many Gradle modules."

### Rebuttal
Gradle handles hundreds of lightweight modules effortlessly when build caching is configured. The small overhead of module declaration is dwarfed by the massive build speed gains and strict architecture isolation.

---

## Red Flags

* Feature A importing concrete implementation classes from Feature B (`implementation(project(":feature:b"))`).
* Circular module dependencies flagged by Gradle sync.
* `:core:model` depending on `:core:ui` or any Android SDK framework dependencies.
* Build times scaling linearly with codebase size due to single-module recompilation.

---

## Verification

1. **Gradle Dependency Tree Pass:** `./gradlew :app:dependencies` verifies clean acyclic dependency tree.
2. **Parallel Module Build Verification:** Run `./gradlew assembleDebug --dry-run` and inspect task graph parallelization.
3. **Module Isolation Test:** Build an isolated feature module (`./gradlew :feature:settings:compileDebugKotlin`) to prove independent compilation.

---

## Exit Criteria

* [ ] Codebase partitioned into core, feature, and model modules.
* [ ] Feature-to-feature direct dependencies eliminated.
* [ ] Feature implementation classes marked `internal`.
* [ ] Dependency graph is acyclic and verified in CI.
* [ ] Individual feature modules compile independently.
