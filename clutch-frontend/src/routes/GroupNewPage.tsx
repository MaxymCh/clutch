import { useState } from 'react';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { Seg } from '../components/ui/Seg';
import { CreateGroupForm, JoinGroupForm } from '../features/prono/GroupForms';

/** Créer ou rejoindre un groupe de pronostics : /prono/group/new */
export const GroupNewPage = () => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  return (
    <Page>
      <TopBar title="Groupe de pronos" />
      <div className="px-5 pt-3">
        <Seg
          full
          value={tab}
          onChange={setTab}
          options={[
            { value: 'create', label: 'Créer un groupe' },
            { value: 'join', label: 'Rejoindre' },
          ]}
        />
        {tab === 'create' ? <CreateGroupForm /> : <JoinGroupForm />}
      </div>
    </Page>
  );
};
