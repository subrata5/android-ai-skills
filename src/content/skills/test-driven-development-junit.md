---
title: "Test-Driven Development with JUnit"
description: "Master the Red-Green-Refactor cycle in Android JVM unit testing using JUnit5, MockK, Turbine, and explicit behavioral verification."
category: "Testing"
phase: "Test"
command: "/test"
trigger: "Use when writing unit tests to specify ViewModel business logic, Use Case behavior, and repository state changes."
tags:
  - tdd
  - junit
  - unit-testing
  - mockk
order: 9
related:
  - ui-testing-compose-rule
  - coroutines-and-flow
  - clean-architecture-mvvm
---

# Test-Driven Development with JUnit

## The Situation

Writing tests post-implementation frequently produces fragile tests that merely mirror written code rather than verifying specification requirements. Developers fall into the trap of writing assertions that pass regardless of bugs, ignoring edge cases, and skipping testing under deadline pressure.

**Test-Driven Development (TDD)** flips this paradigm: you write a failing test first to define the expected contract, write the minimal production code to pass the test, and refactor cleanly. In Android engineering, TDD applied to ViewModels, UseCases, and Repositories ensures high test coverage, eliminates regression risks, and produces decoupled, testable architecture by design.

---

## Workflow

### 01 Red Phase — Specify Failing Test First

**Intent:** Define clear behavioral requirements before touching production code files.

**Actions:**
* Create a test file in `src/test/java/...` using JUnit5 or JUnit4 with MockK.
* Write a test method named clearly after expected behavior: `shouldReturnErrorStateWhenNetworkRequestFails()`.
* Setup test doubles (Mocks/Fakes) and state assertions.
* Execute test to verify it **FAILS** for expected reasons (e.g. `UnimplementedException` or assertion mismatch).

**Evidence:**
Build log shows test failing with explicit assertion output.

```kotlin
// Example: Red Phase - Writing test for discount calculation
@Test
fun `applyDiscountReturnsTenPercentOffWhenOrderExceedsThreshold`() = runTest {
    // Arrange
    val useCase = CalculateDiscountUseCase()
    val orderAmount = BigDecimal("150.00")

    // Act
    val result = useCase(orderAmount)

    // Assert
    assertEquals(BigDecimal("135.00"), result)
}
```

---

### 02 Green Phase — Minimal Production Implementation

**Intent:** Write the simplest possible code that satisfies the test assertion.

**Actions:**
* Implement the target function/class using minimal logic.
* Avoid premature optimization, extra features, or unrequested abstractions.
* Re-run test suite to confirm green pass.

**Evidence:**
JUnit runner reports green pass for test method in under 100ms execution time.

---

### 03 Refactor Phase — Clean Architecture & Cleanup

**Intent:** Improve code quality, remove duplication, and optimize readability without changing behavior.

**Actions:**
* Extract reusable helper methods, clean up variable names, and enforce immutability.
* Re-run unit test suite continuously to guarantee zero regressions.

**Evidence:**
All unit tests remain 100% green while code readability and structure improve.

---

## Anti-Rationalization Gate

### Excuse
"I'll write the tests after I finish coding the feature to make sure I don't waste time rewriting tests when specifications change."

### Rebuttal
Tests written after code are biased toward passing the existing implementation rather than validating actual requirements. Post-hoc tests frequently fail to test edge cases, leading to unverified production code.

---

### Excuse
"Unit tests are slow and take too long to run during development."

### Rebuttal
JVM unit tests (running directly on local computer hardware without Robolectric or Android emulator) execute in milliseconds. Slow tests are a sign of improper framework coupling, missing dependency injection, or database I/O leakages in test scopes.

---

## Red Flags

* Unit tests using `Thread.sleep()` to wait for asynchronous coroutines instead of `TestDispatcher` and `runTest`.
* Tests asserting `assertTrue(true)` or containing empty test method bodies.
* Production code containing testing flags (`if (isTesting) return mockData`).
* Mocking pure Kotlin value objects or data classes instead of instantiating real immutable instances.

---

## Verification

1. **Fast JVM Execution Check:** `./gradlew testDebugUnitTest` runs 100+ tests in under 5 seconds.
2. **Turbine Flow Test Pass:** All StateFlow and SharedFlow emissions verified using CashApp Turbine assertions.
3. **Coverage Report:** Jacoco or Kover report confirms 90%+ branch coverage on Domain UseCases.

---

## Exit Criteria

* [ ] Tests written before production implementation code.
* [ ] All tests execute on JVM without Android emulator dependency.
* [ ] Coroutines tested cleanly with `StandardTestDispatcher` / `runTest`.
* [ ] Flow emissions verified with `Turbine`.
* [ ] 100% of domain use cases covered by unit tests.
