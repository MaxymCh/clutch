import { useState } from 'react';
import { useAgentIcons, valoSlug } from '../../lib/valorant';

type AgentIconProps = {
  agent: string;
  size?: number;
};

/**
 * Icône d'agent Valorant servie depuis le CDN valorant-api.com (résolue par
 * nom). Fallback = pastille texte (2 lettres) si l'image manque ou si l'agent
 * est inconnu, comme TeamLogo.
 */
export const AgentIcon = ({ agent, size = 22 }: AgentIconProps) => {
  const { data: icons } = useAgentIcons();
  const [failed, setFailed] = useState(false);
  const url = icons?.[valoSlug(agent)];

  if (!url || failed) {
    return (
      <span
        title={agent}
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-surface-2 font-bold text-dim"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {agent.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={agent}
      title={agent}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-md object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};
