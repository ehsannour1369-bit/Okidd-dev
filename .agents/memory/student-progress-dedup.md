---
name: studentProgress duplicate records
description: studentProgress table can have multiple rows per (studentId, lessonId); always deduplicate before aggregating completions.
---

## Rule
When querying `studentProgress` and counting completions per lesson or per book, always deduplicate rows by `(studentId, lessonId)` — keeping the row where `completed = true` when conflicts exist.

**Why:** The mobile app (or API) can insert multiple progress rows for the same student+lesson combination. Simply counting `WHERE completed = true` overcounts and produces `completionPct > 100%`.

**How to apply:**
```ts
// In any aggregation that counts completions:
const byStudent = new Map<number, typeof rows[0]>();
for (const p of rows) {
  const existing = byStudent.get(p.studentId);
  if (!existing || p.completed) byStudent.set(p.studentId, p);
}
const deduped = [...byStudent.values()];
```
Cap completionPct with `Math.min(100, pct)` as a safety net too.

Affected endpoints: `GET /school-report/teachers` (classBreakdown), `GET /school-report/class-detail`.
