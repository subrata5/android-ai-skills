---
title: "Accessibility and WCAG for Android"
description: "Implement WCAG 2.2 AA standards, TalkBack screen reader navigation, touch target dimensions, and semantic accessibility trees in Compose."
category: "Accessibility"
phase: "Review"
command: "/review"
trigger: "Use when evaluating accessibility semantics, TalkBack screen reader navigation, touch target sizes, and WCAG contrast ratios."
tags:
  - accessibility
  - wcag
  - talkback
  - semantics
order: 19
related:
  - jetpack-compose-ui
  - ui-testing-compose-rule
  - reactive-state-hoisting
---

# Accessibility and WCAG for Android

## The Situation

Over 15% of global app users navigate Android devices using accessibility services: TalkBack screen readers, Switch Access, voice control, high-contrast modes, or dynamic font scaling. Apps that ignore accessibility create impenetrable barriers for users with visual, motor, or cognitive impairments.

Achieving **WCAG 2.2 AA compliance on Android** requires structuring semantic nodes correctly, ensuring minimum 48dp x 48dp touch targets, supporting dynamic font sizing up to 200% without clipping, maintaining 4.5:1 text color contrast ratios, and grouping related visual elements into unified screen reader announcements.

---

## Workflow

### 01 TalkBack Semantics & Node Merging

**Intent:** Provide logical, unified screen reader focus navigation without noisy item fragmentation.

**Actions:**
* Group compound components (e.g. avatar + user name + status text in a card) using `Modifier.semantics(mergeDescendants = true)`.
* Set meaningful `contentDescription` strings for visual icons; set `contentDescription = null` for purely decorative items to hide them from TalkBack.
* Specify semantic roles using `role = Role.Button` or `role = Role.Checkbox` on custom clickable components.

**Evidence:**
TalkBack focuses an entire transaction row as a single interactive element and reads: *"John Doe, Paid $50, Button, double tap to view details"*.

```kotlin
// Example: Accessible compound composable with merged semantics
@Composable
fun AccessibleUserCard(
    userName: String,
    userRole: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 48.dp)
            .semantics(mergeDescendants = true) {
                role = Role.Button
                contentDescription = "User $userName, Role $userRole"
            }
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Person,
            contentDescription = null // Decorative icon hidden from TalkBack
        )
        Column(modifier = Modifier.padding(start = 16.dp)) {
            Text(text = userName, style = MaterialTheme.typography.titleMedium)
            Text(text = userRole, style = MaterialTheme.typography.bodySmall)
        }
    }
}
```

---

### 02 Minimum Touch Target Dimensions (48dp x 48dp)

**Intent:** Ensure all interactive elements can be reliably tapped by users with motor control variations.

**Actions:**
* Enforce 48dp x 48dp minimum size using `Modifier.defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)`.
* If a visual icon is smaller (e.g., 24dp), add transparent padding using `Modifier.padding(12.dp)` to expand the touch boundary.

**Evidence:**
Accessibility Scanner flags zero touch target size violations across screen views.

---

### 03 Dynamic Font Scaling & High Contrast Verification

**Intent:** Prevent text truncation or overlapping when users increase system font scale settings.

**Actions:**
* Use `sp` units for all text font sizes (`Text(text = "Label", fontSize = 16.sp)`).
* Avoid hardcoding fixed height containers (`Modifier.height(40.dp)`) around multi-line text views.
* Ensure text-to-background color contrast meets or exceeds **4.5:1** for normal text and **3.0:1** for large text.

**Evidence:**
Enabling 200% font size in Android system settings renders readable text without clipping or line truncation.

---

## Anti-Rationalization Gate

### Excuse
"Our user base doesn't use accessibility tools, so we don't need to spend time on TalkBack support."

### Rebuttal
Accessibility tools are used by millions of people every day, including users with temporary injuries, low vision, or age-related impairments. Accessible UI design improves usability for all users and is legally mandated in many jurisdictions.

---

### Excuse
"Adding `contentDescription = "Image"` is sufficient for screen readers."

### Rebuttal
Vague content descriptions like "Image", "Button", or "Icon" provide zero useful context to visually impaired users. Describe the action or information conveyed by the element (e.g. "Close search dialog" or "Profile photo of Jane Smith").

---

## Red Flags

* Interactive buttons or icon controls smaller than 48dp x 48dp touch area.
* Hardcoded pixel heights (`dp`) applied to text containers causing text clipping at 200% font scale.
* Setting non-null `contentDescription` strings on decorative background graphics.
* Text color contrast ratio falling below 4.5:1 against surface background.

---

## Verification

1. **Accessibility Scanner Pass:** Run Google Accessibility Scanner app on physical device with 0 high-severity errors.
2. **TalkBack Manual Navigation:** Enable TalkBack and navigate entire feature flow using swipe gestures only.
3. **Font Scale Audit:** Test app layout with system font scale set to 200% to verify zero text truncation.

---

## Exit Criteria

* [ ] All touch targets satisfy 48dp x 48dp minimum size.
* [ ] Decorative elements set `contentDescription = null`.
* [ ] Interactive elements have descriptive semantics labels and roles.
* [ ] Text contrast meets WCAG 2.2 AA 4.5:1 ratio.
* [ ] Layout adapts cleanly to 200% dynamic font scaling.
