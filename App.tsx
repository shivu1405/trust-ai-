import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Analyzer } from './components/Analyzer';
import { Learn } from './components/Learn';
import { Transparency } from './components/Transparency';
import { History } from './components/History';
import { QuickNavChatbox } from './components/QuickNavChatbox';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Report } from './components/Report';
import { AnalysisResult, ReportData, NavAction, HistoryItem } from './types';

export type View = 'analyzer' | 'learn' | 'transparency' | 'history';
export type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('analyzer');
    const [theme, setTheme] = useState<Theme>('light');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({ report: null, error: null });
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    // Load theme and history from local storage on initial render
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        
        try {
            const storedHistory = localStorage.getItem('analysisHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to parse history from localStorage:", error);
            localStorage.removeItem('analysisHistory');
        }
    }, []);

    // Update class and local storage when theme changes
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
    const handleAnalysisStart = () => {
        setIsLoading(true);
        setAnalysisResult({ report: null, error: null });
    };

    const handleAnalysisComplete = (result: AnalysisResult, inputSummary: string) => {
        setAnalysisResult(result);
        setIsLoading(false);
        
        if (result.report) {
            const newHistoryItem: HistoryItem = {
                id: Date.now(),
                inputSummary: inputSummary,
                report: result.report,
            };
            setHistory(prevHistory => {
                const updatedHistory = [newHistoryItem, ...prevHistory];
                localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
                return updatedHistory;
            });
        }
    };
    
    const handleViewReportFromHistory = (report: ReportData) => {
        setAnalysisResult({ report, error: null });
        setCurrentView('analyzer'); // Switch to the main view area to show the report
    };

    const handleClearHistory = () => {
        setHistory([]);
        localStorage.removeItem('analysisHistory');
    };

    const handleReset = () => {
        setAnalysisResult({ report: null, error: null });
        setCurrentView('analyzer');
    };

    const handleNavAction = (action: NavAction) => {
        if (action.action === 'navigate' && action.value.target) {
            setCurrentView(action.value.target as View);
        } else if (action.action === 'toggle_theme') {
            toggleTheme();
        } else if (action.action === 'set_input_type') {
            handleReset();
        }
    };
    
    const renderContent = () => {
        if (currentView === 'learn') return <Learn />;
        if (currentView === 'transparency') return <Transparency />;
        if (currentView === 'history') return <History history={history} onViewReport={handleViewReportFromHistory} onClearHistory={handleClearHistory} />;

        if (isLoading) return <LoadingSpinner />;
        if (analysisResult.report) return <Report report={analysisResult.report} onReset={handleReset} />;
        
        return <Analyzer 
                    onAnalysisStart={handleAnalysisStart}
                    onAnalysisComplete={handleAnalysisComplete} 
                    initialError={analysisResult.error}
                />;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen font-sans transition-colors duration-300">
            <Header 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                theme={theme}
                toggleTheme={toggleTheme}
                onReset={handleReset}
            />
            <main className="py-10 px-4 sm:px-6 lg:px-8">
                {renderContent()}
            </main>
            <QuickNavChatbox onNavAction={handleNavAction} />
        </div>
    );
};

export default App;