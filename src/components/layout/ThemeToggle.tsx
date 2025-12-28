import { Sun, Moon, Orbit } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useEffect } from 'react';
import '../../styles/theme-toggle.css';

const ThemeToggle = () => {
    const { theme, setTheme } = useAppStore();

    // Apply theme on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const cycleTheme = () => {
        const themes: Array<'light' | 'dark' | 'orbital'> = ['light', 'dark', 'orbital'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    return (
        <button
            className="theme-toggle"
            onClick={cycleTheme}
            title={`Tema actual: ${theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Orbital'}`}
            aria-label="Cambiar tema"
        >
            <span className="theme-icon theme-icon-light">
                <Sun size={20} />
            </span>
            <span className="theme-icon theme-icon-dark">
                <Moon size={20} />
            </span>
            <span className="theme-icon theme-icon-orbital">
                <Orbit size={20} />
            </span>
        </button>
    );
};

export default ThemeToggle;
