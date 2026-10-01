"use client";

import { useEffect } from "react";

export function UpdateChecker() {
    useEffect(() => {
        const checkUpdates = async () => {
            try {
                const res = await fetch('/api/system/check-updates', { method: 'POST' });
                if (!res.ok) return;
                
                const text = await res.text();
                if (!text) return;
                
                const json = JSON.parse(text);
                console.log("UpdateChecker: Result", json);
            } catch (error) {
                // Silently handle update check failures
            }
        };

        checkUpdates();
    }, []);

    return null; // Invisible component
}
