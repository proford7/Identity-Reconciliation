/**
 * Type definitions for the Identity Reconciliation system.
 */

/** Incoming request body for POST /identify */
export interface IdentifyRequest {
    email?: string | null;
    phoneNumber?: string | null;
}

/** The consolidated contact object returned in the response */
export interface ContactResponse {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
}

/** Full response shape for POST /identify */
export interface IdentifyResponse {
    contact: ContactResponse;
}

/** Custom application error with HTTP status */
export class AppError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
