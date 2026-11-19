import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../modules/auth';
import LanguageProvider from '../shared/i18n/LanguageProvider';
import ThemeProvider from '../shared/theme/ThemeProvider';
import router from './router';
import './index.css';

// Toasts use the theme tokens so they follow the colour theme and light/dark mode.
const toastStyle = { background: 'var(--surface-solid)', color: 'var(--fg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-pop)', fontSize: '13px' };

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" toastOptions={{ style: toastStyle }} />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
