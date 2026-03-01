/**
 * HomePage — main page composing the IdentifyForm and ResponseDisplay components.
 */

import { useState } from "react";
import type { IdentifyResponse } from "../types";
import IdentifyForm from "../components/IdentifyForm";
import ResponseDisplay from "../components/ResponseDisplay";

export default function HomePage() {
    const [result, setResult] = useState<IdentifyResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleResult = (data: IdentifyResponse) => {
        setResult(data);
        setError(null);
    };

    const handleError = (message: string) => {
        setError(message);
        setResult(null);
    };

    const handleClear = () => {
        setResult(null);
        setError(null);
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <header className="hero">
                <div className="hero-glow" />
                <h1>
                    <span className="hero-accent">Identity</span> Reconciliation
                </h1>
                <p className="hero-subtitle">
                    Resolve and link customer identities across multiple purchases.
                    Enter an email and/or phone number to reconcile.
                </p>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <section className="form-section">
                    <h2>Identify Contact</h2>
                    <IdentifyForm
                        onResult={handleResult}
                        onError={handleError}
                        onClear={handleClear}
                    />
                </section>

                <section className="result-section">
                    <ResponseDisplay result={result} error={error} />
                </section>
            </main>
        </div>
    );
}
