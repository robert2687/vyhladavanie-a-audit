import React, { useState } from "react";
import { Building2, Mail, Lock, User, LogIn, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Login: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err: any) {
      setError(err?.message || "Prihlásenie zlyhalo. Skúste to znova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 flex flex-col items-center justify-center px-4 py-10 selection:bg-blue-100">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md ring-1 ring-blue-900/10 mb-3">
            <Building2 className="w-7 h-7 text-blue-100" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            Slovak B2B Lead Generator
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Prihláste sa a získajte prístup k svojmu Pipeline na akomkoľvek zariadení.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl mb-5">
            <button
              data-testid="auth-tab-login"
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === "login" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Prihlásenie
            </button>
            <button
              data-testid="auth-tab-register"
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === "register" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Registrácia
            </button>
          </div>

          {/* Google */}
          <button
            data-testid="google-login-btn"
            type="button"
            onClick={loginWithGoogle}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[46px] rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.46h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.26-2.09 3.59-5.17 3.59-8.72z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.27a12 12 0 0 0 0 10.74l4-3.09z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
            </svg>
            <span>Pokračovať cez Google</span>
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-stone-200 flex-1" />
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">alebo e-mailom</span>
            <div className="h-px bg-stone-200 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Meno</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="register-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ján Novák"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 h-11 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas@email.sk"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 h-11 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Heslo</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Aspoň 8 znakov" : "Vaše heslo"}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 h-11 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            {error && (
              <div data-testid="auth-error" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-3 min-h-[48px] rounded-xl shadow-xs transition-all active:scale-[0.99]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{mode === "login" ? "Prihlásiť sa" : "Vytvoriť účet"}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-5">
          Vaše uložené prospekty sú bezpečne uložené vo vašom účte.
        </p>
      </div>
    </div>
  );
};
