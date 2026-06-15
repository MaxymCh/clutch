import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { JoinGroupForm } from '../features/prono/GroupForms';

/** Rejoindre un groupe de pronostics : /prono/group/join */
export const GroupJoinPage = () => (
  <Page>
    <TopBar title="Rejoindre un groupe" />
    <div className="px-5 pt-3">
      <JoinGroupForm />
    </div>
  </Page>
);
