/**
 * Centralized error-handling middleware for Express.
 * Catches all errors thrown in route handlers/services and
 * returns a consistent JSON error response.
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error(`[Error] ${err.message}`, err.stack);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }

    // Unexpected / unhandled errors
    res.status(500).json({
        error: "Internal Server Error",
    });
};
