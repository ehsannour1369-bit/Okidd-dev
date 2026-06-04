---
name: Parent-Students Connection System
description: Junction table linking parents to students, dual connection paths, max 2 parents per student
---

# Parent-Students System

## Rule
`parent_students` table is a junction between `users(role=parent)` and `users(role=student)`. Soft-delete only — set `is_active=false`, never delete rows.

**Why:** `users.parentId` was a single field — can't support two parents per child or one parent having children in different schools.

**How to apply:**
- Max 2 active parents per student — enforced in POST route with 400 error
- relation_type: `father | mother | guardian`
- POST `/parent-students` — link existing parent + student
- DELETE `/parent-students/:id` — soft deactivates (is_active=false)
- GET `/parent-students?parentId=` — parent's children (used in parent panel)
- GET `/parent-students?studentId=` — student's parents (used in school Students page)
- GET `/parents/search?q=` — search users with role=parent by name/email/phone/nationalId
- GET `/students/search-by-national-id?nationalId=` — for parent self-service

## Two connection paths
1. **School manager** (in Students page): clicks 👥 button → modal with 3 tabs: current parents list (with remove), search existing parent by name/email, create new parent account
2. **Parent self-service** (in Children page): clicks "افزودن فرزند" → enters child national ID → finds student → picks relation type → connects

## Schema file
`lib/db/src/schema/parentStudents.ts` — exported from `lib/db/src/schema/index.ts`

## Frontend
- `artifacts/okidd/src/pages/parent/Children.tsx` — fixed: now uses `parent_students` table not `users.schoolId` filter
- `artifacts/okidd/src/pages/school/Students.tsx` — added `ParentBadges` inline display + `ParentsModal` 3-tab management
