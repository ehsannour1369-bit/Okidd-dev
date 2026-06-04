---
name: Student Enrollments System
description: Year-based student-school membership tracking, mirrors branch_managers pattern
---

# Student Enrollments System

## Rule
`student_enrollments` table tracks which school/branch a student belongs to each academic year. One active record per student per year — deactivate old, insert new (like branch_managers).

**Why:** `users.schoolId` is a static field — useless once a student transfers schools across years. Enrollment table preserves full history.

**How to apply:**
- When enrolling/transferring: POST `/student-enrollments` → deactivates existing active record for same student+year, inserts new one, updates `users.schoolId` as convenience cache
- To list students for a school+year: GET `/students-by-year?schoolId=&academicYear=`
- To get full history: GET `/student-enrollments/:studentId/history`
- Schema file: `lib/db/src/schema/studentEnrollments.ts` (exported from index.ts)
- Route file: `artifacts/api-server/src/routes/studentEnrollments.ts` (registered in index.ts)
- Frontend: `artifacts/okidd/src/pages/school/Students.tsx` (shared by school + branch roles via App.tsx)

## Current year default
`CURRENT_YEAR = "1403-1404"` — hardcoded in frontend. When a new school year starts, update this constant.

## Seeding
Existing students were seeded: `INSERT INTO student_enrollments ... FROM users WHERE role='student' AND school_id IS NOT NULL` (7 records in dev DB).
