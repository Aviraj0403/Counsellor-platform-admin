import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import { MODULES } from './modules';
import NotFound from './pages/NotFound';

// Routes come from the modules (see app/modules.js). This file never needs to change when a feature is added.
const router = createBrowserRouter([
  ...MODULES.flatMap((m) => m.publicRoutes ?? []),
  {
    element: <Layout />,
    children: [...MODULES.flatMap((m) => m.routes ?? []), { path: '*', element: <NotFound /> }],
  },
]);

export default router;
