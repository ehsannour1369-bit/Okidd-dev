-- =============================================================
--  oKidd Educational Platform — Supabase Migration Script
--  Generated from production PostgreSQL schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================

-- ──────────────────────────────────────────────────────────────
--  NOTE: Supabase already creates the "public" schema.
--  Run each block; if a table already exists it will be skipped.
-- ──────────────────────────────────────────────────────────────

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    password          TEXT NOT NULL,
    role              TEXT NOT NULL DEFAULT 'student',
    phone             TEXT,
    status            TEXT NOT NULL DEFAULT 'inactive',
    school_id         INTEGER,
    national_id       TEXT,
    gender            TEXT DEFAULT 'male',
    gender_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url        TEXT,
    parent_id         INTEGER,
    token_version     INTEGER NOT NULL DEFAULT 1,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SCHOOLS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schools (
    id                    SERIAL PRIMARY KEY,
    name                  TEXT NOT NULL,
    user_id               INTEGER,
    manager_user_id       INTEGER,
    address               TEXT,
    phone                 TEXT,
    manager_name          TEXT,
    manager_phone         TEXT,
    manager_national_id   TEXT,
    logo_url              TEXT,
    school_type           TEXT DEFAULT 'mixed',
    video_conference_url  TEXT,
    skyroom_api_key       TEXT,
    status                TEXT NOT NULL DEFAULT 'inactive',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BRANCHES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.branches (
    id                    SERIAL PRIMARY KEY,
    school_id             INTEGER NOT NULL,
    name                  TEXT NOT NULL,
    address               TEXT,
    phone                 TEXT,
    academic_year         TEXT,
    manager_user_id       INTEGER,
    manager_name          TEXT,
    manager_phone         TEXT,
    manager_national_id   TEXT,
    educational_levels    TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BRANCH MANAGERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.branch_managers (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL,
    branch_id     INTEGER NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '1403-1404',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── GRADE LEVELS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grade_levels (
    id         SERIAL PRIMARY KEY,
    branch_id  INTEGER NOT NULL,
    name       TEXT NOT NULL,
    level      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── GRADES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grades (
    id             SERIAL PRIMARY KEY,
    grade_level_id INTEGER NOT NULL,
    name           TEXT NOT NULL,
    year           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CLASSES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classes (
    id         SERIAL PRIMARY KEY,
    grade_id   INTEGER NOT NULL,
    name       TEXT NOT NULL,
    capacity   INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_teachers (
    id         SERIAL PRIMARY KEY,
    class_id   INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    book_id    INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_students (
    id         SERIAL PRIMARY KEY,
    class_id   INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_books (
    id         SERIAL PRIMARY KEY,
    class_id   INTEGER NOT NULL,
    book_id    INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SCHOOL TEACHERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.school_teachers (
    id         SERIAL PRIMARY KEY,
    school_id  INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, teacher_id)
);

-- ── STUDENT ENROLLMENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER NOT NULL,
    school_id     INTEGER NOT NULL,
    branch_id     INTEGER,
    academic_year TEXT NOT NULL DEFAULT '1403-1404',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BOOKS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.books (
    id             SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    lesson_count   INTEGER NOT NULL DEFAULT 0,
    monthly_fee    NUMERIC(12,2) NOT NULL DEFAULT 0,
    grade_level    TEXT,
    academic_stage TEXT,
    is_preset      BOOLEAN NOT NULL DEFAULT FALSE,
    price          NUMERIC(12,0) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LESSONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
    id          SERIAL PRIMARY KEY,
    book_id     INTEGER NOT NULL,
    title       TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONTENT ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content (
    id           SERIAL PRIMARY KEY,
    title        TEXT NOT NULL,
    type         TEXT NOT NULL DEFAULT 'link',
    url          TEXT,
    file_path    TEXT,
    api_endpoint TEXT,
    lesson_id    INTEGER,
    class_id     INTEGER,
    book_id      INTEGER,
    description  TEXT,
    order_index  INTEGER NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LESSON UNLOCKS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_unlocks (
    id          SERIAL PRIMARY KEY,
    class_id    INTEGER NOT NULL,
    lesson_id   INTEGER NOT NULL,
    book_id     INTEGER NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STUDENT PROGRESS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_progress (
    id           SERIAL PRIMARY KEY,
    student_id   INTEGER NOT NULL,
    lesson_id    INTEGER NOT NULL,
    completed    BOOLEAN NOT NULL DEFAULT FALSE,
    score        INTEGER DEFAULT 0,
    lesson_stage VARCHAR(20),
    book_id      INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PROGRESS CHART ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progress_chart (
    id         SERIAL PRIMARY KEY,
    class_id   INTEGER NOT NULL,
    book_id    INTEGER NOT NULL,
    lesson_id  INTEGER NOT NULL,
    teach_date TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRESENCE LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.presence_log (
    id               SERIAL PRIMARY KEY,
    student_id       INTEGER NOT NULL,
    class_id         INTEGER,
    entered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exited_at        TIMESTAMPTZ,
    duration_minutes INTEGER
);

-- ── GAME SCORES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_scores (
    id         SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    score      INTEGER NOT NULL DEFAULT 0,
    game_type  VARCHAR(50) DEFAULT 'default',
    lesson_id  INTEGER,
    played_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CLASS SCHEDULES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id            SERIAL PRIMARY KEY,
    class_id      INTEGER NOT NULL,
    day_of_week   INTEGER NOT NULL,
    start_time    TEXT NOT NULL,
    end_time      TEXT NOT NULL,
    subject       TEXT NOT NULL,
    teacher_id    INTEGER,
    academic_year TEXT NOT NULL DEFAULT '1404',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CLASS SESSIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id                     SERIAL PRIMARY KEY,
    class_id               INTEGER NOT NULL,
    teacher_id             INTEGER NOT NULL,
    title                  TEXT NOT NULL,
    room_code              TEXT NOT NULL,
    status                 TEXT NOT NULL DEFAULT 'active',
    started_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at               TIMESTAMPTZ,
    skyroom_room_id        INTEGER,
    skyroom_presenter_url  TEXT,
    skyroom_attendee_url   TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id             SERIAL PRIMARY KEY,
    school_id      INTEGER NOT NULL,
    title          TEXT NOT NULL,
    body           TEXT NOT NULL,
    target_role    TEXT NOT NULL DEFAULT 'student',
    branch_id      INTEGER,
    grade_level_id INTEGER,
    class_id       INTEGER,
    sender_id      INTEGER,
    target_user_id INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_replies (
    id            SERIAL PRIMARY KEY,
    notification_id INTEGER NOT NULL,
    sender_id     INTEGER NOT NULL,
    sender_role   TEXT NOT NULL DEFAULT 'student',
    sender_name   TEXT NOT NULL DEFAULT '',
    body          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PUSH SUBSCRIPTIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EXAM SCHEDULE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_schedule (
    id          SERIAL PRIMARY KEY,
    school_id   INTEGER NOT NULL,
    class_id    INTEGER,
    lesson_name TEXT NOT NULL,
    exam_date   TEXT NOT NULL,
    exam_pages  TEXT,
    exam_time   TEXT,
    exam_type   TEXT,
    exam_mode   TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PACKAGES & ORDERS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.packages (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    school_id     INTEGER,
    total_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
    student_count INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.package_books (
    id         SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL,
    book_id    INTEGER NOT NULL,
    quantity   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.book_orders (
    id              SERIAL PRIMARY KEY,
    school_id       INTEGER NOT NULL,
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    discount        NUMERIC(5,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,0) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12,0) NOT NULL DEFAULT 0,
    final_amount    NUMERIC(12,0) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method  VARCHAR(50),
    receipt_url     TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.book_order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL,
    book_id     INTEGER NOT NULL,
    quantity    INTEGER NOT NULL,
    unit_price  NUMERIC(12,0) NOT NULL DEFAULT 0,
    subtotal    NUMERIC(12,0) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.book_license_transactions (
    id               SERIAL PRIMARY KEY,
    school_id        INTEGER NOT NULL,
    book_id          INTEGER NOT NULL,
    quantity         INTEGER NOT NULL,
    tracking_number  VARCHAR(100) NOT NULL UNIQUE,
    payment_date     VARCHAR(20),
    amount           NUMERIC(12,0),
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── WALLETS & TRANSACTIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
    id         SERIAL PRIMARY KEY,
    school_id  INTEGER NOT NULL UNIQUE,
    balance    NUMERIC(14,0) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id            SERIAL PRIMARY KEY,
    wallet_id     INTEGER NOT NULL,
    school_id     INTEGER NOT NULL,
    type          VARCHAR(10) NOT NULL,
    amount        NUMERIC(12,0) NOT NULL,
    balance_after NUMERIC(14,0) NOT NULL DEFAULT 0,
    description   TEXT,
    reference_id  INTEGER,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id          SERIAL PRIMARY KEY,
    school_id   INTEGER NOT NULL,
    type        TEXT NOT NULL DEFAULT 'purchase',
    amount      NUMERIC(12,0) NOT NULL DEFAULT 0,
    description TEXT,
    reference   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONSULTANTS & CONSULTATIONS ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultants (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    school_id  INTEGER NOT NULL,
    specialty  TEXT,
    about      TEXT,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultations (
    id              SERIAL PRIMARY KEY,
    parent_id       INTEGER NOT NULL,
    consultant_id   INTEGER NOT NULL,
    topic           TEXT NOT NULL,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    scheduled_date  TEXT,
    scheduled_time  TEXT,
    duration        INTEGER DEFAULT 30,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PARENT–STUDENT LINKS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parent_students (
    id            SERIAL PRIMARY KEY,
    parent_id     INTEGER NOT NULL REFERENCES public.users(id),
    student_id    INTEGER NOT NULL REFERENCES public.users(id),
    relation_type TEXT NOT NULL DEFAULT 'guardian',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    INTEGER,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS parent_students_unique
    ON public.parent_students (parent_id, student_id)
    WHERE (is_active = TRUE);

-- =============================================================
--  INDEXES FOR PERFORMANCE
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_users_email           ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone           ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_school_id       ON public.users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role            ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_branches_school_id    ON public.branches(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_id      ON public.classes(grade_id);
CREATE INDEX IF NOT EXISTS idx_class_students_sid    ON public.class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_cid    ON public.class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_sid  ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school  ON public.notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class  ON public.class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON public.class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_scores_student   ON public.game_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_wallets_school        ON public.wallets(school_id);

-- =============================================================
--  SUPABASE: Disable Row Level Security on all tables
--  (The app uses its own JWT-based auth — Supabase RLS is not needed)
--  Remove these lines if you want to use Supabase Auth + RLS instead.
-- =============================================================
ALTER TABLE public.users                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_managers          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_levels             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_books              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_teachers          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.books                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_unlocks           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_chart           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_log             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_replies     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedule            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_books            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_orders              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_order_items         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_license_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students          DISABLE ROW LEVEL SECURITY;

-- =============================================================
--  Done! Next step: update DATABASE_URL in your environment to
--  point to the Supabase connection string:
--    postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
-- =============================================================
