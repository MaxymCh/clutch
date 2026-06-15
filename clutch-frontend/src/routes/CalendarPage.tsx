import { Header } from '../components/layout/Header';
import { Page } from '../components/layout/Page';
import { CalendarView } from '../features/calendar/CalendarView';

/** Page d'accueil : le calendrier unifié des matchs. */
export const CalendarPage = () => (
  <Page>
    <Header />
    <CalendarView />
  </Page>
);
