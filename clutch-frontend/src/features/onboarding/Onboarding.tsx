import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { GamesStep, TeamsStep, WelcomeStep } from './OnboardingSteps';

const STEP_COUNT = 3;

/** Onboarding plein écran au premier lancement (skippable). */
export const Onboarding = ({ onDone }: { onDone: () => void }) => {
  const [step, setStep] = useState(0);
  const last = step === STEP_COUNT - 1;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface">
      <div className="flex h-14 shrink-0 items-center justify-between px-5">
        <div className="flex gap-1.5" aria-label={`Étape ${step + 1} sur ${STEP_COUNT}`}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-[7px] rounded-full transition-all ${
                i === step ? 'w-[22px] bg-accent' : 'w-[7px] bg-line-2'
              }`}
            />
          ))}
        </div>
        <button onClick={onDone} className="cursor-pointer text-[13px] font-semibold text-dim">
          Passer
        </button>
      </div>

      {step === 0 && <WelcomeStep />}
      {step === 1 && <GamesStep />}
      {step === 2 && <TeamsStep />}

      <div className="flex shrink-0 gap-3 px-6 pt-4 pb-7">
        {step > 0 && (
          <Button variant="soft" onClick={() => setStep(step - 1)}>
            <Icon name="back" size={16} strokeWidth={2.1} />
            Retour
          </Button>
        )}
        <Button full onClick={() => (last ? onDone() : setStep(step + 1))}>
          <Icon name={last ? 'check' : 'chevron'} size={16} strokeWidth={2.2} />
          {step === 0 ? 'Commencer' : last ? "C'est parti" : 'Continuer'}
        </Button>
      </div>
    </div>
  );
};
