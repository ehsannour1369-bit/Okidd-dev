import { Router } from "express";

const router = Router();

router.get("/license-transactions", (_req, res) => { res.json([]); });
router.post("/license-transactions", (_req, res) => { res.status(201).json({}); });
router.delete("/license-transactions/:id", (_req, res) => { res.status(204).end(); });

export default router;
