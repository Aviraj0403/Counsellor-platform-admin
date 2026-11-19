import { Globe } from 'lucide-react';
import { Guard } from '../auth';
import SeoPages from './pages/SeoPages';
import SeoSettings from './pages/SeoSettings';

export default {
  key: 'seoPages',
  routes: [
    { path: '/seo', element: <Guard scope="tenant" perm="seo:manage" module="seoPages"><SeoSettings /></Guard> },
    { path: '/seo/pages', element: <Guard scope="tenant" perm="seo:manage" module="seoPages"><SeoPages /></Guard> },
  ],
  nav: [
    { section: 'Marketing and channels', order: 30, to: '/seo', label: 'Public website', icon: Globe, scope: 'tenant', perm: 'seo:manage', module: 'seoPages' },
    { section: 'Marketing and channels', order: 31, to: '/seo/pages', label: 'College pages (SEO)', icon: Globe, scope: 'tenant', perm: 'seo:manage', module: 'seoPages' },
  ],
};
