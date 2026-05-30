--
-- PostgreSQL database dump
--

\restrict eEg6tKH6NcubgyCvxltrZOVIhwnHL4RNWMnGv2Lxgdf9kfhLDZQfNlHyCPqblTR

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title text NOT NULL,
    lesson_count integer DEFAULT 0 NOT NULL,
    monthly_fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    grade_level text,
    academic_stage text,
    is_preset boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.books OWNER TO postgres;

--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.books_id_seq OWNER TO postgres;

--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: branch_managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch_managers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    branch_id integer NOT NULL,
    academic_year text DEFAULT '1403-1404'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.branch_managers OWNER TO postgres;

--
-- Name: branch_managers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branch_managers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branch_managers_id_seq OWNER TO postgres;

--
-- Name: branch_managers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_managers_id_seq OWNED BY public.branch_managers.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    school_id integer NOT NULL,
    name text NOT NULL,
    address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    manager_user_id integer
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: class_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_books (
    id integer NOT NULL,
    class_id integer NOT NULL,
    book_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.class_books OWNER TO postgres;

--
-- Name: class_books_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_books_id_seq OWNER TO postgres;

--
-- Name: class_books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_books_id_seq OWNED BY public.class_books.id;


--
-- Name: class_students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_students (
    id integer NOT NULL,
    class_id integer NOT NULL,
    student_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.class_students OWNER TO postgres;

--
-- Name: class_students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_students_id_seq OWNER TO postgres;

--
-- Name: class_students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_students_id_seq OWNED BY public.class_students.id;


--
-- Name: class_teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_teachers (
    id integer NOT NULL,
    class_id integer NOT NULL,
    teacher_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.class_teachers OWNER TO postgres;

--
-- Name: class_teachers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_teachers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_teachers_id_seq OWNER TO postgres;

--
-- Name: class_teachers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_teachers_id_seq OWNED BY public.class_teachers.id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    grade_id integer NOT NULL,
    name text NOT NULL,
    capacity integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_id_seq OWNER TO postgres;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content (
    id integer NOT NULL,
    title text NOT NULL,
    type text DEFAULT 'link'::text NOT NULL,
    url text,
    file_path text,
    api_endpoint text,
    lesson_id integer,
    class_id integer,
    book_id integer,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content OWNER TO postgres;

--
-- Name: content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_id_seq OWNER TO postgres;

--
-- Name: content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.content_id_seq OWNED BY public.content.id;


--
-- Name: exam_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_schedule (
    id integer NOT NULL,
    school_id integer NOT NULL,
    class_id integer,
    lesson_name text NOT NULL,
    exam_date text NOT NULL,
    exam_pages text,
    exam_time text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.exam_schedule OWNER TO postgres;

--
-- Name: exam_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exam_schedule_id_seq OWNER TO postgres;

--
-- Name: exam_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_schedule_id_seq OWNED BY public.exam_schedule.id;


--
-- Name: grade_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_levels (
    id integer NOT NULL,
    branch_id integer NOT NULL,
    name text NOT NULL,
    level text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.grade_levels OWNER TO postgres;

--
-- Name: grade_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grade_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grade_levels_id_seq OWNER TO postgres;

--
-- Name: grade_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grade_levels_id_seq OWNED BY public.grade_levels.id;


--
-- Name: grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grades (
    id integer NOT NULL,
    grade_level_id integer NOT NULL,
    name text NOT NULL,
    year text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.grades OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grades_id_seq OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;


--
-- Name: lesson_unlocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_unlocks (
    id integer NOT NULL,
    class_id integer NOT NULL,
    lesson_id integer NOT NULL,
    book_id integer NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lesson_unlocks OWNER TO postgres;

--
-- Name: lesson_unlocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lesson_unlocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lesson_unlocks_id_seq OWNER TO postgres;

--
-- Name: lesson_unlocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lesson_unlocks_id_seq OWNED BY public.lesson_unlocks.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    book_id integer NOT NULL,
    title text NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lessons_id_seq OWNER TO postgres;

--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    school_id integer NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    target_role text DEFAULT 'student'::text NOT NULL,
    branch_id integer,
    grade_level_id integer,
    class_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: package_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_books (
    id integer NOT NULL,
    package_id integer NOT NULL,
    book_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.package_books OWNER TO postgres;

--
-- Name: package_books_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.package_books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.package_books_id_seq OWNER TO postgres;

--
-- Name: package_books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.package_books_id_seq OWNED BY public.package_books.id;


--
-- Name: packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packages (
    id integer NOT NULL,
    title text NOT NULL,
    school_id integer,
    total_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    student_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.packages OWNER TO postgres;

--
-- Name: packages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packages_id_seq OWNER TO postgres;

--
-- Name: packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packages_id_seq OWNED BY public.packages.id;


--
-- Name: presence_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presence_log (
    id integer NOT NULL,
    student_id integer NOT NULL,
    class_id integer,
    entered_at timestamp with time zone DEFAULT now() NOT NULL,
    exited_at timestamp with time zone,
    duration_minutes integer
);


ALTER TABLE public.presence_log OWNER TO postgres;

--
-- Name: presence_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.presence_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.presence_log_id_seq OWNER TO postgres;

--
-- Name: presence_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.presence_log_id_seq OWNED BY public.presence_log.id;


--
-- Name: progress_chart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progress_chart (
    id integer NOT NULL,
    class_id integer NOT NULL,
    book_id integer NOT NULL,
    lesson_id integer NOT NULL,
    teach_date text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.progress_chart OWNER TO postgres;

--
-- Name: progress_chart_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.progress_chart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progress_chart_id_seq OWNER TO postgres;

--
-- Name: progress_chart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progress_chart_id_seq OWNED BY public.progress_chart.id;


--
-- Name: schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schools (
    id integer NOT NULL,
    name text NOT NULL,
    user_id integer,
    address text,
    phone text,
    status text DEFAULT 'inactive'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    manager_user_id integer
);


ALTER TABLE public.schools OWNER TO postgres;

--
-- Name: schools_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schools_id_seq OWNER TO postgres;

--
-- Name: schools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;


--
-- Name: student_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_progress (
    id integer NOT NULL,
    student_id integer NOT NULL,
    lesson_id integer NOT NULL,
    class_id integer,
    book_id integer,
    completed boolean DEFAULT false NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_progress OWNER TO postgres;

--
-- Name: student_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_progress_id_seq OWNER TO postgres;

--
-- Name: student_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_progress_id_seq OWNED BY public.student_progress.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    school_id integer NOT NULL,
    package_id integer NOT NULL,
    amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    discount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    balance numeric(12,2),
    payment_date timestamp with time zone DEFAULT now() NOT NULL,
    payment_method text DEFAULT 'cash'::text NOT NULL,
    notes text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'student'::text NOT NULL,
    phone text,
    status text DEFAULT 'inactive'::text NOT NULL,
    school_id integer,
    national_id text,
    gender text DEFAULT 'male'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login_at timestamp with time zone,
    parent_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: branch_managers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_managers ALTER COLUMN id SET DEFAULT nextval('public.branch_managers_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: class_books id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_books ALTER COLUMN id SET DEFAULT nextval('public.class_books_id_seq'::regclass);


--
-- Name: class_students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_students ALTER COLUMN id SET DEFAULT nextval('public.class_students_id_seq'::regclass);


--
-- Name: class_teachers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_teachers ALTER COLUMN id SET DEFAULT nextval('public.class_teachers_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content ALTER COLUMN id SET DEFAULT nextval('public.content_id_seq'::regclass);


--
-- Name: exam_schedule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_schedule ALTER COLUMN id SET DEFAULT nextval('public.exam_schedule_id_seq'::regclass);


--
-- Name: grade_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_levels ALTER COLUMN id SET DEFAULT nextval('public.grade_levels_id_seq'::regclass);


--
-- Name: grades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq'::regclass);


--
-- Name: lesson_unlocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_unlocks ALTER COLUMN id SET DEFAULT nextval('public.lesson_unlocks_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: package_books id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_books ALTER COLUMN id SET DEFAULT nextval('public.package_books_id_seq'::regclass);


--
-- Name: packages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages ALTER COLUMN id SET DEFAULT nextval('public.packages_id_seq'::regclass);


--
-- Name: presence_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presence_log ALTER COLUMN id SET DEFAULT nextval('public.presence_log_id_seq'::regclass);


--
-- Name: progress_chart id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_chart ALTER COLUMN id SET DEFAULT nextval('public.progress_chart_id_seq'::regclass);


--
-- Name: schools id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);


--
-- Name: student_progress id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress ALTER COLUMN id SET DEFAULT nextval('public.student_progress_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, lesson_count, monthly_fee, grade_level, academic_stage, is_preset, created_at, updated_at) FROM stdin;
1	ریاضی پایه هفتم	20	150000.00	هفتم	متوسطه اول	t	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
2	علوم تجربی هفتم	18	120000.00	هفتم	متوسطه اول	t	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
3	زبان انگلیسی مقدماتی	24	200000.00	عمومی	عمومی	f	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
\.


--
-- Data for Name: branch_managers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch_managers (id, user_id, branch_id, academic_year, is_active, created_at, updated_at) FROM stdin;
1	7	1	1403-1404	t	2026-05-28 14:08:29.755209+00	2026-05-28 14:08:29.755209+00
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, school_id, name, address, created_at, updated_at, manager_user_id) FROM stdin;
2	1	شعبه شمال	تهران، سعادت‌آباد	2026-05-27 21:06:57.16363+00	2026-05-27 21:06:57.16363+00	\N
1	1	شعبه مرکزی	تهران، خیابان ولیعصر	2026-05-27 21:06:57.16363+00	2026-05-28 14:08:29.751+00	7
\.


--
-- Data for Name: class_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_books (id, class_id, book_id, created_at) FROM stdin;
1	1	1	2026-05-27 21:08:07.286553+00
2	1	2	2026-05-27 21:08:07.286553+00
3	2	1	2026-05-27 21:08:07.286553+00
4	2	3	2026-05-27 21:08:07.286553+00
5	3	2	2026-05-27 21:08:07.286553+00
6	4	3	2026-05-27 21:08:07.286553+00
7	1	3	2026-05-27 21:20:54.689144+00
8	1	3	2026-05-27 21:20:59.064844+00
\.


--
-- Data for Name: class_students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_students (id, class_id, student_id, created_at) FROM stdin;
1	1	5	2026-05-27 21:07:42.368741+00
2	1	6	2026-05-27 21:07:42.368741+00
3	2	5	2026-05-27 21:07:42.368741+00
\.


--
-- Data for Name: class_teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_teachers (id, class_id, teacher_id, created_at) FROM stdin;
1	1	3	2026-05-27 21:07:47.17917+00
2	2	3	2026-05-27 21:07:47.17917+00
3	3	3	2026-05-27 21:07:47.17917+00
4	4	3	2026-05-27 21:07:47.17917+00
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, grade_id, name, capacity, created_at, updated_at) FROM stdin;
1	1	کلاس الف	25	2026-05-27 21:07:26.637447+00	2026-05-27 21:07:26.637447+00
2	1	کلاس ب	25	2026-05-27 21:07:26.637447+00	2026-05-27 21:07:26.637447+00
3	3	کلاس الف	25	2026-05-27 21:07:26.637447+00	2026-05-27 21:07:26.637447+00
4	5	کلاس الف	30	2026-05-27 21:07:26.637447+00	2026-05-27 21:07:26.637447+00
\.


--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content (id, title, type, url, file_path, api_endpoint, lesson_id, class_id, book_id, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: exam_schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_schedule (id, school_id, class_id, lesson_name, exam_date, exam_pages, exam_time, created_at, updated_at) FROM stdin;
1	1	1	ریاضی فصل اول و دوم	1403/03/15	صفحات ۱ تا ۴۵	۸ صبح	2026-05-27 21:09:14.978513+00	2026-05-27 21:09:14.978513+00
2	1	1	علوم تجربی - مبحث گیاهان	1403/03/18	صفحات ۱ تا ۳۰	۱۰ صبح	2026-05-27 21:09:14.978513+00	2026-05-27 21:09:14.978513+00
3	1	2	ریاضی پایه	1403/03/16	صفحات ۱ تا ۴۰	۸ صبح	2026-05-27 21:09:14.978513+00	2026-05-27 21:09:14.978513+00
4	1	2	زبان انگلیسی	1403/03/22	صفحات ۱ تا ۵۰	۱۰ صبح	2026-05-27 21:09:14.978513+00	2026-05-27 21:09:14.978513+00
5	1	3	علوم - مبحث جانوران	1403/03/14	صفحات ۱ تا ۳۵	۸ صبح	2026-05-27 21:09:14.978513+00	2026-05-27 21:09:14.978513+00
6	1	4	زبان انگلیسی پیشرفته	1403/03/20	صفحات ۱ تا ۶۰	۱۰ صبح	2026-05-27 21:09:14.978513+00	2026-05-27 21:09:14.978513+00
\.


--
-- Data for Name: grade_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade_levels (id, branch_id, name, level, created_at, updated_at) FROM stdin;
1	1	دبستان	1	2026-05-27 21:07:01.683253+00	2026-05-27 21:07:01.683253+00
2	2	دبستان	1	2026-05-27 21:07:01.683253+00	2026-05-27 21:07:01.683253+00
3	1	متوسطه اول	2	2026-05-27 21:07:01.683253+00	2026-05-27 21:07:01.683253+00
4	2	متوسطه اول	2	2026-05-27 21:07:01.683253+00	2026-05-27 21:07:01.683253+00
\.


--
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grades (id, grade_level_id, name, year, created_at, updated_at) FROM stdin;
1	1	پایه اول	\N	2026-05-27 21:07:12.095427+00	2026-05-27 21:07:12.095427+00
2	2	پایه اول	\N	2026-05-27 21:07:12.095427+00	2026-05-27 21:07:12.095427+00
3	1	پایه دوم	\N	2026-05-27 21:07:12.095427+00	2026-05-27 21:07:12.095427+00
4	2	پایه دوم	\N	2026-05-27 21:07:12.095427+00	2026-05-27 21:07:12.095427+00
5	3	پایه اول	\N	2026-05-27 21:07:12.095427+00	2026-05-27 21:07:12.095427+00
6	4	پایه اول	\N	2026-05-27 21:07:12.095427+00	2026-05-27 21:07:12.095427+00
\.


--
-- Data for Name: lesson_unlocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lesson_unlocks (id, class_id, lesson_id, book_id, unlocked_at) FROM stdin;
2	1	2	1	2026-05-27 21:09:30.525259+00
3	1	3	1	2026-05-27 21:09:30.525259+00
5	1	1	2	2026-05-27 21:09:30.525259+00
6	1	2	2	2026-05-27 21:09:30.525259+00
7	2	1	1	2026-05-27 21:09:30.525259+00
8	2	2	1	2026-05-27 21:09:30.525259+00
9	2	1	3	2026-05-27 21:09:30.525259+00
10	2	2	3	2026-05-27 21:09:30.525259+00
11	3	1	2	2026-05-27 21:09:30.525259+00
12	3	2	2	2026-05-27 21:09:30.525259+00
13	3	3	2	2026-05-27 21:09:30.525259+00
14	4	1	3	2026-05-27 21:09:30.525259+00
15	4	2	3	2026-05-27 21:09:30.525259+00
16	4	3	3	2026-05-27 21:09:30.525259+00
18	1	1	1	2026-05-27 21:23:10.138127+00
19	1	4	1	2026-05-28 11:22:33.163563+00
20	1	4	1	2026-05-28 11:22:34.000761+00
21	1	4	1	2026-05-28 11:22:35.280457+00
22	1	4	1	2026-05-28 11:22:35.929253+00
23	1	4	1	2026-05-28 11:22:38.098871+00
24	1	4	1	2026-05-28 11:22:38.106973+00
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lessons (id, book_id, title, order_index, description, created_at, updated_at) FROM stdin;
1	1	درس 1: فصل 1	1	محتوای درس 1	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
2	1	درس 2: فصل 2	2	محتوای درس 2	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
3	1	درس 3: فصل 3	3	محتوای درس 3	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
4	1	درس 4: فصل 4	4	محتوای درس 4	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
5	1	درس 5: فصل 5	5	محتوای درس 5	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
6	1	درس 6: فصل 6	6	محتوای درس 6	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
7	1	درس 7: فصل 7	7	محتوای درس 7	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
8	1	درس 8: فصل 8	8	محتوای درس 8	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
9	2	درس ۱: سلول‌های زنده	1	محتوای درس سلول‌های زنده	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
10	2	درس ۲: گیاهان و رشد	2	محتوای درس گیاهان و رشد	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
11	2	درس ۳: جانوران	3	محتوای درس جانوران	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
12	2	درس ۴: اکوسیستم	4	محتوای درس اکوسیستم	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
13	2	درس ۵: آب و هوا	5	محتوای درس آب و هوا	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
14	3	Lesson 1: Greetings	1	محتوای درس خوش‌آمدگویی	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
15	3	Lesson 2: Numbers	2	محتوای درس اعداد	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
16	3	Lesson 3: Colors	3	محتوای درس رنگ‌ها	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
17	3	Lesson 4: Animals	4	محتوای درس حیوانات	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
18	3	Lesson 5: Family	5	محتوای درس خانواده	2026-05-27 21:11:02.222652+00	2026-05-27 21:11:02.222652+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, school_id, title, body, target_role, branch_id, grade_level_id, class_id, created_at) FROM stdin;
1	1	اطلاعیه امتحانات پایان ترم	امتحانات پایان ترم از تاریخ ۱۵ خرداد آغاز می‌شود. برنامه دقیق امتحانات به زودی اعلام خواهد شد.	student	\N	\N	\N	2026-05-25 21:08:37.460637+00
2	1	جلسه اولیاء و مربیان	جلسه اولیاء و مربیان روز پنجشنبه ساعت ۱۶ در سالن اجتماعات مدرسه برگزار می‌شود.	student	\N	\N	\N	2026-05-22 21:08:37.460637+00
3	1	تعطیلی فوق‌العاده	مدرسه روز شنبه به مناسبت ایام فاطمیه تعطیل می‌باشد.	student	\N	\N	\N	2026-05-26 21:08:37.460637+00
4	1	پیام خوش‌آمدگویی	ثبت‌نام نیمسال جدید از هفته آینده آغاز می‌شود. لطفاً مدارک لازم را آماده نمایید.	student	\N	\N	\N	2026-05-20 21:08:37.460637+00
5	1	مسابقات ورزشی درون‌مدرسه‌ای	مسابقات ورزشی دانش‌آموزی روز سه‌شنبه در زمین ورزش برگزار می‌شود.	student	\N	\N	\N	2026-05-24 21:08:37.460637+00
\.


--
-- Data for Name: package_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_books (id, package_id, book_id, created_at) FROM stdin;
\.


--
-- Data for Name: packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.packages (id, title, school_id, total_price, student_count, created_at, updated_at) FROM stdin;
1	پکیج پایه هفتم	\N	400000.00	30	2026-05-27 16:05:42.208141+00	2026-05-27 16:05:42.208141+00
\.


--
-- Data for Name: presence_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.presence_log (id, student_id, class_id, entered_at, exited_at, duration_minutes) FROM stdin;
1	5	1	2026-05-25 21:08:11.655901+00	2026-05-25 21:53:11.655901+00	45
2	5	1	2026-05-26 21:08:11.655901+00	2026-05-26 22:08:11.655901+00	60
3	5	1	2026-05-27 18:08:11.655901+00	2026-05-27 20:08:11.655901+00	120
4	6	1	2026-05-24 21:08:11.655901+00	2026-05-24 21:38:11.655901+00	30
5	6	1	2026-05-26 21:08:11.655901+00	2026-05-26 21:58:11.655901+00	50
\.


--
-- Data for Name: progress_chart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progress_chart (id, class_id, book_id, lesson_id, teach_date, created_at, updated_at) FROM stdin;
1	1	1	1	2026-05-24	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
2	1	1	2	2026-05-21	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
3	1	1	3	2026-05-18	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
4	1	1	4	2026-05-15	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
5	1	1	5	2026-05-12	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
6	1	1	6	2026-05-09	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
7	1	1	7	2026-05-06	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
8	1	1	8	2026-05-03	2026-05-27 21:11:06.492332+00	2026-05-27 21:11:06.492332+00
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (id, name, user_id, address, phone, status, created_at, updated_at, manager_user_id) FROM stdin;
1	مدرسه نمونه اوکید	\N	تهران، خیابان ولیعصر	021-12345678	active	2026-05-27 16:05:41.990521+00	2026-05-28 11:10:15.018+00	2
\.


--
-- Data for Name: student_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_progress (id, student_id, lesson_id, class_id, book_id, completed, score, completed_at, created_at, updated_at) FROM stdin;
1	5	1	1	1	t	10	2026-05-22 21:08:16.140538+00	2026-05-27 21:08:16.140538+00	2026-05-27 21:08:16.140538+00
2	5	2	1	1	t	10	2026-05-23 21:08:16.140538+00	2026-05-27 21:08:16.140538+00	2026-05-27 21:08:16.140538+00
3	5	3	1	1	t	10	2026-05-24 21:08:16.140538+00	2026-05-27 21:08:16.140538+00	2026-05-27 21:08:16.140538+00
4	5	1	1	2	t	10	2026-05-23 21:08:16.140538+00	2026-05-27 21:08:16.140538+00	2026-05-27 21:08:16.140538+00
5	5	2	1	2	t	10	2026-05-24 21:08:16.140538+00	2026-05-27 21:08:16.140538+00	2026-05-27 21:08:16.140538+00
6	6	1	1	1	t	10	2026-05-25 21:08:16.140538+00	2026-05-27 21:08:16.140538+00	2026-05-27 21:08:16.140538+00
7	6	2	1	1	t	10	2026-05-26 21:08:16.140538+00	2026-05-27 21:08:16.140538+00	2026-05-27 21:08:16.140538+00
8	6	3	\N	1	t	10	\N	2026-05-27 21:27:32.322706+00	2026-05-27 21:27:32.322706+00
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, school_id, package_id, amount, discount, balance, payment_date, payment_method, notes, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, phone, status, school_id, national_id, gender, created_at, updated_at, last_login_at, parent_id) FROM stdin;
6	فاطمه کریمی	student2@okidd.com	$2b$10$dtHYXpUlSZB6ypZByGeBbONP58tsAX2OEheIcS3cXtv/uYyGMrANC	student	\N	active	1	\N	female	2026-05-27 16:05:42.208141+00	2026-05-27 21:26:39.063+00	2026-05-27 21:26:39.062+00	4
5	علی محمدی	student@okidd.com	$2b$10$dtHYXpUlSZB6ypZByGeBbONP58tsAX2OEheIcS3cXtv/uYyGMrANC	student	\N	active	1	\N	male	2026-05-27 16:05:42.208141+00	2026-05-28 11:18:10.805+00	2026-05-28 11:18:10.805+00	4
4	سارا احمدی	parent@okidd.com	$2b$10$dtHYXpUlSZB6ypZByGeBbONP58tsAX2OEheIcS3cXtv/uYyGMrANC	parent	\N	active	1	\N	female	2026-05-27 16:05:42.208141+00	2026-05-28 11:19:34.472+00	2026-05-28 11:19:34.472+00	\N
3	استاد علی رضایی	teacher@okidd.com	$2b$10$dtHYXpUlSZB6ypZByGeBbONP58tsAX2OEheIcS3cXtv/uYyGMrANC	teacher	\N	active	1	\N	male	2026-05-27 16:05:42.208141+00	2026-05-28 11:20:45.196+00	2026-05-28 11:20:45.196+00	\N
1	مدیر کل سیستم	admin@okidd.com	$2b$10$dtHYXpUlSZB6ypZByGeBbONP58tsAX2OEheIcS3cXtv/uYyGMrANC	admin	\N	active	\N	\N	male	2026-05-27 16:05:42.208141+00	2026-05-28 12:23:42.931+00	2026-05-28 12:23:42.931+00	\N
2	مدیر مدرسه	school@okidd.com	$2b$10$dtHYXpUlSZB6ypZByGeBbONP58tsAX2OEheIcS3cXtv/uYyGMrANC	school_manager	\N	active	1	\N	male	2026-05-27 16:05:42.208141+00	2026-05-28 14:07:53.141+00	2026-05-28 14:07:53.14+00	\N
7	مدیر شعبه مرکزی	branch@okidd.com	$2b$10$72Pr05jrfeDhNqmu/zlP4.MtFVDxAk9hOC2TOl7V7GMtkWPm7x0Qm	branch_manager	\N	active	1	\N	male	2026-05-28 14:08:22.340691+00	2026-05-28 14:09:03.856+00	2026-05-28 14:09:03.856+00	\N
\.


--
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.books_id_seq', 3, true);


--
-- Name: branch_managers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_managers_id_seq', 1, true);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 2, true);


--
-- Name: class_books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_books_id_seq', 8, true);


--
-- Name: class_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_students_id_seq', 3, true);


--
-- Name: class_teachers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_teachers_id_seq', 4, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classes_id_seq', 4, true);


--
-- Name: content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.content_id_seq', 1, false);


--
-- Name: exam_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_schedule_id_seq', 6, true);


--
-- Name: grade_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grade_levels_id_seq', 4, true);


--
-- Name: grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grades_id_seq', 6, true);


--
-- Name: lesson_unlocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lesson_unlocks_id_seq', 24, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lessons_id_seq', 18, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 5, true);


--
-- Name: package_books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.package_books_id_seq', 1, false);


--
-- Name: packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.packages_id_seq', 1, true);


--
-- Name: presence_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.presence_log_id_seq', 5, true);


--
-- Name: progress_chart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progress_chart_id_seq', 8, true);


--
-- Name: schools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schools_id_seq', 1, true);


--
-- Name: student_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_progress_id_seq', 8, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: branch_managers branch_managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_managers
    ADD CONSTRAINT branch_managers_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: class_books class_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_books
    ADD CONSTRAINT class_books_pkey PRIMARY KEY (id);


--
-- Name: class_students class_students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_students
    ADD CONSTRAINT class_students_pkey PRIMARY KEY (id);


--
-- Name: class_teachers class_teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_teachers
    ADD CONSTRAINT class_teachers_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- Name: exam_schedule exam_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_schedule
    ADD CONSTRAINT exam_schedule_pkey PRIMARY KEY (id);


--
-- Name: grade_levels grade_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_levels
    ADD CONSTRAINT grade_levels_pkey PRIMARY KEY (id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: lesson_unlocks lesson_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_unlocks
    ADD CONSTRAINT lesson_unlocks_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: package_books package_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_books
    ADD CONSTRAINT package_books_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: presence_log presence_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presence_log
    ADD CONSTRAINT presence_log_pkey PRIMARY KEY (id);


--
-- Name: progress_chart progress_chart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_chart
    ADD CONSTRAINT progress_chart_pkey PRIMARY KEY (id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict eEg6tKH6NcubgyCvxltrZOVIhwnHL4RNWMnGv2Lxgdf9kfhLDZQfNlHyCPqblTR

