import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === 'dark'}
            className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                theme === 'dark' ? 'bg-primary' : 'bg-surface-variant'
            }`}
            aria-label={`Passa al tema ${theme === 'light' ? 'scuro' : 'chiaro'}`}
        >
            <span
                className={`inline-block h-6 w-6 transform rounded-full bg-on-primary transition-transform ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                } flex items-center justify-center`}
            >
                 <span className="material-symbols-outlined text-sm text-primary">
                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
            </span>
        </button>
    );
};

export default ThemeToggle;