---
title: "Network Caching with Retrofit"
description: "Implement HTTP response caching, ETag validation, OkHttp cache interceptors, and resilient network error handling in Retrofit."
category: "Networking"
phase: "Architecture"
command: "/architect"
trigger: "Use when implementing OkHttp Cache-Control headers, ETag validation, network interceptors, and resilient network error handling."
tags:
  - retrofit
  - okhttp
  - networking
  - caching
order: 17
related:
  - room-database-offline-first
  - coroutines-and-flow
  - secure-shared-preferences
---

# Network Caching with Retrofit

## The Situation

Mobile networks are unpredictable, metered, and battery-intensive. Making redundant HTTP network calls for static or infrequently changing server data drains user battery, inflates backend infrastructure server costs, and causes sluggish UI page loads.

Configuring HTTP network caching with **Retrofit and OkHttp** leverages HTTP RFC standards (`Cache-Control`, `ETag`, `If-None-Match`, `304 Not Modified`). By combining an OkHttp disk cache with custom interceptors and fallback policies, applications serve instantaneous cached responses when offline while minimizing payload bytes sent over the air.

---

## Workflow

### 01 OkHttp Cache & Interceptor Configuration

**Intent:** Configure a disk-backed HTTP cache and automatically inject fallback `Cache-Control` headers.

**Actions:**
* Instantiate OkHttp `Cache` with explicit directory and size limit (e.g., 10MB to 50MB).
* Implement an `Interceptor` that injects `Cache-Control` headers for endpoints lacking explicit server cache headers.
* Configure `OfflineCacheInterceptor` to force `only-if-cached` responses when device is offline.

**Evidence:**
Network profiler shows subsequent GET requests returning `304 Not Modified` with zero bytes transferred.

```kotlin
// Example: OkHttp Cache & Offline Interceptor Setup
fun provideOkHttpClient(context: Context): OkHttpClient {
    val cacheSize = 10 * 1024 * 1024L // 10 MB
    val cache = Cache(File(context.cacheDir, "http_cache"), cacheSize)

    return OkHttpClient.Builder()
        .cache(cache)
        .addInterceptor { chain ->
            var request = chain.request()
            if (!isNetworkAvailable(context)) {
                request = request.newBuilder()
                    .header("Cache-Control", "public, only-if-cached, max-stale=" + 60 * 60 * 24 * 7) // 1 week
                    .build()
            }
            chain.proceed(request)
        }
        .build()
}
```

---

### 02 ETag & Conditional GET Support

**Intent:** Avoid downloading full JSON response payloads when backend data has not changed.

**Actions:**
* OkHttp automatically handles `ETag` response headers and injects `If-None-Match` in subsequent request headers.
* Ensure Retrofit API service methods handle `Response<T>` wrappers to check for HTTP 304 response codes when required.

**Evidence:**
Server returns HTTP 304 code, and OkHttp serves cached response body without re-parsing JSON over network.

---

### 03 Resilient Error Interception & Logging

**Intent:** Log API errors in debug builds without exposing credentials or crashing in production.

**Actions:**
* Add `HttpLoggingInterceptor` set to `Level.BODY` in debug builds only (`if (BuildConfig.DEBUG)`).
* Sanitize auth header tokens (`Authorization: Bearer [REDACTED]`) in logging configurations.

**Evidence:**
Debug builds output formatted HTTP request/response JSON in Logcat; release builds emit zero sensitive header logs.

---

## Anti-Rationalization Gate

### Excuse
"Our backend doesn't send `Cache-Control` headers, so HTTP caching won't work."

### Rebuttal
You can inject client-side cache control headers using an OkHttp network interceptor for known GET endpoints. Client-side caching reduces network calls even if the backend lacks proper cache header configuration.

---

### Excuse
"It's fine to leave `HttpLoggingInterceptor` set to `Level.BODY` in production so we can debug user issues."

### Rebuttal
Logging HTTP bodies in production leaks sensitive user data, auth tokens, passwords, and PII into system Logcat files where other installed apps can read them. Enable body logging in debug builds only.

---

## Red Flags

* Retrofit/OkHttp instances created without disk `Cache` initialization.
* `HttpLoggingInterceptor` enabled in release builds without authentication header redaction.
* Hardcoding API base URLs in multiple places instead of injecting via Hilt `@Named("BaseUrl")`.
* Executing synchronous network calls (`call.execute()`) on the main UI thread.

---

## Verification

1. **Network Profiler Check:** Inspect Network Inspector in Android Studio to confirm HTTP 304 responses and disk cache hits.
2. **Offline Mode Test:** Enable Airplane Mode and verify cached GET requests return valid data.

---

## Exit Criteria

* [ ] Disk cache configured on OkHttpClient.
* [ ] Network interceptor handles offline caching fallback.
* [ ] Logging interceptor restricted to debug builds.
* [ ] Auth tokens sanitized in network logs.
* [ ] HTTP 304 cache validation verified in Network Profiler.
