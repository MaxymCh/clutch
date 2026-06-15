import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { CreateGroupForm } from '../features/prono/GroupForms';

/** Création d'un groupe de pronostics : /prono/group/create */
export const GroupCreatePage = () => (
  <Page>
    <TopBar title="Créer un groupe" />
    <div className="px-5 pt-3">
      <CreateGroupForm />
    </div>
  </Page>
);
