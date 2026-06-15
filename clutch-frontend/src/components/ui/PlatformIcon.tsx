/** Logos de marque des plateformes de stream (glyphes officiels, couleur marque). */

type Brand = { color: string; path: string };

const BRANDS: Record<string, Brand> = {
  twitch: {
    color: '#9146FF',
    path: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z',
  },
  youtube: {
    color: '#FF0000',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z',
  },
  kick: {
    color: '#53FC18',
    path: 'M1.333 0h8v5.333h2.667V2.667h2.667V0h8v8h-2.667v2.667h-2.666v2.666h2.666V16h2.667v8h-8v-2.667h-2.667v-2.666H9.333V24h-8z',
  },
};

type PlatformIconProps = {
  platform: string;
  size?: number;
};

/** Logo de la plateforme ; fallback = glyphe « diffusion » en couleur de thème. */
export const PlatformIcon = ({ platform, size = 18 }: PlatformIconProps) => {
  const brand = BRANDS[platform.toLowerCase()];

  if (!brand) {
    // Plateforme inconnue : pictogramme neutre (token de thème).
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-dim">
        <path
          d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-7l-4 3v-3H4a1 1 0 01-1-1V6a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={brand.color} aria-hidden="true">
      <path d={brand.path} />
    </svg>
  );
};
