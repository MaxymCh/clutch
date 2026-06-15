import { PlatformIcon } from '../../components/ui/PlatformIcon';
import type { Stream } from '../../types/esports';

/** Liens de diffusion du match (Twitch, YouTube…) — chips ouverts dans un onglet. */
export const MatchStreams = ({ streams }: { streams: Stream[] }) => {
  if (streams.length === 0) return null;
  return (
    <section className="px-5 pt-5">
      <h2 className="pb-2 text-[13px] font-bold tracking-wide text-dim uppercase">Où regarder</h2>
      <div className="flex flex-wrap gap-2">
        {streams.map((stream) => (
          <a
            key={stream.url}
            href={stream.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pr-3.5 pl-3 text-[13px] font-semibold tracking-tight text-ink shadow-card transition-transform active:scale-[.96]"
          >
            <PlatformIcon platform={stream.platform} size={18} />
            {stream.platform}
          </a>
        ))}
      </div>
    </section>
  );
};
