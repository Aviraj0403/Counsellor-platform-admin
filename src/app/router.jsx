import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import { MODULES } from './modules';
import NotFound from './pages/NotFound';
import RouteError from '../shared/ui/RouteError';

// Routes come from the modules (see app/modules.js). This file never needs to change when a feature is added.
const router = createBrowserRouter([
  ...MODULES.flatMap((m) =>
    (m.publicRoutes ?? []).map((r) => ({
      ...r,
      errorElement: <RouteError />,
    }))
  ),
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      ...MODULES.flatMap((m) =>
        (m.routes ?? []).map((r) => ({
          ...r,
          errorElement: <RouteError />,
        }))
      ),
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
