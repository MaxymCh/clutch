import { useState } from 'react';
import { ApiError } from '../../api/client';
import { useUpdateUser } from '../../api/queries/useUser';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useAuth } from '../auth/authContext';
import { GamesStep, PseudoStep, TeamsStep } from './OnboardingSteps';

const STEP_COUNT = 3;

const prefillFromAuth = (email?: string | null, fullName?: string | null): string => {
  if (fullName) return fullName;
  if (email) return email.split('@')[0].replace(/[._-]+/g, ' ');
  return '';
};

/** Onboarding plein écran au premier lancement. */
export const Onboarding = ({ onDone }: { onDone: () => void }) => {
  const { user: authUser } = useAuth();
  const { mutateAsync: updateUser } = useUpdateUser();

  const [step, setStep] = useState(0);
  const [pseudo, setPseudo] = useState(
    prefillFromAuth(authUser?.email, authUser?.user_metadata?.full_name),
  );
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const last = step === STEP_COUNT - 1;
  const pseudoValid = pseudo.trim().length >= 2;
  const canContinue = step === 0 ? pseudoValid : true;

  const savePseudo = async (): Promise<boolean> => {
    try {
      await updateUser({ name: pseudo.trim() });
      setPseudoError(null);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setPseudoError('Ce pseudo est déjà pris, choisis-en un autre.');
      } else {
        setPseudoError('Erreur réseau, réessaie.');
      }
      return false;
    }
  };

  const finish = () => onDone();

  const handleNext = async () => {
    if (step === 0) {
      setSaving(true);
      const ok = await savePseudo();
      setSaving(false);
      if (ok) setStep(1);
    } else if (last) {
      finish();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface">
      {/* Barre de progression */}
      <div className="flex h-14 shrink-0 items-center justify-between px-5">
        <div className="flex gap-1.5" aria-label={`Étape ${step + 1} sur ${STEP_COUNT}`}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-[7px] rounded-full transition-all duration-300 ${
                i < step
                  ? 'w-[7px] bg-accent/40'
                  : i === step
                    ? 'w-[22px] bg-accent'
                    : 'w-[7px] bg-line-2'
              }`}
            />
          ))}
        </div>
        <button
          onClick={finish}
          disabled={saving}
          className="cursor-pointer text-[13px] font-semibold text-dim disabled:opacity-40"
        >
          Passer
        </button>
      </div>

      {step === 0 && <PseudoStep pseudo={pseudo} onChange={(v) => { setPseudo(v); setPseudoError(null); }} error={pseudoError} />}
      {step === 1 && <GamesStep />}
      {step === 2 && <TeamsStep />}

      {/* Navigation */}
      <div className="flex shrink-0 gap-3 px-6 pt-4 pb-7">
        {step > 0 && (
          <Button variant="soft" onClick={() => setStep(step - 1)} disabled={saving}>
            <Icon name="back" size={16} strokeWidth={2.1} />
            Retour
          </Button>
        )}
        <Button full onClick={handleNext} disabled={!canContinue || saving}>
          <Icon name={last ? 'check' : 'chevron'} size={16} strokeWidth={2.2} />
          {step === 0 ? 'Continuer' : last ? "C'est parti !" : 'Continuer'}
        </Button>
      </div>
    </div>
  );
};
