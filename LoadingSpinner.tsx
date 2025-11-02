
import React from 'react';
import { ShieldCheckIcon } from './icons/Icons';

export const LoadingSpinner: React.FC = () => {
    const messages = [
        "Analyzing linguistic patterns...",
        "Cross-referencing with fact-check databases...",
        "Detecting emotional sentiment and bias...",
        "Verifying source reputation...",
        "Scanning for logical fallacies...",
        "Compiling credibility report...",
    ];

    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setMessage(messages[index]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center h-full py-16">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 rounded-full animate-pulse-bg"></div>
                <div className="absolute inset-2 border-4 border-primary-500 rounded-full animate-spin-slow opacity-50" style={{ animation: 'spin 3s linear infinite' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheckIcon className="w-16 h-16 text-primary-500 animate-scan-glow" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">Analyzing Content</h2>
            <p className="text-slate-600 dark:text-slate-300 mt-2 transition-opacity duration-500 w-64 h-5">{message}</p>
        </div>
    );
};
