type SpinnerProps = {
  size?: number;
  /** Libellé annoncé aux lecteurs d'écran */
  label?: string;
};

/** Indicateur de chargement — anneau orange. */
export const Spinner = ({ size = 28, label = 'Chargement…' }: SpinnerProps) => (
  <span role="status" aria-label={label} className="inline-flex">
    <span
      className="animate-spin rounded-full border-[3px] border-line border-t-accent"
      style={{ width: size, height: size }}
    />
  </span>
);

/** Spinner centré pour un état de chargement pleine page. */
export const PageSpinner = () => (
  <div className="flex justify-center py-20">
    <Spinner />
  </div>
);
