import { UserCog } from 'lucide-react';
import Account from './pages/Account';
import Signin from './pages/Signin';

export default {
  key: 'auth',
  publicRoutes: [{ path: '/signin', element: <Signin /> }],
  routes: [{ path: '/account', element: <Account /> }],
  nav: [{ section: 'Account', order: 10, to: '/account', label: 'My account', labelKey: 'nav.account', icon: UserCog }],
};
