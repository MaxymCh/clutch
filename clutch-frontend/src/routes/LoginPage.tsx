import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { supabase } from '../lib/supabase';

export const LoginPage = () => {
  const { session, loading: authLoading } = useAuth();
  if (!authLoading && session) return <Navigate to="/" replace />;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        // Le lien de confirmation revient sur l'origine courante (localhost en
        // dev, prod en prod) au lieu du Site URL figé.
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) setError(error.message);
      else setMessage('Vérifie tes emails pour confirmer ton compte.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/icon.svg"
            alt="Clutch"
            className="mx-auto mb-3 h-14 w-14"
          />
          <span className="text-3xl font-black tracking-tight text-[#e2260a]">
            Clutch
          </span>
          <p className="mt-1 text-sm text-gray-500">Calendrier EWC 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e2260a] focus:ring-1 focus:ring-[#e2260a]"
              placeholder="toi@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e2260a] focus:ring-1 focus:ring-[#e2260a]"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#e2260a] py-2.5 text-sm font-semibold text-white hover:bg-[#c41f09] disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : isSignUp ? 'Créer un compte' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuer avec Google
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="font-medium text-[#e2260a] hover:underline"
          >
            {isSignUp ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </div>
    </div>
  );
};
