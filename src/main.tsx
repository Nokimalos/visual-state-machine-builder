import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'font-sans border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
          success: 'border-[hsl(var(--success))]',
          error: 'border-[hsl(var(--destructive))]',
        },
      }}
    />
  </StrictMode>
);
