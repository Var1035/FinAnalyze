
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

export type Language = 'en' | 'te' | 'hi';

const translations = { en, te, hi };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'fin_health_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load saved language preference
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved && ['en', 'te', 'hi'].includes(saved)) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
    };

    // Translation function - supports nested keys like "dashboard.title"
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English
                value = translations['en'];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Return key if not found
                    }
                }
                break;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// Language selector component
export const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
        { code: 'hi', label: 'हिंदी', flag: '🇮🇳' }
    ];

    return (
        <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-secondary/50 text-primary text-sm rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
            title="Select Language"
        >
            {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                </option>
            ))}
        </select>
    );
};
