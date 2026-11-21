import { createContext } from 'react';

/** Set by the app shell: the menu icon + accent tone of the page being shown, so every PageHeader gets a matching icon chip for free. */
export const PageMetaContext = createContext(null);
