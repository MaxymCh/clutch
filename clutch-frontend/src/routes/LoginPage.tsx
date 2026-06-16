import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

export const LoginPage = () => {
  const { session, loading: authLoading } = useAuth();
  if (!authLoading && session) return <Navigate to="/" replace />;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

    if (isSignUp && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) setError(error.message);
      else setMessage('Vérifie tes emails pour confirmer ton compte.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setMessage(null);
    setConfirmPassword('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Bande accent en haut */}
      <div className="h-1 w-full shrink-0 bg-accent" />

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-[360px]">

          {/* Branding */}
          <div className="mb-10 text-center">
            <img src="/SDC-168H.svg" alt="Clutch" className="mx-auto mb-4 size-20 rounded-[22px]" />
            <h1 className="text-[30px] font-black tracking-tighter text-ink leading-none">
              Clutch
            </h1>
            <p className="mt-2 text-[13px] font-medium text-dim">
              {isSignUp ? 'Crée ton compte pour jouer' : 'Bon retour parmi nous'}
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-dim">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="toi@exemple.com"
                className="w-full rounded-2xl border-[1.5px] border-line-2 bg-surface px-4 py-3.5 text-[15px] font-medium text-ink placeholder:text-faint outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-dim">
                  Mot de passe
                </label>
                <span className="text-[11px] font-medium text-faint">Minimum 6 caractères</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border-[1.5px] border-line-2 bg-surface px-4 py-3.5 pr-12 text-[15px] font-medium text-ink placeholder:text-faint outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-faint transition-colors hover:text-dim"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            {/* Confirmation mot de passe — inscription uniquement */}
            {isSignUp && (
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-dim">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border-[1.5px] bg-surface px-4 py-3.5 pr-12 text-[15px] font-medium text-ink placeholder:text-faint outline-none transition-all focus:ring-2 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line-2 focus:border-accent focus:ring-accent/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-faint transition-colors hover:text-dim"
                    aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                  >
                    <Icon name={showConfirm ? 'eye-off' : 'eye'} size={17} strokeWidth={1.8} />
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1.5 pl-1 text-[11px] font-semibold text-red-500">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
            )}

            {/* Messages d'état */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <Icon name="info" size={15} strokeWidth={2} className="mt-px shrink-0 text-red-500" />
                <p className="text-[13px] font-semibold leading-snug text-red-600">{error}</p>
              </div>
            )}
            {message && (
              <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <Icon name="check" size={15} strokeWidth={2.5} className="mt-px shrink-0 text-green-600" />
                <p className="text-[13px] font-semibold leading-snug text-green-700">{message}</p>
              </div>
            )}

            <Button type="submit" full size="lg" disabled={loading} className="mt-1">
              {loading ? 'Chargement…' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
            </Button>
          </form>

          {/* Séparateur */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">ou</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-[1.5px] border-line-2 bg-surface-2 px-4 py-3.5 text-[14px] font-semibold text-ink transition-transform active:scale-[.97] disabled:opacity-50"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          {/* Bascule connexion / inscription */}
          <p className="mt-7 text-center text-[13px] font-medium text-dim">
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button
              onClick={switchMode}
              className="cursor-pointer font-bold text-accent hover:underline"
            >
              {isSignUp ? 'Se connecter' : 'Créer un compte'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
);
