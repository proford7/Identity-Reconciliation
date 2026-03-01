/**
 * Controller for the /identify endpoint.
 * Handles request validation and delegates to the service layer.
 */

import { Request, Response, NextFunction } from "express";
import { identifyContact } from "../services/identifyService";
import { IdentifyRequest, AppError } from "../types";

export const identify = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, phoneNumber } = req.body as IdentifyRequest;

        // Validate: at least one identifier must be provided
        if (!email && !phoneNumber) {
            throw new AppError(
                "At least one of email or phoneNumber must be provided",
                400
            );
        }

        const result = await identifyContact(email, phoneNumber);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
