import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'EventFlow — 2D Event Layout Planner',
  description: 'Professional event layout planning, drag-and-drop canvas editor, and collaboration platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#181932',
              color: '#eeeef8',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#181932' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#181932' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
