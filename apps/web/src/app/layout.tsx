import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AlfaCareers | The Hidden Job Market Engine',
  description: 'AI-powered job discovery and autonomous career co-pilot. Surface un-syndicated roles directly from corporate career pages.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-bg text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
