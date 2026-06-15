import { useState } from "react";
import { useGroups } from "../api/queries/useGroups";
import { useLeaderboard } from "../api/queries/useLeaderboard";
import { useUser } from "../api/queries/useUser";
import { Page } from "../components/layout/Page";
import { TopBar } from "../components/layout/TopBar";
import { PageSpinner } from "../components/ui/Spinner";
import { Seg } from "../components/ui/Seg";
import { RankRow } from "../features/prono/RankRow";
import { StatCard } from "../features/prono/StatCard";
import type { GroupMember } from "../types/community";

/** Tous les amis (membres de mes groupes), dédupliqués, triés par points. */
const dedupeFriends = (members: GroupMember[]): GroupMember[] => {
  const byName = new Map<string, GroupMember>();
  for (const m of members) {
    const known = byName.get(m.name);
    if (!known || known.points < m.points) byName.set(m.name, m);
  }
  return [...byName.values()].sort((a, b) => b.points - a.points);
};

/** Classement des pronostiqueurs : /prono/classement (amis + mondial). */
export const LeaderboardPage = () => {
  const [tab, setTab] = useState<"friends" | "global">("friends");
  const { data: groups } = useGroups();
  const { data: global, isPending } = useLeaderboard();
  const { data: user } = useUser();

  const friends = dedupeFriends((groups ?? []).flatMap((g) => g.members));

  return (
    <Page>
      <TopBar title="Classement" />
      {user && (
        <div className="px-5 pt-3 pb-4">
          <StatCard user={user} />
        </div>
      )}
      <div className="px-5 pt-3">
        <Seg
          full
          value={tab}
          onChange={setTab}
          options={[
            { value: "friends", label: "Mes amis" },
            { value: "global", label: "Mondial" },
          ]}
        />
        <div className="mt-4">
          {tab === "friends" &&
            friends.map((m, i) => (
              <RankRow
                key={m.name}
                rank={i + 1}
                name={m.name}
                tag={m.tag}
                points={m.points}
                isMe={m.isMe}
                topHighlight={i < 3}
              />
            ))}
          {tab === "global" && isPending && <PageSpinner />}
          {tab === "global" && global && (
            <>
              {global.map((entry) => (
                <RankRow
                  key={entry.rank}
                  {...entry}
                  topHighlight={entry.rank <= 3}
                />
              ))}
              <p className="py-2 text-center text-lg font-semibold text-faint">
                ···
              </p>
              {user && (
                <RankRow
                  rank={user.globalRank}
                  name={user.name}
                  tag={user.tag}
                  points={user.points}
                  countryCode={user.countryCode}
                  isMe
                />
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
};
