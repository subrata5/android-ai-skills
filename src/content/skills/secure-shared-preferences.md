---
title: "Secure Shared Preferences"
description: "Protect sensitive local storage, authentication tokens, and API credentials using EncryptedSharedPreferences and Android KeyStore."
category: "Security"
phase: "Review"
command: "/review"
trigger: "Use when auditing or implementing local storage for auth tokens, API keys, and sensitive user credentials using EncryptedSharedPreferences or Proto DataStore."
tags:
  - security
  - datastore
  - encryption
  - keystore
order: 14
related:
  - room-database-offline-first
  - network-caching-retrofit
  - memory-leak-profiling
---

# Secure Shared Preferences

## The Situation

Storing sensitive user data (OAuth access tokens, refresh tokens, PIN codes, personally identifiable information) in plain-text `SharedPreferences` files or SQLite databases is a severe security vulnerability. On rooted devices, or via physical device extraction and backup exploits, attackers can inspect raw XML files located in `/data/data/com.example.app/shared_prefs/` and hijack user sessions.

Senior Android engineers enforce **hardware-backed encryption at rest**. Using Jetpack Security's `EncryptedSharedPreferences` or encrypted Proto DataStore backed by the **Android KeyStore system**, encryption keys are generated inside isolated hardware (TEE - Trusted Execution Environment or StrongBox), ensuring data cannot be decrypted even if raw storage files are extracted.

---

## Workflow

### 01 EncryptedSharedPreferences Instantiation

**Intent:** Encrypt both preference keys and values using AES-256 GCM encryption.

**Actions:**
* Obtain a Master Key alias using `MasterKey.Builder(context)` specifying `AES256_GCM` scheme.
* Instantiate `EncryptedSharedPreferences.create(...)` using the master key.
* Access encrypted storage through the standard `SharedPreferences` API interface.

**Evidence:**
Inspecting the generated preferences XML file on disk reveals garbled, encrypted base64 strings for both keys and values.

```kotlin
// Example: Hardware-backed EncryptedSharedPreferences setup
fun createEncryptedPreferences(context: Context): SharedPreferences {
    val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    return EncryptedSharedPreferences.create(
        context,
        "secure_auth_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
}
```

---

### 02 KeyStore Exception & Corruption Recovery

**Intent:** Prevent app crashes caused by KeyStore key invalidation (e.g. after OS updates or device lock state changes).

**Actions:**
* Wrap `EncryptedSharedPreferences` creation inside try-catch blocks for `KeyStoreException` or `AEADBadTagException`.
* If key corruption occurs, clear the corrupted storage file gracefully and force re-authentication rather than crashing the app process continuously.

**Evidence:**
Simulating KeyStore corruption triggers a safe fallback logout flow without crashing the user session.

---

### 03 Migration from Legacy Plain-Text Preferences

**Intent:** Safely migrate existing legacy users from unencrypted storage to encrypted storage without data loss.

**Actions:**
* Read legacy token value from standard `SharedPreferences`.
* Write token value to `EncryptedSharedPreferences`.
* Immediately clear and remove the legacy unencrypted preference entry.

**Evidence:**
Legacy plain-text XML preferences file contains 0 sensitive keys after app startup.

---

## Anti-Rationalization Gate

### Excuse
"It's fine to store auth tokens in standard SharedPreferences because non-rooted phones sandbox app data."

### Rebuttal
Android sandboxing does not protect against physical ADB backup extraction, malware exploiting OS zero-days, or device rooting tools. Auth tokens are credentials that grant full API access and must always be encrypted at rest.

---

### Excuse
"I'll write my own AES encryption helper function using a hardcoded secret key string in Kotlin."

### Rebuttal
Hardcoded encryption keys in Kotlin or native C++ files are easily extracted by reverse-engineering tools like APKTool, Jadx, or Ghidra. Use the Android KeyStore system.

---

## Red Flags

* Plain-text authentication tokens visible in `/data/data/<package>/shared_prefs/` XML files.
* Custom crypto algorithms implemented manually instead of using Jetpack Security / Tink.
* Master keys generated without hardware-backed KeyStore integration.
* Storing sensitive API secrets or private keys directly in Kotlin source code.

---

## Verification

1. **ADB Storage Audit:** Execute `adb shell cat /data/data/com.example/shared_prefs/secure_prefs.xml` and verify no readable tokens exist.
2. **Security Scanner Pass:** Run MobSF (Mobile Security Framework) or Android Lint security rules verifying zero cleartext storage warnings.

---

## Exit Criteria

* [ ] All auth tokens and credentials stored in `EncryptedSharedPreferences` or Encrypted DataStore.
* [ ] Master key uses hardware-backed Android KeyStore (`AES256_GCM`).
* [ ] KeyStore exception recovery strategy implemented.
* [ ] Legacy plain-text preference entries migrated and purged.
* [ ] Cleartext storage verified absent via ADB shell audit.
