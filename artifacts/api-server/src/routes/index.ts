import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter, { requireAuth } from "./auth";
import contentRouter, { contentFilesRouter } from "./content";
import usersRouter from "./users";
import schoolsRouter from "./schools";
import branchesRouter from "./branches";
import branchManagersRouter from "./branchManagers";
import gradeLevelsRouter from "./gradeLevels";
import gradesRouter from "./grades";
import classesRouter from "./classes";
import booksRouter from "./books";
import lessonsRouter from "./lessons";
import bookOrdersRouter from "./bookOrders";
import walletRouter from "./wallet";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import examScheduleRouter from "./examSchedule";
import progressChartRouter from "./progressChart";
import studentProgressRouter from "./studentProgress";
import consultantsRouter from "./consultants";
import consultationsRouter from "./consultations";
import gameScoresRouter from "./gameScores";
import schoolReportRouter from "./schoolReport";
import schoolTeachersRouter from "./schoolTeachers";
import studentEnrollmentsRouter from "./studentEnrollments";
import parentStudentsRouter from "./parentStudents";
import classSchedulesRouter from "./classSchedules";
import classSessionsRouter from "./classSessions";
import transactionsRouter from "./transactions";

const router: IRouter = Router();

// ── Public routes — no JWT required ──────────────────────────────────────────
router.use(healthRouter);
router.use(authRouter);           // /auth/login  /auth/me
router.use(contentFilesRouter);   // /content/files/:filename  (browsers can't send auth headers for media)

// ── Global JWT guard — all routes below require a valid token ─────────────────
router.use(requireAuth);

// ── Protected routes ──────────────────────────────────────────────────────────
router.use(usersRouter);
router.use(schoolsRouter);
router.use(branchesRouter);
router.use(branchManagersRouter);
router.use(gradeLevelsRouter);
router.use(gradesRouter);
router.use(classesRouter);
router.use(booksRouter);
router.use(lessonsRouter);
router.use(bookOrdersRouter);
router.use(walletRouter);
router.use(contentRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(examScheduleRouter);
router.use(progressChartRouter);
router.use(studentProgressRouter);
router.use(consultantsRouter);
router.use(consultationsRouter);
router.use(gameScoresRouter);
router.use(schoolReportRouter);
router.use(schoolTeachersRouter);
router.use(studentEnrollmentsRouter);
router.use(parentStudentsRouter);
router.use(classSchedulesRouter);
router.use(classSessionsRouter);
router.use(transactionsRouter);

export default router;
