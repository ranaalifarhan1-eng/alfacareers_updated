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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
