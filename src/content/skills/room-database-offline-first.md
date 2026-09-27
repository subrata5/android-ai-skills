---
title: "Room Database + Offline First"
description: "Design robust offline-first synchronization, SQLite Room schemas, automated database migrations, and reactive data persistence."
category: "Data"
phase: "Architecture"
command: "/architect"
trigger: "Use when designing persistent offline storage, SQLite schemas, DAOs, migrations, and remote sync strategies."
tags:
  - room
  - database
  - sqlite
  - offline-first
order: 4
related:
  - coroutines-and-flow
  - network-caching-retrofit
  - clean-architecture-mvvm
---

# Room Database + Offline First

## The Situation

Mobile users expect applications to work seamlessly in low-connectivity environment, spotty signals, or airplane mode. Apps that depend entirely on live network fetches display blank loading screens, lose user edits during network drops, and deliver a frustrating UX.

An **offline-first architecture** treats local persistent storage (Room SQLite database) as the single source of truth for UI display. Remote network requests act purely as asynchronous background synchronization events that populate local tables. Doing this safely requires rigorous schema design, explicit database version migrations, transaction isolation, and conflict resolution rules.

---

## Workflow

### 01 Single Source of Truth DAO Design

**Intent:** Guarantee UI components observe local database tables reactive to state updates, regardless of network availability.

**Actions:**
* Expose queries returning Kotlin `Flow<List<Entity>>` or `Flow<Entity>` from Room DAOs.
* Perform write operations (inserts, updates, deletes) in suspend functions marked with `@Transaction` when updating multi-table schemas.
* Ensure UI layers subscribe to DAO flows through the Repository pattern rather than invoking direct network calls.

**Evidence:**
When network connectivity is severed, the app renders cached database items immediately upon launch.

```kotlin
// Example: Reactive Room DAO returning Flow stream
@Dao
interface UserProfileDao {
    @Query("SELECT * FROM user_profile WHERE id = :userId")
    fun observeUserProfile(userId: String): Flow<UserProfileEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateProfile(profile: UserProfileEntity)

    @Transaction
    suspend fun syncRemoteProfile(profile: UserProfileEntity, preferences: UserPreferencesEntity) {
        insertOrUpdateProfile(profile)
        insertPreferences(preferences)
    }

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPreferences(preferences: UserPreferencesEntity)
}
```

---

### 02 Automated Schema Migration Testing

**Intent:** Prevent app crashes caused by `IllegalStateException: Room cannot verify the data integrity` after database schema changes.

**Actions:**
* Export database schemas by setting `room.schemaLocation` in `build.gradle.kts`.
* Write explicit `Migration(start, end)` objects for every database version increment.
* Create automated migration tests using `MigrationTestHelper` verifying data integrity across schema versions.

**Evidence:**
Automated migration test verifies upgrading database from version N to version N+1 retains existing rows without crash or data loss.

---

### 03 Sync Engine & Conflict Resolution

**Intent:** Handle concurrent local edits and remote backend responses gracefully without losing data.

**Actions:**
* Tag local entities with synchronization state metadata (`syncStatus: PENDING, SYNCED, ERROR`, `lastModifiedTimestamp`).
* Use idempotent API endpoints for upload queues.
* Implement deterministic conflict strategies (e.g. Server-Wins, Last-Write-Wins, or explicit user merge prompts).

**Evidence:**
Offline created entities sync automatically when network restores and change state to `SYNCED`.

---

## Anti-Rationalization Gate

### Excuse
"I'll set `fallbackToDestructiveMigration()` so I don't have to write migration scripts during development."

### Rebuttal
`fallbackToDestructiveMigration()` wipes the entire SQLite database when schema changes occur. Leaving this setting enabled in production will delete all user offline data, stored drafts, and cached records during app updates. Write explicit migrations.

---

### Excuse
"Main thread database access is fine because the queries are small."

### Rebuttal
SQLite disk access times are un-deterministic. Flash storage garbage collection or device background I/O spikes will freeze the main thread and trigger Application Not Responding (ANR) dialogs. Enforce background thread execution via Room's built-in coroutine support.

---

## Red Flags

* Room Database built with `.allowMainThreadQueries()`.
* Schema updates without exported JSON schema files or missing `MigrationTestHelper` tests.
* Remote API data rendered directly to UI without persisting to local database first in offline-first flows.
* DAO functions performing multi-table modifications without `@Transaction` annotation.

---

## Verification

1. **Migration Test Suite:** Run `./gradlew testDebugUnitTest --tests "*.DatabaseMigrationTest"` verifying schema upgrades.
2. **Offline Network Simulation:** Enable Airplane Mode, create local entries, verify immediate UI persistence, restore connectivity, and verify remote API sync.
3. **Database Inspector Validation:** Use Android Studio Database Inspector to verify foreign keys and indexes.

---

## Exit Criteria

* [ ] Single source of truth pattern implemented for persistent features.
* [ ] Schema export enabled in Gradle build config.
* [ ] Explicit migrations defined for all version jumps.
* [ ] Migration tests pass in CI pipeline.
* [ ] No main-thread database queries permitted.
