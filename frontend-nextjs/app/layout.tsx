import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'MovieXplorer - Discover Movies, Actors & Directors',
  description: 'Explore a vast collection of movies, talented actors, and acclaimed directors',
  keywords: ['movies', 'actors', 'directors', 'cinema', 'entertainment'],
  authors: [{ name: 'MovieXplorer Team' }],
  openGraph: {
    title: 'MovieXplorer',
    description: 'Discover amazing movies, actors, and directors',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
