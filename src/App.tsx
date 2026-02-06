import { useState } from 'react';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { LanguageProvider, LanguageSelector } from './contexts/LanguageContext';

type AppMode = 'upload' | 'dashboard';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [mode, setMode] = useState<AppMode>('upload');
  const [darkMode, setDarkMode] = useState(false);

  // Toggle Dark Mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onBack={() => { }} />;
  }

  return (
    <div className={`min-h-screen bg-primary transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {/* Navbar / Top Bar */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 font-bold text-xl cursor-pointer text-primary"
            onClick={() => setMode('dashboard')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <span>FinAnalyze</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode(mode === 'upload' ? 'dashboard' : 'upload')}
              className="text-sm font-medium text-secondary hover:text-primary transition-colors hidden md:block"
            >
              {mode === 'upload' ? 'View Dashboard' : 'Upload Data'}
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>

            {/* Language Selector */}
            <LanguageSelector />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-secondary transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-secondary transition-colors text-red-500 hover:text-red-600"
              aria-label="Sign Out"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        {mode === 'upload' ? (
          <Upload onSuccess={() => setMode('dashboard')} />
        ) : (
          <Dashboard onUploadNew={() => setMode('upload')} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;

