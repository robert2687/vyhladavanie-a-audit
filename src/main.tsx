import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {Login} from './components/Login.tsx';
import {AuthProvider, useAuth} from './context/AuthContext.tsx';
import {Building2} from 'lucide-react';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';

function Splash() {
  return (
    <div className="min-h-screen bg-stone-100/70 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md">
        <Building2 className="w-6 h-6 text-blue-100" />
      </div>
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Root() {
  const {user, loading} = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Login />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider><AuthProvider>
      <Root />
    </AuthProvider></LanguageProvider>
  </StrictMode>,
);
