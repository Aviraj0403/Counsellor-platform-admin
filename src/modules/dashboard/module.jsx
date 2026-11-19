import { Home } from 'lucide-react';
import Dashboard from './pages/Dashboard';

export default {
  key: 'dashboard',
  routes: [{ path: '/', element: <Dashboard /> }],
  nav: [{ section: 'Overview', order: 0, to: '/', label: 'Home', labelKey: 'nav.home', icon: Home, end: true }],
};
