/**
 * Identity Reconciliation Service
 *
 * Core business logic for linking customer identities.
 * This is the heart of the application — it resolves which contacts
 * belong to the same person and maintains primary/secondary relationships.
 *
 * ─── RECONCILIATION ALGORITHM ───────────────────────────────────────
 *
 * 1. Search for any existing contacts where email OR phoneNumber matches.
 *
 * 2. NO MATCHES → Create a new "primary" contact and return.
 *
 * 3. MATCHES FOUND →
 *    a. Collect all distinct primary IDs (resolve through linkedId chains).
 *    b. If multiple primaries exist, the OLDEST becomes the single primary;
 *       all other primaries are demoted to secondary and re-linked.
 *    c. If the incoming request carries new information (an email or phone
 *       not yet seen), a new "secondary" contact is created.
 *    d. Build the consolidated response from the final primary + all its
 *       secondary contacts.
 *
 * ────────────────────────────────────────────────────────────────────
 */

import { Contact } from "@prisma/client";
import prisma from "../prisma/client";
import { IdentifyResponse, AppError } from "../types";

/**
 * Main entry point — accepts an email and/or phoneNumber and returns
 * the consolidated identity for the person.
 */
export const identifyContact = async (
    email: string | null | undefined,
    phoneNumber: string | null | undefined
): Promise<IdentifyResponse> => {
    // Validate: at least one identifier must be provided
    if (!email && !phoneNumber) {
        throw new AppError(
            "At least one of email or phoneNumber must be provided",
            400
        );
    }

    // Normalise inputs (treat empty strings as null)
    const normalizedEmail = email?.trim() || null;
    const normalizedPhone = phoneNumber?.trim() || null;

    // ── Step 1: Find existing contacts matching email OR phoneNumber ──
    const existingContacts = await findMatchingContacts(
        normalizedEmail,
        normalizedPhone
    );

    // ── Step 2: No matches → create a brand-new primary contact ──
    if (existingContacts.length === 0) {
        const newContact = await prisma.contact.create({
            data: {
                email: normalizedEmail,
                phoneNumber: normalizedPhone,
                linkPrecedence: "primary",
            },
        });
        return buildResponse(newContact, []);
    }

    // ── Step 3: Matches exist → reconcile identities ──
    // 3a. Resolve all unique primary contact IDs
    const primaryIds = await resolvePrimaryIds(existingContacts);

    // 3b. Merge clusters if more than one primary was found
    const primaryId = await mergePrimaryClusters(primaryIds);

    // 3c. Create a secondary contact if the request has new information
    await createSecondaryIfNewInfo(primaryId, normalizedEmail, normalizedPhone);

    // 3d. Build the final consolidated response
    return buildConsolidatedResponse(primaryId);
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Find all contacts where the email or phoneNumber matches.
 * Builds a dynamic OR query depending on which fields are provided.
 */
async function findMatchingContacts(
    email: string | null,
    phoneNumber: string | null
): Promise<Contact[]> {
    const conditions: Array<{ email?: string; phoneNumber?: string }> = [];

    if (email) conditions.push({ email });
    if (phoneNumber) conditions.push({ phoneNumber });

    if (conditions.length === 0) return [];

    return prisma.contact.findMany({
        where: {
            OR: conditions,
            deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
    });
}

/**
 * Given a list of contacts, resolve each one's ultimate primary ID.
 * A secondary contact points to its primary via `linkedId`.
 * Returns a deduplicated, sorted (oldest-first) list of primary IDs.
 */
async function resolvePrimaryIds(contacts: Contact[]): Promise<number[]> {
    const primaryIdSet = new Set<number>();

    for (const contact of contacts) {
        if (contact.linkPrecedence === "primary") {
            primaryIdSet.add(contact.id);
        } else if (contact.linkedId !== null) {
            // Follow the link to the primary
            primaryIdSet.add(contact.linkedId);
        }
    }

    // Sort by ID ascending to ensure the oldest (lowest auto-increment) is first
    return Array.from(primaryIdSet).sort((a, b) => a - b);
}

/**
 * If multiple primary contacts were discovered, the oldest one (smallest ID)
 * stays primary. All others are demoted to secondary and their entire cluster
 * is re-linked to the winner.
 *
 * Returns the single surviving primary ID.
 */
async function mergePrimaryClusters(primaryIds: number[]): Promise<number> {
    if (primaryIds.length <= 1) {
        return primaryIds[0];
    }

    // The oldest primary wins
    const [winningPrimaryId, ...losingPrimaryIds] = primaryIds;

    for (const losingId of losingPrimaryIds) {
        // Demote the losing primary → secondary
        await prisma.contact.update({
            where: { id: losingId },
            data: {
                linkPrecedence: "secondary",
                linkedId: winningPrimaryId,
            },
        });

        // Re-link all secondaries that were pointing at the losing primary
        await prisma.contact.updateMany({
            where: {
                linkedId: losingId,
                deletedAt: null,
            },
            data: {
                linkedId: winningPrimaryId,
            },
        });
    }

    return winningPrimaryId;
}

/**
 * Check whether the incoming email or phoneNumber introduces genuinely
 * new information (i.e. not already stored in the cluster).
 * If so, create a new secondary contact linked to the primary.
 */
async function createSecondaryIfNewInfo(
    primaryId: number,
    email: string | null,
    phoneNumber: string | null
): Promise<void> {
    // Fetch the full cluster — primary + all its secondaries
    const clusterContacts = await prisma.contact.findMany({
        where: {
            OR: [{ id: primaryId }, { linkedId: primaryId }],
            deletedAt: null,
        },
    });

    const existingEmails = new Set(
        clusterContacts.map((c) => c.email).filter(Boolean)
    );
    const existingPhones = new Set(
        clusterContacts.map((c) => c.phoneNumber).filter(Boolean)
    );

    const hasNewEmail = email !== null && !existingEmails.has(email);
    const hasNewPhone = phoneNumber !== null && !existingPhones.has(phoneNumber);

    // Only create a secondary if there is genuinely new information
    if (hasNewEmail || hasNewPhone) {
        await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkedId: primaryId,
                linkPrecedence: "secondary",
            },
        });
    }
}

/**
 * Build the final consolidated response for a given primary ID.
 * Gathers the primary contact + all its secondaries and assembles:
 *   - emails (primary's email first, then secondaries, deduplicated)
 *   - phoneNumbers (primary's phone first, then secondaries, deduplicated)
 *   - secondaryContactIds
 */
async function buildConsolidatedResponse(
    primaryId: number
): Promise<IdentifyResponse> {
    const primary = await prisma.contact.findUnique({
        where: { id: primaryId },
    });

    if (!primary) {
        throw new AppError("Primary contact not found", 500);
    }

    const secondaries = await prisma.contact.findMany({
        where: {
            linkedId: primaryId,
            deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
    });

    return buildResponse(primary, secondaries);
}

/**
 * Pure helper that assembles the IdentifyResponse from a primary
 * contact and its list of secondary contacts.
 */
function buildResponse(
    primary: Contact,
    secondaries: Contact[]
): IdentifyResponse {
    // Collect emails: primary first, then secondaries, deduplicated
    const emails: string[] = [];
    if (primary.email) emails.push(primary.email);
    for (const sec of secondaries) {
        if (sec.email && !emails.includes(sec.email)) {
            emails.push(sec.email);
        }
    }

    // Collect phone numbers: primary first, then secondaries, deduplicated
    const phoneNumbers: string[] = [];
    if (primary.phoneNumber) phoneNumbers.push(primary.phoneNumber);
    for (const sec of secondaries) {
        if (sec.phoneNumber && !phoneNumbers.includes(sec.phoneNumber)) {
            phoneNumbers.push(sec.phoneNumber);
        }
    }

    const secondaryContactIds = secondaries.map((s) => s.id);

    return {
        contact: {
            primaryContatctId: primary.id,
            emails,
            phoneNumbers,
            secondaryContactIds,
        },
    };
}
