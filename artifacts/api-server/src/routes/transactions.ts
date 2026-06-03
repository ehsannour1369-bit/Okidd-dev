import { Router } from "express";

const router = Router();

router.get("/transactions", (_req, res) => { res.json([]); });
router.post("/transactions", (_req, res) => { res.status(201).json({}); });
router.put("/transactions/:id", (_req, res) => { res.json({}); });
router.delete("/transactions/:id", (_req, res) => { res.status(204).end(); });

export default router;
