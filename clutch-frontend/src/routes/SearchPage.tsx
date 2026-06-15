import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { SearchView } from '../features/search/SearchView';

/** Page recherche / filtres avancés : /search */
export const SearchPage = () => (
  <Page>
    <TopBar title="Recherche" />
    <div className="pt-2">
      <SearchView />
    </div>
  </Page>
);
