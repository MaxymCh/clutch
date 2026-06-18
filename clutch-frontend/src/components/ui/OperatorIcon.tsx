import { useState } from 'react';

const opSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .normalize('NFD')        // décompose ã → a + combining tilde, ä → a + umlaut…
    .replace(/[^a-z0-9]/g, ''); // supprime les diacritiques et espaces

export const OperatorIcon = ({ name, size = 28 }: { name: string; size?: number }) => {
  const [failed, setFailed] = useState(false);
  const src = `/operators/${opSlug(name)}.png`;

  if (failed) {
    return (
      <span
        title={name}
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-surface-2 font-bold text-dim"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      title={name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-md object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};
