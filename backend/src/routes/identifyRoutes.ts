/**
 * Route definitions for the identity reconciliation API.
 */

import { Router } from "express";
import { identify } from "../controllers/identifyController";

const router = Router();

// POST /identify — reconcile a customer's identity
router.post("/identify", identify);

export default router;
