/**
 * IdentifyForm — form component for submitting email & phoneNumber
 * to the identity reconciliation endpoint.
 */

import { useState } from "react";
import type { IdentifyRequest, IdentifyResponse } from "../types";
import { identifyContact } from "../services/api";
import axios from "axios";

interface IdentifyFormProps {
    onResult: (result: IdentifyResponse) => void;
    onError: (error: string) => void;
    onClear: () => void;
}

export default function IdentifyForm({
    onResult,
    onError,
    onClear,
}: IdentifyFormProps) {
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onClear();

        if (!email.trim() && !phoneNumber.trim()) {
            onError("Please provide at least an email or phone number.");
            return;
        }

        const payload: IdentifyRequest = {};
        if (email.trim()) payload.email = email.trim();
        if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();

        setLoading(true);
        try {
            const result = await identifyContact(payload);
            onResult(result);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const message =
                    err.response?.data?.error ||
                    err.message ||
                    "Something went wrong.";
                onError(message);
            } else {
                onError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setEmail("");
        setPhoneNumber("");
        onClear();
    };

    return (
        <form className="identify-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    placeholder="e.g. jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                    id="phoneNumber"
                    type="text"
                    placeholder="e.g. +1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                />
            </div>

            <div className="form-actions">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    id="submit-btn"
                >
                    {loading ? (
                        <span className="btn-loading">
                            <span className="spinner" />
                            Identifying...
                        </span>
                    ) : (
                        "Identify"
                    )}
                </button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={loading}
                    id="reset-btn"
                >
                    Reset
                </button>
            </div>
        </form>
    );
}
