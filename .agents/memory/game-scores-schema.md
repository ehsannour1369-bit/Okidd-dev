---
name: game_scores schema mismatch
description: The game_scores table was originally created with game_name column, but Drizzle schema uses game_type (varchar 50). Fixed with a live ALTER TABLE.
---

**Rule:** The `game_scores` table uses column `game_type varchar(50)` in the Drizzle schema (`lib/db/src/schema/gameScores.ts`). The original DB had it as `game_name text`. This was fixed on 2026-05-31 via:
```sql
ALTER TABLE game_scores RENAME COLUMN game_name TO game_type;
ALTER TABLE game_scores ALTER COLUMN game_type TYPE varchar(50) USING game_type::varchar;
```

**Why:** The column was renamed during the initial DB migration but the Drizzle schema expected the new name; any fresh `db push` will also produce `game_type`.

**How to apply:** If the `game_scores` table ever causes "Failed query" errors, check that the column is named `game_type` (not `game_name`) in the DB.
