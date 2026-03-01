/**
 * ResponseDisplay — renders the reconciled contact result
 * from the /identify endpoint in a structured card layout.
 */

import type { IdentifyResponse } from "../types";

interface ResponseDisplayProps {
    result: IdentifyResponse | null;
    error: string | null;
}

export default function ResponseDisplay({
    result,
    error,
}: ResponseDisplayProps) {
    if (error) {
        return (
            <div className="response-card error-card" id="error-display">
                <div className="card-header error-header">
                    <span className="status-icon">✕</span>
                    Error
                </div>
                <p className="error-message">{error}</p>
            </div>
        );
    }

    if (!result) return null;

    const { contact } = result;

    return (
        <div className="response-card success-card" id="result-display">
            <div className="card-header success-header">
                <span className="status-icon">✓</span>
                Identity Resolved
            </div>

            <div className="result-grid">
                {/* Primary Contact ID */}
                <div className="result-item">
                    <span className="result-label">Primary Contact ID</span>
                    <span className="result-value highlight">
                        #{contact.primaryContatctId}
                    </span>
                </div>

                {/* Emails */}
                <div className="result-item">
                    <span className="result-label">Emails</span>
                    <div className="tag-list">
                        {contact.emails.length > 0 ? (
                            contact.emails.map((email, i) => (
                                <span
                                    key={i}
                                    className={`tag ${i === 0 ? "tag-primary" : "tag-secondary"}`}
                                >
                                    {email}
                                    {i === 0 && (
                                        <span className="tag-badge">primary</span>
                                    )}
                                </span>
                            ))
                        ) : (
                            <span className="empty-value">—</span>
                        )}
                    </div>
                </div>

                {/* Phone Numbers */}
                <div className="result-item">
                    <span className="result-label">Phone Numbers</span>
                    <div className="tag-list">
                        {contact.phoneNumbers.length > 0 ? (
                            contact.phoneNumbers.map((phone, i) => (
                                <span
                                    key={i}
                                    className={`tag ${i === 0 ? "tag-primary" : "tag-secondary"}`}
                                >
                                    {phone}
                                    {i === 0 && (
                                        <span className="tag-badge">primary</span>
                                    )}
                                </span>
                            ))
                        ) : (
                            <span className="empty-value">—</span>
                        )}
                    </div>
                </div>

                {/* Secondary IDs */}
                <div className="result-item">
                    <span className="result-label">Secondary Contact IDs</span>
                    <div className="tag-list">
                        {contact.secondaryContactIds.length > 0 ? (
                            contact.secondaryContactIds.map((id) => (
                                <span key={id} className="tag tag-id">
                                    #{id}
                                </span>
                            ))
                        ) : (
                            <span className="empty-value">None</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Raw JSON */}
            <details className="raw-json">
                <summary>View Raw JSON</summary>
                <pre>{JSON.stringify(result, null, 2)}</pre>
            </details>
        </div>
    );
}
