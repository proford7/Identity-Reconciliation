/**
 * Shared TypeScript types for the Identity Reconciliation frontend.
 */

/** Request body for POST /identify */
export interface IdentifyRequest {
    email?: string;
    phoneNumber?: string;
}

/** Shape of the consolidated contact in the API response */
export interface ContactResponse {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
}

/** Full API response from POST /identify */
export interface IdentifyResponse {
    contact: ContactResponse;
}
