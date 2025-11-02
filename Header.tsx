import React, { useState } from 'react';
import { ShieldCheckIcon, SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from './icons/Icons';
import { View, Theme } from '../App';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    theme: Theme;
    toggleTheme: () => void;
    onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, theme, toggleTheme, onReset }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleMobileLinkClick = (view: View) => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
    };
    
    const NavLink: React.FC<{view: View, children: React.ReactNode}> = ({ view, children }) => {
        const isActive = currentView === view;
        return (
            <button 
                onClick={() => setCurrentView(view)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-white' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
                {children}
            </button>
        );
    };

    const MobileNavLink: React.FC<{view: View, children: React.ReactNode}> = ({ view, children }) => {
        const isActive = currentView === view;
        return (
            <button 
                onClick={() => handleMobileLinkClick(view)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive 
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-white' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
                {children}
            </button>
        );
    };


    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <button onClick={onReset} className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                        <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
                        <span className="ml-3 text-xl font-bold text-slate-800 dark:text-white">Trust AI</span>
                    </button>
                    <div className="flex items-center">
                        <div className="hidden sm:flex items-center space-x-2">
                            <NavLink view="analyzer">Analyzer</NavLink>
                            <NavLink view="learn">Learn</NavLink>
                            <NavLink view="transparency">Transparency</NavLink>
                            <NavLink view="history">History</NavLink>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-2 ml-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                        </button>
                        <div className="sm:hidden ml-2">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                                aria-controls="mobile-menu"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state. */}
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden border-t border-slate-200 dark:border-slate-700`} id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <MobileNavLink view="analyzer">Analyzer</MobileNavLink>
                    <MobileNavLink view="learn">Learn</MobileNavLink>
                    <MobileNavLink view="transparency">Transparency</MobileNavLink>
                    <MobileNavLink view="history">History</MobileNavLink>
                </div>
            </div>
        </header>
    );
};