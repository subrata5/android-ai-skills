---
title: "Clean Architecture + MVVM"
description: "Establish strict layer separation between UI, Domain use cases, and Data repositories to create testable, resilient Android applications."
category: "Architecture"
phase: "Architecture"
command: "/architect"
trigger: "Use when establishing layer boundaries between UI, Domain use cases, and Data repositories in Android features."
tags:
  - clean-architecture
  - mvvm
  - domain
  - repository
order: 2
related:
  - dagger-hilt-dependency-injection
  - modular-android-architecture
  - reactive-state-hoisting
---

# Clean Architecture + MVVM

## The Situation

Without explicit architectural boundaries, Android applications rapidly collapse into "God ViewModels" and tightly coupled repository logic. UI components directly access database models, network entities leak into presentation logic, and business rules become scattered across activity callbacks, fragments, and composables.

Clean Architecture combined with Model-View-ViewModel (MVVM) protects business domain logic from framework volatility. By isolating the **Domain layer** (pure Kotlin use cases and entities) from the **Data layer** (Retrofit, Room, DataStore) and **UI layer** (Compose, ViewModels), the application gains deterministic unit testing capabilities, seamless data provider replacement, and clear engineering ownership boundaries.

---

## Workflow

### 01 Domain Layer Independence

**Intent:** Guarantee core business rules rely on zero Android framework dependencies (`android.*` imports).

**Actions:**
* Define pure Kotlin domain entities representing core business models.
* Create single-responsibility `UseCase` classes exposing an `operator fun invoke(...)` returning a `Result<T>` or `Flow<T>`.
* Define Repository interfaces inside the Domain layer (Dependency Inversion Principle).

**Evidence:**
Domain module files contain zero `import android.*` statements.

```kotlin
// Example: Pure domain UseCase enforcing business logic validation
class CalculateOrderTotalUseCase @Inject constructor(
    private val discountRepository: DiscountRepository
) {
    suspend operator fun invoke(cartItems: List<CartItem>): Result<BigDecimal> {
        if (cartItems.isEmpty()) return Result.failure(EmptyCartException())
        val subtotal = cartItems.sumOf { it.price * it.quantity.toBigDecimal() }
        val discount = discountRepository.getActiveDiscount(subtotal)
        return Result.success(subtotal - discount)
    }
}
```

---

### 02 Data Layer Mapping & Isolation

**Intent:** Prevent raw API response schemas or SQLite entities from leaking into presentation or business logic.

**Actions:**
* Create dedicated data models: Network DTOs (e.g. `UserResponseDto`), Local DB Entities (`UserEntity`), and Domain Entities (`User`).
* Implement explicit mapper functions (`Dto.toDomain()`, `Entity.toDomain()`, `Domain.toEntity()`).
* Encapsulate remote API calls and database transactions inside Repository implementations.

**Evidence:**
Changing a JSON key in a Retrofit model requires modifications only inside the Data layer mapper, leaving UseCases and ViewModels completely untouched.

---

### 03 ViewModel State Transformation

**Intent:** Transform domain results into immutable, passive UI State objects for presentation.

**Actions:**
* Expose UI state via a private `MutableStateFlow<UiState>` and public read-only `StateFlow<UiState>`.
* Collect UseCase flows inside `viewModelScope` using appropriate coroutine dispatchers.
* Handle loading, success, and error states explicitly using sealed interfaces.

**Evidence:**
ViewModel contains zero Android View references, zero Context references, and exposes only immutable `StateFlow` primitives.

---

## Anti-Rationalization Gate

### Excuse
"This feature is simple, so I'll call the Retrofit service directly from the ViewModel."

### Rebuttal
Bypassing repositories and use cases for 'simple' features sets a dangerous precedent. Once data fetching logic is embedded in ViewModels, adding local caching or offline synchronization requires a complete rewrite of the presentation layer.

---

### Excuse
"Mapping between DTOs, Entities, and Domain models creates too many duplicate classes."

### Rebuttal
Model duplication is a feature, not a bug. It decouples your business domain from backend API changes and database schema migrations. A breaking backend change should never force a re-architecture of your UI layout.

---

## Red Flags

* Import statements importing `android.content.Context` or `android.view.*` inside ViewModels or UseCases.
* UseCases referencing database DAOs or Retrofit service interfaces directly instead of domain repository interfaces.
* Domain entities annotated with `@Entity` (Room) or `@SerialName` (Kotlinx Serialization).
* Presentation layer making direct calls to network data sources without repository abstraction.

---

## Verification

1. **Architecture Boundary Check:** Run dependency analysis tools or Detekt custom rules ensuring Domain module has no dependencies on Data or UI modules.
2. **Unit Test Coverage:** 100% unit test pass rate for UseCase business logic using pure MockK/JUnit5 test suites without Robolectric overhead.
3. **Data Mapper Verification:** Unit tests validating correct handling of null values and edge cases during DTO -> Domain mapping.

---

## Exit Criteria

* [ ] Domain layer has zero Android framework dependencies.
* [ ] Repositories implement domain interfaces defined in domain contracts.
* [ ] Network DTOs and Database Entities are mapped to Domain models before reaching UseCases.
* [ ] ViewModels expose immutable `StateFlow<UiState>` streams.
* [ ] Business rules inside UseCases are 100% covered by fast JVM unit tests.
