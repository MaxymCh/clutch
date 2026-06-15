type AvatarProps = {
  /** Initiales / tag ("YOU", "NL"…) */
  tag: string;
  size?: number;
  /** Avatar de l'utilisateur courant → fond orange */
  me?: boolean;
};

/** Avatar monogramme rond (membres de groupes, classements). */
export const Avatar = ({ tag, size = 34, me = false }: AvatarProps) => (
  <span
    className={[
      'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
      me ? 'bg-accent text-on-accent' : 'border border-line-2 bg-surface-2 text-ink-2',
    ].join(' ')}
    style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
  >
    {tag.slice(0, 2)}
  </span>
);
